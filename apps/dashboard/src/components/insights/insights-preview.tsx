'use client'

/**
 * AI Insights settings preview.
 *
 * Runs insight generation with the operator's *current* settings (model / prompt
 * style / enrichment) via an isolated mutation — it never touches the overview
 * panel's TanStack Query cache, so the settings page acts as a sandbox for
 * A/B-ing prompt styles and models before relying on them. Results render with
 * the same `InsightCard` the overview panel uses.
 */

import { FlaskConical, RefreshCw } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'

import type { InsightCard as InsightCardData } from '@/lib/insights/types'

import { useState } from 'react'
import { InsightCard } from '@/components/insights/insight-card'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { generateParamsFromSettings } from '@/lib/insights/settings'
import { useInsightsSettings } from '@/lib/query/use-insights-settings'
import { apiFetch } from '@/lib/swr/api-fetch'

interface PreviewResponse {
  insights: InsightCardData[]
  count: number
}

export function InsightsPreview({ hostId }: { hostId: number }) {
  const { settings } = useInsightsSettings()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const preview = useMutation({
    mutationFn: async (): Promise<PreviewResponse> => {
      const params = generateParamsFromSettings(hostId, settings)
      const res = await apiFetch(`/api/v1/insights/generate?${params}`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to generate preview')
      return res.json()
    },
    onMutate: () => setDismissed(new Set()),
  })

  const results = (preview.data?.insights ?? []).filter(
    (i) => !dismissed.has(i.key)
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="size-4 text-violet-500" />
              Preview
            </CardTitle>
            <CardDescription>
              Generate insights with the settings above to see their effect.
              This does not change the overview panel.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => preview.mutate()}
            disabled={preview.isPending}
          >
            <RefreshCw
              className={
                preview.isPending ? 'size-3.5 animate-spin' : 'size-3.5'
              }
            />
            {preview.isPending ? 'Generating…' : 'Preview insights'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {preview.isError ? (
          <p className="text-sm text-destructive">
            Could not generate a preview. The cluster may be unreachable or
            read-only.
          </p>
        ) : preview.isSuccess && results.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No insights for this cluster right now — nothing notable to report.
          </p>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {results.map((insight) => (
              <InsightCard
                key={insight.key}
                insight={insight}
                hostId={hostId}
                onDismiss={(i) =>
                  setDismissed((prev) => new Set(prev).add(i.key))
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Click “Preview insights” to run a one-off generation with your
            current model and prompt style.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
