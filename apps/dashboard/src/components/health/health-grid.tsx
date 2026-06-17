import { RefreshCw } from 'lucide-react'

import type { ReactNode } from 'react'
import type { HealthStatus } from '@/lib/health/health-status'
import type { HistoryMap } from '@/lib/health/history-storage'
import type { HealthCounts } from './health-summary-banner'

import { HealthCard } from './health-card'
import { HEALTH_CHECKS } from './health-checks'
import { HealthSummaryBanner } from './health-summary-banner'
import { RunningMutationsCard, StuckMutationsCard } from './mutations-cards'
import { EMPTY_STATE, useHealthChecks } from './use-health-checks'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { dispatchAlert, isEscalation } from '@/lib/health/alert-dispatcher'
import {
  computeCheckStatus,
  computeRunningMutations,
  computeStuckMutations,
  SEVERITY_RANK,
} from '@/lib/health/health-status'
import {
  appendPoint,
  historyKey,
  loadHistory,
  saveHistory,
} from '@/lib/health/history-storage'
import { loadThresholds } from '@/lib/health/thresholds-storage'
import { useHostId } from '@/lib/swr'
import { cn } from '@/lib/utils'

const STUCK_MUTATIONS_CHART = 'summary-stuck-mutations'
const RUNNING_MUTATIONS_CHART = 'summary-used-by-mutations'

type Filter = 'all' | 'issues' | 'healthy'

interface GridItem {
  /** Stable id: history key, react key, and alert checkId. */
  id: string
  status: HealthStatus
  /** Numeric value tracked in the sparkline history (null when unavailable). */
  sparkValue: number | null
  /** Original definition order, used as a stable tiebreak when sorting. */
  order: number
  /** Alert payload, dispatched on escalation regardless of the active filter. */
  alert: { title: string; value: number | null; label: string }
  render: (spark: number[] | undefined) => ReactNode
}

