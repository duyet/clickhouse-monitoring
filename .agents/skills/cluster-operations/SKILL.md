---
name: cluster-operations
description: "Distributed table management, resharding, node addition/removal, and cluster topology operations."
---

# Cluster Operations

## When to use this skill
Load when users ask about cluster management, distributed tables, or scaling.

## Distributed Tables
- `CREATE TABLE dist ENGINE = Distributed(cluster, db, local_table, sharding_key)`
- Sharding key: `rand()` for even distribution, `cityHash64(user_id)` for user affinity
- Reads: query all shards in parallel
- Writes: can route to correct shard or write locally

## Adding Nodes
1. Install ClickHouse on new node
2. Configure Keeper/ZooKeeper connection
3. Update cluster config (`remote_servers`) on all nodes
4. Create local tables on new node
5. For ReplicatedMergeTree: data syncs automatically
6. For non-replicated: manually copy data or re-insert

## Removing Nodes
1. Stop writes to the node
2. Wait for replication queue to drain
3. `SYSTEM DROP REPLICA` for replicated tables
4. Remove from cluster config
5. Restart remaining nodes to pick up config

## Resharding
- ClickHouse doesn't support online resharding natively
- Strategy: create new distributed table with new sharding scheme
- Use `INSERT INTO new_dist SELECT * FROM old_dist` to migrate
- Or use `clickhouse-copier` for large-scale migrations

## Monitoring Clusters
- `system.clusters` — topology view
- `system.distributed_ddl_queue` — DDL operation status
- `system.replicas` — per-table replication status
- Cross-shard queries: use Distributed table or `remote()` function
