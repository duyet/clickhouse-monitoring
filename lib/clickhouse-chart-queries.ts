'use server'

import type { ClickHouseIntervalFunc } from '@/components/interval-select'
import { fetchData } from '@/lib/clickhouse'

export const avgMemory = async (interval: ClickHouseIntervalFunc) => {
  return await fetchData(`
    SELECT ${interval}(event_time) as event_time,
           avg(CurrentMetric_MemoryTracking) AS avg_memory_gb
    FROM system.metric_log
    WHERE event_time >= (now() - INTERVAL 1 DAY)
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 10000
  `)
}
