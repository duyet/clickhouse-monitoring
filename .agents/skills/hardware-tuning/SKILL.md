---
name: hardware-tuning
description: "Detect server cores/RAM/disk from system tables, then recommend ClickHouse settings sized to that hardware."
---

# Hardware Tuning

Load this skill when the user asks "what settings should I change given my server's hardware?" or similar. The workflow is always: detect first, recommend second. Never recommend a specific byte value as a universal truth — give ratios and explain the reasoning.

## Detect Hardware

Metric names vary by ClickHouse version. Use broad `ILIKE` patterns and inspect what is actually returned before drawing conclusions.

```sql
-- Step 1: Discover what CPU/memory metrics are available on this server
SELECT metric, value
FROM system.asynchronous_metrics
WHERE metric ILIKE '%CPU%'
   OR metric ILIKE '%Memory%'
   OR metric ILIKE '%core%'
ORDER BY metric
```

Key metrics to look for (names differ across versions):

| What you need | Likely metric names |
|---|---|
| Logical CPU cores | `CGroupMaxCPU`, `OSCPUVirtualTimeMicroseconds` (indirect), check also `system.metrics` `CPUUsage*` |
| Total RAM | `OSMemoryTotal`, `CGroupMemoryLimit` |
| Available RAM | `OSMemoryAvailable`, `OSMemoryFreeWithoutCache` |
| Used RAM | `OSMemoryUsed`, `MemoryResident` |

> If neither `CGroupMaxCPU` nor an obvious cores metric appears, fall back to counting CPU entries from `/proc/cpuinfo` via `SELECT count() FROM system.asynchronous_metrics WHERE metric ILIKE '%CPU%User%'` or ask the user directly. Do not fabricate a core count.

```sql
-- Step 2: Disk layout — free space and total per disk
SELECT name, path, type,
       formatReadableSize(free_space)  AS free,
       formatReadableSize(total_space) AS total,
       round((1 - free_space / total_space) * 100, 1) AS used_pct
FROM system.disks
ORDER BY total_space DESC
```

## Read Current Settings

Pull the most hardware-sensitive settings so you can compare current vs. recommended:

```sql
SELECT name, value, changed, default AS default_value, description
FROM system.settings
WHERE name IN (
    'max_threads',
    'max_insert_threads',
    'max_memory_usage',
    'max_memory_usage_for_user',
    'max_server_memory_usage',
    'max_server_memory_usage_to_ram_ratio',
    'max_bytes_before_external_group_by',
    'max_bytes_before_external_sort',
    'max_bytes_before_external_join',
    'background_pool_size',
    'background_merge_pool_size',
    'background_fetches_pool_size',
    'mark_cache_size',
    'uncompressed_cache_size',
    'max_concurrent_queries',
    'max_connections'
)
ORDER BY name
```

Note: `background_pool_size` and `background_merge_pool_size` are server-level settings (set in `config.xml` or `config.d/`). They will appear in `system.settings` but changing them requires a server restart. Session-level settings take effect immediately with `SET`.

## Key Settings: Ratio-Based Guidance

Use the detected hardware values from the queries above and apply these ratios. Replace `<cores>` and `<RAM_bytes>` with the actual numbers you found.

### CPU-bound settings

| Setting | Scope | Guidance |
|---|---|---|
| `max_threads` | session | ≈ number of logical cores. Default is auto (`0`). Only lower it if queries compete with each other at high concurrency. |
| `max_insert_threads` | session | 1–4 for normal inserts; up to half of cores for bulk loads. |
| `background_pool_size` | server (restart) | 16 is the default; for merge-heavy workloads raise toward `cores / 2`. Don't exceed cores. |
| `background_merge_pool_size` | server (restart) | Same guidance as `background_pool_size`. Default 16. |
| `max_concurrent_queries` | server | Start at `cores * 2`. Lower if queries are large and memory-bound. |

### Memory-bound settings

Leave genuine headroom — never allocate 100 % of RAM to ClickHouse. The OS, kernel buffers, and other processes need room.

