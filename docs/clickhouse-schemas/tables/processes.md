---
table: system.processes
---

# system.processes Schema History

## Change History

| Version | Change |
|---------|--------|
| 25.1+ | Added `peak_threads_usage` column - maximum number of threads used by query (exact version TBD, not available in 24.x) |

## Version Compatibility Matrix

| Column | Since | Description |
|--------|-------|-------------|
| peak_threads_usage | 25.1+ | Maximum number of threads used by the query. Note: Despite ClickHouse docs listing this column, CI testing confirms it does NOT exist in versions 24.5-24.12. |

## Notes

- The `peak_threads_usage` column was added to `system.query_log` in version 23.9 (PR #54335)
- However, the same column in `system.processes` was added much later, likely in version 25.1+
- See GitHub issue #53417 for the original feature request
