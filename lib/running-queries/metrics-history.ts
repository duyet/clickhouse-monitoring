/**
 * Rolling per-query metric history for the Running Queries view.
 *
 * `system.processes` is a snapshot table — it has no built-in time series for
 * an in-flight query. To draw a "live" chart we fold each poll into a small
 * module-level cache keyed by `query_id`, then read it back when a card
 * renders. The cache lives outside React so it survives component re-mounts
 * and SWR cache swaps for the lifetime of the page.
 */

export interface QueryMetricSample {
  /** Wall-clock capture time (ms since epoch). */
  t: number
  /** Server-reported elapsed seconds — also used to dedupe identical polls. */
  elapsed: number
  /** Current memory in bytes. */
  memory: number
  /** Peak memory in bytes. */
  peakMemory: number
  /** Bytes read so far. */
  readBytes: number
  /** Rows read so far. */
  readRows: number
}

/**
 * Cap per-query history. At a 5s poll cadence this keeps ~10 minutes of
 * trend, which is plenty for a sparkline while staying memory-bounded.
 */
const MAX_SAMPLES = 120

/** query_id → ordered samples (oldest first). */
const historyByQueryId = new Map<string, QueryMetricSample[]>()

interface SnapshotRow {
  query_id?: unknown
  elapsed?: unknown
  memory_usage?: unknown
  peak_memory_usage?: unknown
  read_bytes?: unknown
  read_rows?: unknown
}

function toNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/**
 * Fold one poll of `system.processes` into the rolling history.
 *
 * Samples are deduped by `elapsed`: a repeated `elapsed` means SWR served a
 * cached payload (or React re-invoked us), so there is no new data point.
 * Queries absent from `rows` are assumed finished and evicted, keeping the
 * map from growing without bound.
 *
 * @param rows The latest running-queries payload.
 */
export function recordRunningQuerySnapshot(rows: readonly SnapshotRow[]): void {
  const now = Date.now()
  const liveIds = new Set<string>()

  for (const row of rows) {
    const id = String(row.query_id ?? '')
    if (!id) continue
    liveIds.add(id)

    const sample: QueryMetricSample = {
      t: now,
      elapsed: toNumber(row.elapsed),
      memory: toNumber(row.memory_usage),
      peakMemory: toNumber(row.peak_memory_usage),
      readBytes: toNumber(row.read_bytes),
      readRows: toNumber(row.read_rows),
    }

    const samples = historyByQueryId.get(id)
    if (!samples) {
      historyByQueryId.set(id, [sample])
      continue
    }

    const last = samples[samples.length - 1]
    // Same elapsed ⇒ same server snapshot, skip the duplicate.
    if (last && last.elapsed === sample.elapsed) continue

    samples.push(sample)
    if (samples.length > MAX_SAMPLES) samples.shift()
  }

  // Evict finished queries so the cache tracks only what is still running.
  for (const id of historyByQueryId.keys()) {
    if (!liveIds.has(id)) historyByQueryId.delete(id)
  }
}

/**
 * Read the recorded samples for a query.
 *
 * @returns Ordered samples (oldest first); empty array when none recorded.
 */
export function getRunningQueryHistory(queryId: string): QueryMetricSample[] {
  return historyByQueryId.get(queryId) ?? []
}