| Setting | Scope | Guidance |
|---|---|---|
| `max_server_memory_usage` | server | Set to `0` (auto) to use `max_server_memory_usage_to_ram_ratio` instead. If hardcoding: ≤ 80 % of `OSMemoryTotal`. |
| `max_server_memory_usage_to_ram_ratio` | server | Default `0.9`; consider lowering to `0.8` on shared hosts or when running replicas with ZooKeeper on the same box. |
| `max_memory_usage` | session | Per-query cap. A common starting point is `RAM × 0.3` for OLAP queries, but tune per workload. |
| `max_memory_usage_for_user` | session | Per-user sum cap. Useful when multiple users share the server; set to `RAM × 0.5` as a starting point. |
| `max_bytes_before_external_group_by` | session | Spill threshold for GROUP BY. Typically half of `max_memory_usage`. If set to `0`, spilling is disabled. |
| `max_bytes_before_external_sort` | session | Same pattern as external group by. Setting this too low causes unnecessary disk spilling; too high causes OOM. |
| `max_bytes_before_external_join` | session | Applies to hash joins. Same ratio guidance. |

### Cache settings (server-level, config.xml or `<cache>` section)

These affect how much RAM is reserved for ClickHouse's internal caches. Changing them requires restart.

| Setting | Guidance |
|---|---|
| `mark_cache_size` | Default 5 GiB. For servers with lots of RAM (≥ 64 GiB) and many columns, raise to 10–20 GiB. Do not exceed ≈ 10 % of RAM. |
| `uncompressed_cache_size` | Default 0 (disabled). Only enable if you have a read-heavy workload with repeated small queries on the same columns. Cap at ≈ 5–10 % of RAM. |

## Disk Considerations

After running the disk query above:

- **Single spinning disk**: reduce `background_pool_size` and `background_merge_pool_size` to avoid I/O saturation during merges. Values of 4–8 are common.
- **NVMe / SSD array**: defaults or higher pool sizes are fine.
- **Tiered storage (hot/cold)**: ensure the hot tier has enough free space for active merges (ClickHouse needs ≈ 2× the size of the parts being merged).
- **Disk nearly full (> 90 % used)**: inserts will stall. Investigate via `system.parts` and consider `OPTIMIZE … FINAL` or archiving old partitions before tuning anything else.

## Caution

- **Change one setting at a time** and measure before moving to the next.
- **Defaults are often correct.** ClickHouse auto-detects cores and sets `max_threads = 0` (auto). Only override when you have a concrete reason.
- **Server-level vs. session-level**: `background_pool_size`, `mark_cache_size`, `max_server_memory_usage`, and `max_concurrent_queries` require editing `config.xml` (or a file in `config.d/`) and restarting the server. Session-level settings (`max_threads`, `max_memory_usage`, etc.) apply immediately with `SET` or in the query profile.
- **Replicated environments**: changing server-level settings must be applied consistently to all replicas. Inconsistent pool sizes can cause one replica to fall behind on merges.
- **ClickHouse Keeper / ZooKeeper on the same host**: the coordination process can consume significant RAM under load. Budget at least 4–8 GiB for it and reduce `max_server_memory_usage_to_ram_ratio` accordingly.

## Verification

After applying changes, confirm they took effect and watch for regressions:

```sql
-- Confirm the setting is now the value you set (session-level)
SELECT name, value, changed
FROM system.settings
WHERE name IN ('max_threads', 'max_memory_usage', 'max_bytes_before_external_group_by')

-- Watch for OOM or memory-allocation errors after a change
SELECT name, value AS error_count, last_error_time, last_error_message
FROM system.errors
WHERE name ILIKE '%Memory%' OR name ILIKE '%Alloc%'
ORDER BY last_error_time DESC
LIMIT 20

-- Monitor peak memory usage on currently running queries
SELECT query_id, user, memory_usage, peak_memory_usage,
       formatReadableSize(memory_usage)      AS mem,
       formatReadableSize(peak_memory_usage) AS peak_mem,
       elapsed,
       substring(query, 1, 120)              AS query
FROM system.processes
WHERE query NOT LIKE '%processes%'
ORDER BY peak_memory_usage DESC
```

If `system.errors` shows `MEMORY_LIMIT_EXCEEDED` spikes after a change, roll back that setting before adjusting others.

## Cross-references

- `clickhouse-best-practices` — production insert, cache, and connection-pool guidance
- `schema-design-advisor` — part counts and merge behavior affect background pool sizing
- `troubleshooting` — error-code-driven diagnosis including OOM and disk-full incidents
- `query-tuning-advisor` — per-query memory and parallelism knobs once server settings are stable
