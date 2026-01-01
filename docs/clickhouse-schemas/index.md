---
title: ClickHouse Schema Version Index
---

# ClickHouse System Table Schema Index

## Version Matrix

| Version | Release | Type | Key Changes |
|---------|---------|------|-------------|
| 23.1 | 2023-01 | Regular | Baseline |
| 23.3 | 2023-03 | LTS | Stable release |
| 23.8 | 2023-08 | LTS | Enterprise baseline |
| 24.1 | 2024-01 | Regular | query_cache_usage, peak_threads_usage |
| 24.3 | 2024-03 | LTS | [TBD] |
| 24.8 | 2024-08 | LTS | [TBD] |
| 25.1 | 2025-01 | Regular | [TBD] |

## Monitored System Tables

| Table | Category | Documentation |
|-------|----------|---------------|
| system.processes | Query Monitoring | [tables/processes.md](tables/processes.md) |
| system.query_log | Query Monitoring | [tables/query_log.md](tables/query_log.md) |
| system.parts | Storage | [tables/parts.md](tables/parts.md) |
| system.merges | Operations | [tables/merges.md](tables/merges.md) |
| system.replicas | Replication | [tables/replicas.md](tables/replicas.md) |
| system.tables | Metadata | [tables/tables.md](tables/tables.md) |
| system.columns | Metadata | [tables/columns.md](tables/columns.md) |
| system.disks | Storage | [tables/disks.md](tables/disks.md) |
| system.clusters | Cluster | [tables/clusters.md](tables/clusters.md) |

## Quick Links

- [Agent Instructions](AGENTS.md) - For AI agents
- [Claude Code Guide](CLAUDE.md) - For Claude Code
- [README](README.md) - Overview

## Updating These Docs

```bash
# Regenerate all docs
bun run scripts/build-ch-schema-docs.ts

# Specific version
bun run scripts/build-ch-schema-docs.ts --version 24.1

# Specific table
bun run scripts/build-ch-schema-docs.ts --table query_log
```
