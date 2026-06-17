import type { DeclarativeQueryConfig } from '../../schema'

export const clustersDeclarative: DeclarativeQueryConfig = {
  name: 'clusters',
  card: { primary: 'cluster', badges: ['replica_status'] },
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
  // Few, wide rows (one per cluster) — cards read better than a sparse table.
  defaultView: 'cards',
  columnFormats: {
    replica_status: [
      'link',
      { href: `/clusters/replicas-status?cluster=[cluster]&host=[ctx.hostId]` },
    ],
  },
  optional: false,
}
