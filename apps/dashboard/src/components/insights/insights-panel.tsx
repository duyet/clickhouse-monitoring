import { Database, RefreshCw, Settings2, Sparkles, X } from 'lucide-react'

import { useState } from 'react'
import { InsightCard } from '@/components/insights/insight-card'
import { AppLink } from '@/components/ui/app-link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  INSIGHTS_BACKEND_LABELS,
  useInsightsBackend,
} from '@/lib/hooks/use-insights-backend'
import { useInsights } from '@/lib/query/use-insights'
import { buildUrl } from '@/lib/url/url-builder'
import { cn } from '@/lib/utils'

interface InsightsPanelProps {
  hostId: number
  className?: string
}

/**
 * AI-suggested insights for the current host. Insights are generated + cached
 * server-side (findings store) and refreshed by the cron sweep; the operator can
 * regenerate on demand and dismiss individual cards (persisted per-user in
 * localStorage). Renders an unobtrusive CTA when there is nothing to show.
 */
export function InsightsPanel({ hostId, className }: InsightsPanelProps) {
  const {
    insights,
    counts,
    isLoading,
    isGenerating,
    refresh,
    generate,
    dismiss,
    dismissAll,
  } = useInsights(hostId)
  const [showAll, setShowAll] = useState(false)

  const hasInsights = insights.length > 0
  const VISIBLE = 6
  const visible = showAll ? insights : insights.slice(0, VISIBLE)

  // Empty + idle → slim CTA row, so the panel never shows an empty box.
  if (!hasInsights && !isLoading) {
    return (
      <section
        className={cn(
          'flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3',
          className
        )}
        aria-label="AI insights"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-sky-500" />
          <span>
            No AI insights right now. Generate a fresh analysis of this cluster.
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={generate}
            disabled={isGenerating}
          >
            <RefreshCw
              className={cn('size-3.5', isGenerating && 'animate-spin')}
            />
            {isGenerating ? 'Generating…' : 'Generate insights'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            aria-label="AI Insights settings"
            asChild
          >
            <AppLink href={buildUrl('/insights-settings', { host: hostId })}>
              <Settings2 className="size-3.5" />
            </AppLink>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section
      className={cn('flex flex-col gap-3', className)}
      aria-label="AI insights"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-sky-500" />
          <h2 className="text-sm font-semibold text-foreground">AI Insights</h2>
          {counts.critical > 0 ? (
            <Badge className="border-transparent bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
              {counts.critical} critical
            </Badge>
          ) : null}
          {counts.warning > 0 ? (
            <Badge className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              {counts.warning} warning
            </Badge>
          ) : null}
          {counts.info > 0 ? (
            <Badge variant="secondary">
              {counts.info} tip{counts.info > 1 ? 's' : ''}
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              generate()
              refresh()
            }}
            disabled={isGenerating}
          >
            <RefreshCw
              className={cn('size-3.5', isGenerating && 'animate-spin')}
            />
            {isGenerating ? 'Refreshing…' : 'Refresh'}
          </Button>
          {hasInsights ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={dismissAll}
            >
              <X className="size-3.5" />
              Dismiss all
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            aria-label="AI Insights settings"
            asChild
          >
            <AppLink href={buildUrl('/insights-settings', { host: hostId })}>
              <Settings2 className="size-3.5" />
            </AppLink>
          </Button>
        </div>
      </div>

      {isLoading && !hasInsights ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((insight) => (
              <InsightCard
                key={insight.key}
                insight={insight}
                hostId={hostId}
                onDismiss={dismiss}
              />
            ))}
          </div>
          {insights.length > VISIBLE ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll
                  ? 'Show fewer'
                  : `Show ${insights.length - VISIBLE} more`}
              </Button>
            </div>
          ) : null}
          <InsightsStorageFooter />
        </>
      )}
    </section>
  )
}

/**
 * Read-only footer naming where insights are persisted. The backend is fixed at
 * deploy time via INSIGHTS_STORE_BACKEND, so nothing here is editable — it just
 * makes the active store visible, mirroring the agent's conversation-history
 * panel.
 */
function InsightsStorageFooter() {
  const { backend, isLoading } = useInsightsBackend()
  if (isLoading) return null

  return (
    <p className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
      <Database className="size-3 shrink-0" />
      <span>
        Stored in {INSIGHTS_BACKEND_LABELS[backend]} · configured at deploy time
      </span>
    </p>
  )
}
