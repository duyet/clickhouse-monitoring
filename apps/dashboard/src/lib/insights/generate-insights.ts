/**
 * Insight generation orchestrator.
 *
 * Pipeline: collect (deterministic) → enrich (optional LLM) → persist (findings
 * store). Returns the generated insight cards. Best-effort throughout: a
 * read-only cluster or missing LLM key degrades gracefully rather than throwing,
 * so both the manual "Refresh" endpoint and the cron sweep can call it safely.
 */

import type { InsightCard } from './types'

import { collectInsights } from './collectors'
import { enrichInsights } from './llm-enrich'
import { resolveInsightsStore } from './store/resolve-store'
import { insightKey } from './types'

const SOURCE = 'ai-insight'

/**
 * Generate, persist, and return AI insights for a host.
 * Never throws — returns an empty array on any unexpected failure.
 */
export async function generateInsights(hostId: number): Promise<InsightCard[]> {
  try {
    const candidates = await collectInsights(hostId)
    if (candidates.length === 0) return []

    const enriched = await enrichInsights(candidates)
    const generatedAt = new Date().toISOString()

    // Persist the batch through the configured backend (ClickHouse by default;
    // D1 / Postgres / AgentState / Memory via INSIGHTS_STORE_BACKEND). The store
    // is best-effort — a read-only cluster or missing binding degrades silently.
    const store = await resolveInsightsStore()
    await store.record(
      hostId,
      enriched.map((c) => ({
        severity: c.severity,
        category: c.category,
        source: SOURCE,
        title: c.title,
        detail: c.detail,
        metric: c.metric,
        value: c.value,
      }))
    )

    return enriched.map((c) => ({
      ...c,
      key: insightKey(hostId, c),
      generatedAt,
    }))
  } catch {
    return []
  }
}
