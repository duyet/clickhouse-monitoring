---
name: troubleshooting
description: "Diagnose and resolve common ClickHouse issues: OOM, slow merges, replication lag, disk full, stuck mutations, and query failures."
---

# Troubleshooting Guide

## When to use this skill
Load when users report errors, performance issues, or system problems.

## OOM (Out of Memory)
### Diagnosis
- Check `system.query_log` for queries with high `memory_usage`
- Look at `system.processes` for currently running memory-heavy queries
- `system.metrics` WHERE metric = 'MemoryTracking' for current usage

### Solutions
- Set `max_memory_usage` per query (e.g., 10GB)
- Set `max_memory_usage_for_user` to limit per-user consumption
- Use `max_bytes_before_external_group_by` for spill-to-disk
- Use `max_bytes_before_external_sort` for large sorts
- Reduce JOIN sizes with pre-filtering
- Use SAMPLE for approximate aggregations

## Slow Merges
### Diagnosis
- `system.merges` — check `elapsed`, `progress`, `total_size_bytes_compressed`
- `system.part_log` WHERE event_type = 'MergeParts' for historical throughput
- Too many parts: check `max_parts_count_for_partition` in `system.asynchronous_metrics`

### Solutions
- Increase `background_pool_size` (default: 16)
- Check disk I/O with `system.asynchronous_metrics` (ReadBufferFromFileDescriptorReadBytes)
- Reduce insert frequency (batch larger)
- Partition strategy: ensure not too many partitions
- `OPTIMIZE TABLE ... FINAL` to force merge (expensive, use off-peak)

## Replication Lag
### Diagnosis
- `system.replicas` — `absolute_delay`, `queue_size`, `is_readonly`
- `system.replication_queue` — pending tasks, `num_tries`, `last_exception`
- Network: check inter-server connectivity

### Solutions
- Check ZooKeeper/Keeper health and latency
- Increase `background_fetches_pool_size`
- Check for stuck entries in replication_queue
- If readonly: check ZooKeeper session, disk space
- `SYSTEM RESTART REPLICA` as last resort

## Disk Full
### Diagnosis
- `system.disks` — `free_space`, `total_space`
- `system.parts` — find largest tables/partitions
- Check for detached parts: `system.detached_parts`

### Solutions
- DROP old partitions: `ALTER TABLE t DROP PARTITION 'YYYYMM'`
- Set up TTL for automatic cleanup
- Move data to cold storage with tiered storage
- Clean detached parts: `ALTER TABLE t DROP DETACHED PART 'name'`
- Reduce replication factor if desperate

## Stuck Mutations
### Diagnosis
- `system.mutations` WHERE is_done = 0 — check `parts_to_do`, `latest_fail_reason`
- Mutations block new merges on affected parts

### Solutions
- `KILL MUTATION WHERE mutation_id = '...'` to cancel
- Fix the underlying issue (schema mismatch, disk space)
- Re-submit the mutation after fixing
- Consider using INSERT + ReplacingMergeTree instead of UPDATE mutations

## Query Failures
### Diagnosis
- `system.query_log` WHERE type = 'ExceptionWhileProcessing'
- Check `exception_code` and `exception` columns
- Common codes: 60 (table not found), 47 (unknown column), 241 (memory limit)

### Solutions
- Code 60: verify table exists, check database name
- Code 47: use `get_table_schema` to check column names
- Code 241: reduce query scope, add LIMIT, use SAMPLE
- Code 159: timeout — add time filters, use LIMIT
- Code 252: too many parts — wait for merges or optimize
