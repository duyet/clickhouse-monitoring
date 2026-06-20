/**
 * AI Insights hook.
 *
 * Reads AI-generated insight cards for a host (GET /api/v1/insights), filters
 * out user-dismissed cards (localStorage), and exposes dismiss / dismissAll /
 * refresh plus a `generate()` mutation that triggers on-demand regeneration
 * (POST /api/v1/insights/generate) and revalidates.
 *
 * Modeled on lib/swr/use-notifications.ts. Insights are not 30s-critical, so the
 * background refresh is slow and the UI primarily refreshes on demand.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { InsightCard } from '@/lib/insights/types'

import { useCallback, useMemo, useState } from 'react'
import {
  dismissAllInsights,
  dismissInsight,
  filterActiveInsights,
} from '@/lib/insights/dismissed-insights'
import { generateParamsFromSettings } from '@/lib/insights/settings'
import { useInsightsSettings } from '@/lib/query/use-insights-settings'
import { apiFetch } from '@/lib/swr/api-fetch'
import { REFRESH_INTERVAL } from '@/lib/swr/config'

interface InsightsResponse {
  insights: InsightCard[]
  count: number
}

export interface UseInsightsResult {
  readonly insights: readonly InsightCard[]
  readonly counts: { critical: number; warning: number; info: number }
  isLoading: boolean
  isGenerating: boolean
  error?: Error
  refresh: () => void
  generate: () => void
  dismiss: (insight: InsightCard) => void
  dismissAll: () => void
}

export function useInsights(hostId: number): UseInsightsResult {
  const queryClient = useQueryClient()
  const { settings } = useInsightsSettings()
  const { window: readWindow } = settings

  // The read window is part of the cache key so changing it refetches.
  const queryKey = useMemo(
    () => [`/api/v1/insights?host=${hostId}`, readWindow],
    [hostId, readWindow]
  )

  const { data, error, isLoading } = useQuery<InsightsResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        host: String(hostId),
        since: readWindow,
      })
      const res = await apiFetch(`/api/v1/insights?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch insights')
      return res.json()
    },
    refetchInterval: REFRESH_INTERVAL.SLOW_2M,
    staleTime: 60_000,
    retry: 1,
  })

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey }),
    [queryClient, queryKey]
  )

  // Insights returned by the most recent manual generate(). The persisted read
  // (findings store) is best-effort and silently no-ops on read-only clusters,
  // so we render what `generate` just produced directly — otherwise a successful
  // generation would show nothing when persistence is unavailable.
  const [sessionInsights, setSessionInsights] = useState<
    readonly InsightCard[]
  >([])

  const generateMutation = useMutation({
    mutationFn: async (): Promise<InsightsResponse> => {
      const params = generateParamsFromSettings(hostId, settings)
      const res = await apiFetch(`/api/v1/insights/generate?${params}`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to generate insights')
      return res.json()
    },
    onSuccess: (result) => {
      setSessionInsights(result?.insights ?? [])
      invalidate()
    },
  })

  // Merge persisted (read) + freshly generated (session); de-dupe by stable key
  // with the just-generated copy winning. Then drop user-dismissed cards.
  const merged = useMemo(() => {
    const byKey = new Map<string, InsightCard>()
    for (const i of data?.insights ?? []) byKey.set(i.key, i)
    for (const i of sessionInsights) byKey.set(i.key, i)
    return Array.from(byKey.values())
  }, [data, sessionInsights])

  const insights = filterActiveInsights(merged)

  const counts = insights.reduce(
    (acc, i) => {
      acc[i.severity] += 1
      return acc
    },
    { critical: 0, warning: 0, info: 0 }
  )

  const dismiss = useCallback(
    (insight: InsightCard) => {
      dismissInsight(insight)
      invalidate()
    },
    [invalidate]
  )

  const dismissAll = useCallback(() => {
    dismissAllInsights(insights)
    setSessionInsights([])
    invalidate()
  }, [insights, invalidate])

  return {
    insights,
    counts,
    isLoading,
    isGenerating: generateMutation.isPending,
    error: error ?? undefined,
    refresh: invalidate,
    generate: () => generateMutation.mutate(),
    dismiss,
    dismissAll,
  }
}
