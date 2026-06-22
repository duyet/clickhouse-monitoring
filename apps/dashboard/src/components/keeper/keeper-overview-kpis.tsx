import {
  Activity,
  Crown,
  Database,
  Eye,
  Gauge,
  Layers,
  Network,
  Users,
} from 'lucide-react'

import { memo } from 'react'
import { KpiCard } from '@/components/overview-charts/kpi-card'
import { useChartData } from '@/lib/query/use-chart-data'
import { REFRESH_INTERVAL, useHostId } from '@/lib/swr'
import { cn } from '@/lib/utils'

interface KeeperHealthRow {
  alive_connections: number
  outstanding_requests: number
  sessions: number
  watches: number
  in_flight_requests: number
  session_expired: number
  connection_loss_ts: number
  [key: string]: unknown
}

interface KeeperInfoSummaryRow {
  nodes: number
  leaders: number
  server_state: string
  max_log_lag: number
  followers: number
  synced_followers: number
  znode_count: number
  watch_count: number
  ephemerals_count: number
  data_size: number
  readable_data_size: string
  avg_latency_ms: number
  [key: string]: unknown
}

const DASH = '—'

/**
 * Keeper Overview KPI grid.
 *
 * Top row: real-time liveness from system.metrics (always available — these
 * metrics exist with value 0 even when Keeper is unused). Bottom row:
 * cluster-consistency from system.zookeeper_info, which only exists on recent
 * ClickHouse releases — those cards fall back to "—" when the table is absent.
 */
export const KeeperOverviewKpis = memo(function KeeperOverviewKpis({
  className,
}: {
  className?: string
}) {
  const hostId = useHostId()

  const health = useChartData<KeeperHealthRow>({
    chartName: 'keeper-health',
    hostId,
    refreshInterval: REFRESH_INTERVAL.FAST_15S,
  })
  const summary = useChartData<KeeperInfoSummaryRow>({
    chartName: 'keeper-info-summary',
    hostId,
    refreshInterval: REFRESH_INTERVAL.SLOW_2M,
  })

  const h = health.data?.[0]
  const s = summary.data?.[0]
  // zookeeper_info missing (older ClickHouse / not configured) → consistency
  // cards show "—" rather than an error.
  const hasSummary = !summary.error && !!s

  const connected =
    (h?.sessions ?? 0) >= 1 && (h?.connection_loss_ts ?? 0) === 0

  return (
    <div className={cn('flex flex-col gap-2 sm:gap-3', className)}>
      <div className="grid auto-rows-fr grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2 md:grid-cols-4">
        <KpiCard
          icon={Activity}
          tone={connected ? 'green' : 'rose'}
          label="Session"
          value={connected ? 'Connected' : 'Disconnected'}
          sub={
            (h?.session_expired ?? 0) > 0
              ? `${h?.session_expired} expired`
              : 'healthy session'
          }
          isLoading={health.isLoading}
        />
        <KpiCard
          icon={Layers}
          tone="blue"
          label="Outstanding Requests"
          value={h?.outstanding_requests ?? 0}
          sub={`${h?.in_flight_requests ?? 0} in flight`}
          isLoading={health.isLoading}
        />
        <KpiCard
          icon={Eye}
          tone="violet"
          label="Active Watches"
          value={h?.watches ?? 0}
          unit="watches"
          isLoading={health.isLoading}
        />
        <KpiCard
          icon={Network}
          tone="neutral"
          label="Alive Connections"
          value={h?.alive_connections ?? 0}
          isLoading={health.isLoading}
        />
      </div>

      <div className="grid auto-rows-fr grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2 md:grid-cols-4">
        <KpiCard
          icon={Crown}
          tone="amber"
          label="Cluster Role"
          value={hasSummary ? s!.server_state || DASH : DASH}
          sub={
            hasSummary
              ? `${s!.leaders}/${s!.nodes} leader`
              : 'no zookeeper_info'
          }
          isLoading={summary.isLoading}
        />
        <KpiCard
          icon={Users}
          tone="green"
          label="Synced Followers"
          value={hasSummary ? `${s!.synced_followers}/${s!.followers}` : DASH}
          sub="followers in sync"
          isLoading={summary.isLoading}
        />
        <KpiCard
          icon={Gauge}
          // A few uncommitted raft entries is normal under write load; only a
          // large backlog signals a lagging/unhealthy node.
          tone={hasSummary && s!.max_log_lag > 1000 ? 'rose' : 'blue'}
          label="Raft Log Lag"
          value={hasSummary ? s!.max_log_lag : DASH}
          sub={hasSummary ? `avg ${s!.avg_latency_ms} ms latency` : undefined}
          isLoading={summary.isLoading}
        />
        <KpiCard
          icon={Database}
          tone="neutral"
          label="Data Size"
          value={hasSummary ? s!.readable_data_size || DASH : DASH}
          sub={
            hasSummary ? (
              <>
                <span className="tabular-nums">
                  {Number(s!.znode_count).toLocaleString()}
                </span>{' '}
                znodes
              </>
            ) : undefined
          }
          isLoading={summary.isLoading}
        />
      </div>
    </div>
  )
})

export default KeeperOverviewKpis
