---
name: storage-optimization
description: "Compression codecs, TTL policies, tiered storage, part management, and disk space optimization."
---

# Storage Optimization

## When to use this skill
Load when users ask about disk usage, compression, TTL, or storage tiers.

## Compression Codecs
- Default: LZ4 — fast, moderate compression
- `ZSTD(level)` — better compression, slower. Level 1-22 (3 is good default)
- `Delta` + ZSTD — excellent for time-series monotonic data
- `DoubleDelta` — best for timestamps and counters
- `Gorilla` — optimized for floating-point gauge metrics
- `T64` — for integer columns with small range
- Per-column: `ALTER TABLE t MODIFY COLUMN col TYPE UInt32 CODEC(Delta, ZSTD(3))`

## TTL Policies
- Table-level: `ALTER TABLE t MODIFY TTL event_time + INTERVAL 90 DAY`
- Column-level: `ALTER TABLE t MODIFY COLUMN old_col TTL event_time + INTERVAL 30 DAY`
- Move to volume: `TTL event_time + INTERVAL 7 DAY TO VOLUME 'cold'`
- Delete: `TTL event_time + INTERVAL 365 DAY DELETE`
- Monitor TTL merges: `system.merges WHERE is_ttl_merge = 1`

## Tiered Storage
- Define storage policies in config: hot (SSD) → warm (HDD) → cold (S3)
- `<storage_configuration>` in config.xml
- Move rules: `TTL event_time + INTERVAL 7 DAY TO DISK 'hdd'`
- Check disk usage: `system.disks`
- Check volume usage: `system.storage_policies`

## Part Management
- Monitor part count: `SELECT count() FROM system.parts WHERE active AND database = 'db' AND table = 't'`
- Too many parts (>300 per partition) = degraded performance
- Force merge: `OPTIMIZE TABLE t FINAL` (expensive)
- Detached parts: check `system.detached_parts`, clean with `DROP DETACHED PART`
- Part size target: 1-10GB per part for optimal performance

## Disk Space Recovery
- `DROP PARTITION` for bulk deletion by time
- `TRUNCATE TABLE` for full table cleanup
- Check for orphaned data: detached parts, temporary files
- System tables can grow large — set TTL on query_log, trace_log, etc.
