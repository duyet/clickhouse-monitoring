import { ColumnFormat } from '@/types/column-format'
import { type QueryConfig } from '@/types/query-config'

export type Row = {
  cluster: string
  shard_count: number
  replica_count: number
  count_replica: string
}

export const config: QueryConfig = {
  name: 'clusters',
  description:
    'Contains information about clusters available in the config file and the servers in them',
  sql: `
    SELECT
        cluster,
        countDistinct(shard_num) as shard_count,
        countDistinct(replica_num) as replica_count,
        'Replicas Status' as replica_status
    FROM system.clusters
    GROUP BY 1
  `,
  columns: ['cluster', 'shard_count', 'replica_count', 'replica_status'],
  columnFormats: {
    cluster: [ColumnFormat.Link, { href: `/clusters/[cluster]` }],
    replica_status: [
      ColumnFormat.Link,
      { href: `/clusters/[cluster]/replicas-status` },
    ],
  },
}
