/**
 * Keeper / ZooKeeper monitoring query configs.
 *
 * Backed by the `system.zookeeper*` tables, which only exist when ZooKeeper or
 * ClickHouse Keeper is configured. Every config is `optional: true` with an
 * explicit `tableCheck`, so pages degrade to a friendly "not configured" notice
 * on clusters (or ClickHouse versions) where the table is absent.
 */

export { keeperChangelogsConfig } from './keeper-changelogs'
export { keeperClusterConfig } from './keeper-cluster'
export { keeperConnectionLogConfig } from './keeper-connection-log'
export { keeperConnectionsConfig } from './keeper-connections'
export { keeperInfoConfig } from './keeper-info'
export { keeperLogConfig } from './keeper-log'
export { keeperOverviewConfig } from './keeper-overview'
export { keeperPresenceConfig } from './keeper-presence'
export { keeperSnapshotsConfig } from './keeper-snapshots'
export { keeperWatchesConfig } from './keeper-watches'
