/**
 * Insight generation orchestrator.
 *
 * Pipeline: collect (deterministic) → enrich (optional LLM) → persist (findings
 * store). Returns the generated insight cards. Best-effort throughout: a
 * read-only cluster or missing LLM key degrades gracefully rather than throwing,
 * so both the manual "Refresh" endpoint and the cron sweep can call it safely.
 */

import type { InsightCard } from './types'

import { recordFinding } from '../findings/findings-store'
import { collectInsights } from './collectors'
import { enrichInsights } from './llm-enrich'
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

    // Persist each insight (best-effort; failures are swallowed by recordFinding).
    await Promise.all(
      enriched.map((c) =>
        recordFinding(hostId, {
          severity: c.severity,
          category: c.category,
          source: SOURCE,
          title: c.title,
          detail: c.detail,
          metric: c.metric,
          value: c.value,
        })
      )
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
