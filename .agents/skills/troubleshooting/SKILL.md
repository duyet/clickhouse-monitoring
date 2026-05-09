---
name: troubleshooting
description: "Diagnose and resolve ClickHouse issues: OOM, slow merges, stuck mutations, query failures with error codes, and systematic error clustering."
---

# Troubleshooting Guide

## OOM (Out of Memory)
**Diagnosis**: `system.query_log` WHERE `memory_usage` is high. `system.metrics` WHERE metric = 'MemoryTracking'.

**Solutions**:
- `max_memory_usage` per query (e.g., 10GB), `max_memory_usage_for_user` per user
- `max_bytes_before_external_group_by` / `max_bytes_before_external_sort` for spill-to-disk
- Reduce JOIN sizes with pre-filtering; use SAMPLE for approximate aggregations

## Slow Merges
**Diagnosis**: `system.merges` — check `elapsed`, `progress`, `total_size_bytes_compressed`. `system.part_log` WHERE event_type = 'MergeParts' for throughput. Too many parts: `max_parts_count_for_partition` in `system.asynchronous_metrics`.

**Solutions**:
- Increase `background_pool_size` (default: 16)
- Check disk I/O via `system.asynchronous_metrics` (ReadBufferFromFileDescriptorReadBytes)
- Batch larger inserts to reduce frequency; avoid excessive partitioning
- `OPTIMIZE TABLE ... FINAL` to force merge (expensive, off-peak only)

## Stuck Mutations
**Diagnosis**: `system.mutations` WHERE is_done = 0 — check `parts_to_do`, `latest_fail_reason`. Mutations block new merges on affected parts.

**Solutions**:
- `KILL MUTATION WHERE mutation_id = '...'` to cancel
- Fix underlying issue (schema mismatch, disk space), then re-submit
- Prefer INSERT + ReplacingMergeTree over UPDATE mutations

## Query Failures
**Diagnosis**: `system.query_log` WHERE type = 'ExceptionWhileProcessing'. Use error clustering to find patterns:
```sql
SELECT exception_code, count(), topK(10)(exception)
FROM system.query_log
WHERE type = 'ExceptionWhileProcessing'
GROUP BY exception_code ORDER BY count() DESC
```
For persistent errors, check `system.error_log` (requires error logging enabled).

**Common error codes**:
- **60**: table not found — verify table exists, check database name
- **47**: unknown column — use `get_table_schema` to check column names
- **241**: memory limit — reduce scope, add LIMIT, use SAMPLE
- **159**: timeout — add time filters, use LIMIT
- **252**: too many parts — wait for merges or OPTIMIZE

## Network Connectivity
**Diagnosis**: Check inter-server connectivity for replication or distributed queries. Verify `interserver_http_port` is reachable between nodes. Test with `curl http://<peer>:9009`. Check firewall rules and DNS resolution.

## Cross-references
- Load the `replication-guide` skill for replication lag diagnosis and recovery.
- Load the `storage-optimization` skill for disk recovery and tiered storage management.
