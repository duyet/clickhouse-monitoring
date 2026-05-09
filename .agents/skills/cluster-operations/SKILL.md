---
name: cluster-operations
description: "Cluster management: distributed tables, ON CLUSTER DDL, node lifecycle, resharding, load balancing, and Keeper migration."
---

# Cluster Operations

## Distributed Tables
- `CREATE TABLE dist ENGINE = Distributed(cluster, db, local_table, sharding_key)`
- Sharding key: `rand()` for even distribution, `cityHash64(user_id)` for user affinity
- Reads: query all shards in parallel; Writes: route to correct shard or write locally

## ON CLUSTER DDL
- `ALTER TABLE t ON CLUSTER '{cluster}' ADD COLUMN col Type` — propagate schema to all replicas
- `CREATE TABLE t ON CLUSTER '{cluster}' AS template_db.template_table` — clone across shards
- `distributed_ddl_output_mode`: `throw` (fail on error), `null` (ignore), `none`, `active`
- Check status: `SELECT * FROM system.distributed_ddl_queue`

## Load Balancing and Read Routing
- `load_balancing`: `random`, `in_order`, `first_or_random`, `nearest_hostname`
- `max_replica_delay_for_distributed_queries` — skip lagging replicas
- `fallback_to_stale_replicas_for_distributed_queries=1` — use stale when all delayed

## Adding Nodes
1. Install ClickHouse on new node
2. Configure Keeper/ZooKeeper connection
3. Update cluster config (`remote_servers`) on all nodes
4. Create local tables on new node
5. ReplicatedMergeTree: data syncs automatically; non-replicated: copy or re-insert

## Removing Nodes
1. Stop writes, wait for replication queue to drain
2. `SYSTEM DROP REPLICA` for replicated tables
3. Remove from cluster config, restart remaining nodes

## Resharding
- No native online resharding — create new distributed table with new sharding scheme
- `INSERT INTO new_dist SELECT * FROM old_dist` or `clickhouse-copier` for large migrations

## Cluster Recovery
- `SYSTEM RESTART REPLICA ON CLUSTER '{cluster}'` — restart replication across all nodes
- `SYSTEM SYNC REPLICA ON CLUSTER '{cluster}'` — force sync from ZooKeeper
- `SYSTEM FETCH PARTS ON CLUSTER '{cluster}'` — pull missing parts from other replicas

## Monitoring Clusters
- `system.clusters` — topology; `system.distributed_ddl_queue` — DDL status; `system.replicas` — replication
- Cross-shard queries: use Distributed table or `remote()` function

## Keeper Migration (ZooKeeper to ClickHouse Keeper)
1. Deploy ClickHouse Keeper alongside ZooKeeper
2. Snapshot data: `clickhouse-keeper-converter` or `zk-dump.sh`
3. Configure Keeper with converted snapshot
4. Update `zookeeper` config, restart one node at a time
5. Verify replication recovers, then remove ZooKeeper
