---
title: "Tables"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/features/tables.mdx"
---

> Inspect table storage, replication health, schema details, dictionaries, and background data-movement operations across all databases.

| | |
|---|---|
| **Routes** | `/tables`, `/tables-overview`, `/replicas`, `/replication-queue`, `/replicated-fetches`, `/readonly-tables`, `/dropped-tables`, `/dictionaries`, `/kafka-consumers`, `/distributed-ddl-queue` |
| **Feature id** | `tables` |
| **Default access** | `public` |
| **Requires auth** | No (set `CHM_FEATURE_TABLES_ACCESS=authenticated` to gate) |
| **System tables** | `system.tables`, `system.parts`, `system.replicas`, `system.replication_queue`, `system.replicated_fetches`, `system.dropped_tables`, `system.dictionaries`, `system.kafka_consumers`, `system.distributed_ddl_queue` |
| **ClickHouse grants** | `SELECT` on the system tables above; `OPTIMIZE TABLE` grant for the optimize action |

## What it does

The Tables feature answers storage and replication questions without writing any SQL:

- How large is each table, and how many parts does it have?
- Are any replicated tables lagging or in read-only mode?
- What DDL operations are pending across the cluster?
- Which Kafka consumers are behind or erroring?
- What dictionaries are loaded and how much memory do they use?

All pages are read-only except for the OPTIMIZE TABLE action on the tables list, which requires an extra grant.

## Pages

| Page | Route | What it shows | System tables |
|---|---|---|---|
| Tables | `/tables` | Table list with engine, row count, size; OPTIMIZE action | `system.tables`, `system.parts` |
| Tables Overview | `/tables-overview` | Storage statistics per table: part counts, compressed/uncompressed sizes | `system.parts` |
| Table Replicas | `/replicas` | Replicated table health: is\_leader, queue depth, absolute\_delay, last fetch | `system.replicas` |
| Replication Queue | `/replication-queue` | Pending and in-progress replication tasks from Keeper/ZooKeeper | `system.replication_queue` |
| Replicated Fetches | `/replicated-fetches` | Currently executing background part downloads between replicas | `system.replicated_fetches` |
| Readonly Tables | `/readonly-tables` | Tables whose replica is in read-only mode; filtered view of replicas | `system.replicas` |
| Dropped Tables | `/dropped-tables` | Tables awaiting async drop (Atomic database engine) | `system.dropped_tables` |
| Dictionaries | `/dictionaries` | External dictionary status, source type, memory usage | `system.dictionaries` |
| Kafka Consumers | `/kafka-consumers` | Kafka table engine consumer lag, poll/commit counts, ingestion errors | `system.kafka_consumers` |
| DDL Queue | `/distributed-ddl-queue` | Cluster-wide DDL task queue status and execution history | `system.distributed_ddl_queue` |

## Permissions & access

All sub-routes share the `tables` feature id:

```bash
## Gate to authenticated users
CHM_FEATURE_TABLES_ACCESS=authenticated

## Disable entirely
CHM_FEATURE_TABLES_ENABLED=false
## or
CHM_DISABLED_FEATURES=tables
```

```toml
## CHM_CONFIG_FILE (TOML)
[features.tables]
access = "authenticated"
```

Note: the Data Explorer (`/explorer`) is also under the `tables` feature id. Gating tables also gates the explorer.

## Configuration

No feature-specific configuration. The global query timeout applies to all table queries:

```bash
CLICKHOUSE_MAX_EXECUTION_TIME=60
```

## Notes & limitations

- **`system.kafka_consumers`** — only exists when Kafka table engine is in use. If no Kafka tables are configured, the page shows a table-not-found notice. This is expected.
- **`system.replicated_fetches`** — only present on servers running replicated tables. Empty if no replication is active.
- **`system.dropped_tables`** — only available with the Atomic database engine (default since ClickHouse 20.6). Empty on servers using the Ordinary engine.
- **`system.distributed_ddl_queue`** — only relevant on clusters using `ON CLUSTER` DDL. Single-node servers will see an empty table.
- **OPTIMIZE action** — the Tables page can issue `OPTIMIZE TABLE`. The ClickHouse user must have `ALTER TABLE ... OPTIMIZE` (or broader `ALTER`) privilege. Without it the action returns an error.
- **Readonly Tables** — a replica enters read-only mode when it cannot reach Keeper/ZooKeeper. The `/readonly-tables` page is a filtered view of `system.replicas`; it shows a zero-row table when all replicas are healthy.

## Related

- [Data Explorer](/features/explorer)
- [Operations (merges & mutations)](/features/operations)
- [Authentication](/authentication)
- [Settings reference](/settings)
