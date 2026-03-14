---
name: replication-guide
description: "ReplicatedMergeTree operations, failover procedures, lag diagnosis, quorum writes, and Keeper management."
---

# Replication Guide

## When to use this skill
Load when users ask about replication setup, lag, failover, or Keeper/ZooKeeper.

## ReplicatedMergeTree Basics
- Engine: `ReplicatedMergeTree('/clickhouse/tables/{shard}/{database}/{table}', '{replica}')`
- Requires ZooKeeper or ClickHouse Keeper
- All replicas are equal — any replica can accept writes
- Replication is asynchronous by default

## Monitoring Replication
- `system.replicas` — per-table status: `absolute_delay`, `queue_size`, `is_leader`, `is_readonly`
- `system.replication_queue` — pending operations: fetches, merges, mutations
- Key health indicators:
  - `absolute_delay = 0` — fully caught up
  - `is_readonly = 0` — accepting writes
  - `queue_size < 10` — healthy queue
  - `active_replicas = total_replicas` — all replicas online

## Failover Procedures
1. Check replica status: `SELECT * FROM system.replicas WHERE is_readonly = 1`
2. Verify Keeper connectivity: `SELECT * FROM system.zookeeper WHERE path = '/'`
3. If replica is readonly due to Keeper disconnect, it auto-recovers when connection restores
4. For permanent failures: `SYSTEM DROP REPLICA 'replica_name' FROM TABLE db.table`

## Quorum Writes
- `SET insert_quorum = 2` — wait for N replicas to confirm
- `SET insert_quorum_parallel = 1` — parallel quorum inserts (v21.8+)
- `SET insert_quorum_timeout = 60000` — timeout in ms
- Use for critical data that must survive node failures

## Keeper Management
- ClickHouse Keeper is the recommended replacement for ZooKeeper
- Monitor: `system.zookeeper` table for browsing ZK tree
- Key paths: `/clickhouse/tables/` for table metadata
- Check Keeper health: `SELECT * FROM system.asynchronous_metrics WHERE metric LIKE '%Keeper%'`

## Common Issues
- **Split brain**: Multiple leaders — usually Keeper issue, restart Keeper
- **Readonly replica**: Lost Keeper session — check network, Keeper logs
- **Queue buildup**: Slow fetches — check network bandwidth, disk I/O
- **Diverged replicas**: `SYSTEM SYNC REPLICA db.table` to force sync