/** Short "Ns ago" relative label for the auto-refresh indicator. */
function formatAgo(deltaMs: number): string {
  const s = Math.max(0, Math.floor(deltaMs / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

export function HealthGrid() {
  const hostId = useHostId()
  const [overrides, setOverrides] = useState<
    Record<string, { warning: number; critical: number }>
  >({})
  const [filter, setFilter] = useState<Filter>('all')
  const [history, setHistory] = useState<HistoryMap>(() => loadHistory())

  useEffect(() => {
    setOverrides(loadThresholds())
    const handler = () => setOverrides(loadThresholds())
    window.addEventListener('health-thresholds-changed', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('health-thresholds-changed', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  // Every card's chart name, fetched together in one request.
  const chartNames = useMemo(
    () => [
      ...HEALTH_CHECKS.map((c) => c.chartName),
      STUCK_MUTATIONS_CHART,
      RUNNING_MUTATIONS_CHART,
    ],
    []
  )

  const { results, isLoading, isValidating, dataUpdatedAt } = useHealthChecks(
    chartNames,
    hostId
  )

  // Resolve every card's status up-front so the grid can sort, count, and
  // filter — the cards themselves only render the result.
  const items = useMemo<GridItem[]>(() => {
    const list: GridItem[] = []
    let order = 0

    for (const check of HEALTH_CHECKS) {
      const thresholds = overrides[check.id] ?? check.defaults
      const result = results[check.chartName] ?? EMPTY_STATE
      const computed = computeCheckStatus(check, thresholds, result, isLoading)
      list.push({
        id: check.id,
        status: computed.status,
        sparkValue: computed.value,
        order: order++,
        alert: {
          title: check.title,
          value: computed.value,
          label: computed.label,
        },
        render: (spark) => (
          <HealthCard
            key={check.id}
            check={check}
            thresholds={thresholds}
            hostId={hostId}
            computed={computed}
            spark={spark}
            clickhouseVersion={result.clickhouseVersion}
          />
        ),
      })
    }

    const stuck = computeStuckMutations(
      results[STUCK_MUTATIONS_CHART] ?? EMPTY_STATE,
      isLoading
    )
    list.push({
      id: 'stuck-mutations',
      status: stuck.status,
      sparkValue: stuck.value,
      order: order++,
      alert: {
        title: 'Stuck Mutations',
        value: stuck.value,
        label: stuck.label,
      },
      render: (spark) => (
        <StuckMutationsCard
          key="stuck-mutations"
          hostId={hostId}
          computed={stuck}
          spark={spark}
        />
      ),
    })

    const running = computeRunningMutations(
      results[RUNNING_MUTATIONS_CHART] ?? EMPTY_STATE,
      isLoading
    )
    list.push({
      id: 'running-mutations',
      status: running.status,
      sparkValue: running.value,
      order: order++,
      alert: {
        title: 'Running Mutations',
        value: running.value,
        label: running.label,
      },
      render: (spark) => (
        <RunningMutationsCard
          key="running-mutations"
          hostId={hostId}
          computed={running}
          spark={spark}
        />
      ),
    })

    return list
  }, [results, overrides, isLoading, hostId])

  // Keep the latest items reachable from refresh-gated effects without
  // re-running them on every render.
  const itemsRef = useRef(items)
  itemsRef.current = items

  // Append a real observed value to each sparkline buffer once per refresh.
  useEffect(() => {
    if (isLoading || dataUpdatedAt === 0) return
    setHistory((prev) => {
      const next = { ...prev }
      let changed = false
      for (const item of itemsRef.current) {
        if (item.sparkValue === null || !Number.isFinite(item.sparkValue)) {
          continue
        }
        next[historyKey(hostId, item.id)] = appendPoint(
          prev[historyKey(hostId, item.id)],
          item.sparkValue
        )
        changed = true
      }
      if (!changed) return prev
      saveHistory(next)
      return next
    })
  }, [dataUpdatedAt, hostId, isLoading])

  // Dispatch alerts on escalation for ALL checks, independent of the filter, so
  // hiding a card never silences (or, on remount, re-fires) its alert.
  const lastStatusRef = useRef<
    Record<string, 'ok' | 'warning' | 'critical' | null>
  >({})
  useEffect(() => {
    // `dataUpdatedAt` re-runs this on each refresh; skip before the first fetch.
    if (isLoading || dataUpdatedAt === 0) return
    for (const item of itemsRef.current) {
      const s = item.status
      if (s !== 'ok' && s !== 'warning' && s !== 'critical') continue
      const prev = lastStatusRef.current[item.id] ?? null
      if (isEscalation(prev, s) && s !== 'ok') {
        void dispatchAlert({
          checkId: item.id,
          title: item.alert.title,
          severity: s,
          value: item.alert.value,
          label: item.alert.label,
          hostId,
        })
      }
      lastStatusRef.current[item.id] = s
    }
  }, [dataUpdatedAt, hostId, isLoading])

  const counts = useMemo<HealthCounts>(() => {
    const c: HealthCounts = { critical: 0, warning: 0, ok: 0 }
    for (const item of items) {
      if (item.status === 'critical') c.critical++
      else if (item.status === 'warning') c.warning++
      else if (item.status === 'ok') c.ok++
    }
    return c
  }, [items])

  const visible = useMemo(() => {
    const matches = (s: HealthStatus) =>
      filter === 'all'
        ? true
        : filter === 'issues'
          ? s === 'critical' || s === 'warning'
          : s === 'ok'
    return items
      .filter((i) => matches(i.status))
      .sort(
        (a, b) =>
          SEVERITY_RANK[a.status] - SEVERITY_RANK[b.status] || a.order - b.order
      )
  }, [items, filter])

  // Live "checked Ns ago" label, refreshed on a light cadence.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <HealthSummaryBanner counts={counts} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All {items.length}</TabsTrigger>
            <TabsTrigger value="issues">
              Needs attention {counts.critical + counts.warning}
            </TabsTrigger>
            <TabsTrigger value="healthy">Healthy {counts.ok}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw
            className={cn('size-3.5', isValidating && 'animate-spin')}
            aria-hidden
          />
          <span>
            Auto-refresh
            {dataUpdatedAt > 0 &&
              ` · checked ${formatAgo(now - dataUpdatedAt)}`}
          </span>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          {filter === 'issues'
            ? 'Nothing needs attention right now.'
            : 'No checks in this view.'}
        </div>
      ) : (
        <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
          {visible.map((item) =>
            item.render(history[historyKey(hostId, item.id)])
          )}
        </div>
      )}
    </div>
  )
}
