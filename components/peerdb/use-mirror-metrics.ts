'use client'

import type {
  CDCBatch,
  GetCDCBatchesResponse,
  GraphResponse,
  MirrorStatusResponse,
  QRepPartition,
} from '@/lib/peerdb/types'

import { toNumber } from './peerdb-utils'
import { usePeerDB } from '@/lib/swr'

export interface DerivedMetrics {
  trend: number[]
  rowsPerSec: number
  rowsSynced: number
  lagSec: number | null
  partitions: QRepPartition[]
  batches: CDCBatch[]
  errorMessage?: string
  loading: boolean
}

/** Summary surfaced to the page so it can aggregate KPI totals. */
export interface MirrorMetricsSummary {
  rowsPerSec: number
  rowsSynced: number
  trend: number[]
}

/**
 * Fetch per-mirror status + throughput; shared (SWR-deduped) with the row.
 * `enabled` gates the network calls so large mirror lists don't fan out to the
 * PeerDB API for every collapsed row — metrics load lazily on expand.
 */
export function useMirrorMetrics(
  name: string,
  isCdc: boolean,
  enabled: boolean
): DerivedMetrics {
  const status = usePeerDB<MirrorStatusResponse>(
    enabled ? '/mirrors/status' : null,
    {
      body: { flowJobName: name, includeFlowInfo: true },
      refreshInterval: 60_000,
      swrConfig: { shouldRetryOnError: false },
    }
  )
  const graph = usePeerDB<GraphResponse>(
    enabled ? '/mirrors/cdc/graph' : null,
    {
      body: { flowJobName: name, aggregateType: '1min' },
      refreshInterval: 60_000,
      swrConfig: { shouldRetryOnError: false },
    }
  )
  // Batches fetched explicitly — real PeerDB does not embed them in status,
  // so the lag number/chart would otherwise be empty against the live API.
  const batchesReq = usePeerDB<GetCDCBatchesResponse>(
    enabled && isCdc ? '/mirrors/cdc/batches' : null,
    {
      body: { flowJobName: name, page: 0, numPerPage: 24 },
      refreshInterval: 60_000,
      swrConfig: { shouldRetryOnError: false },
    }
  )

  const cdc = status.data?.cdcStatus
  const qrep = status.data?.qrepStatus
  const partitions = qrep?.partitions ?? []
  const batches = batchesReq.data?.cdcBatches ?? cdc?.cdcBatches ?? []
  const trend = (graph.data?.data ?? []).map((p) => toNumber(p.rows))

  const rowsPerSec = trend.length ? Math.round(trend[trend.length - 1] / 60) : 0

  const rowsSynced = isCdc
    ? toNumber(cdc?.rowsSynced) || toNumber(graph.data?.totalRows)
    : partitions.reduce((a, p) => a + toNumber(p.rowsSynced), 0)

  let lagSec: number | null = null
  if (isCdc && batches.length) {
    const last = batches[batches.length - 1]
    const end = last.endTime ? Date.parse(last.endTime) : NaN
    if (!Number.isNaN(end)) lagSec = Math.max(0, (Date.now() - end) / 1000)
  }

  return {
    trend,
    rowsPerSec,
    rowsSynced,
    lagSec,
    partitions,
    batches,
    errorMessage: status.data?.errorMessage,
    loading: status.isLoading || graph.isLoading,
  }
}
