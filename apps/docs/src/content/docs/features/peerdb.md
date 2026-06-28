---
title: "PeerDB"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/features/peerdb.mdx"
---

> Monitor PeerDB replication mirrors and peers from within chmonitor (optional, read-only).

| | |
|---|---|
| **Routes** | `/peerdb`, `/peerdb/peers` |
| **Feature id** | `peerdb` |
| **Default access** | `public` |
| **Requires auth** | No (set `CHM_FEATURE_PEERDB_ACCESS=authenticated` to gate) |
| **System tables** | None — proxies the PeerDB REST API, not ClickHouse system tables |
| **ClickHouse grants** | None required |

## What it does

When you set `PEERDB_API_URL`, chmonitor adds a PeerDB section to the navigation. It proxies read-only calls to the PeerDB API so you can monitor replication without leaving the chmonitor UI.

**Mirrors** (`/peerdb`) shows all configured replication mirrors with status, throughput, and per-table sync state.

**Peers** (`/peerdb/peers`) lists source and destination peers, replication slot lag, and a mirror connectivity graph.

Mutation requests (create, delete, pause, resume) are blocked at the proxy layer and return HTTP 403. chmonitor only ever reads from PeerDB.

The PeerDB section does not appear in the navigation when `PEERDB_API_URL` is unset.

## Pages

| Page | Route | What it shows | System tables |
|---|---|---|---|
| Mirrors | `/peerdb` | Mirror status, throughput, per-table sync | — (PeerDB API) |
| Peers | `/peerdb/peers` | Peer list, slot lag, mirror graph | — (PeerDB API) |

## Permissions & access

The `peerdb` feature id controls visibility.

Disable:

```bash
CHM_FEATURE_PEERDB_ENABLED=false
```

Require authentication:

```bash
CHM_FEATURE_PEERDB_ACCESS=authenticated
```

Config file:

```toml
[features.peerdb]
enabled = true
access = "authenticated"
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PEERDB_API_URL` | (unset) | PeerDB API base URL. Include the `/api` suffix for the UI API (e.g., `https://peerdb.example.com/api`). When unset, the PeerDB section is hidden entirely. |
| `PEERDB_PASSWORD` | (unset) | HTTP Basic auth password. The username is left empty. |
| `PEERDB_CACHE_TTL_MS` | `10000` | Response cache TTL in milliseconds. |
| `PEERDB_CACHE_MAX_ENTRIES` | `500` | Maximum number of cached responses. |
| `PEERDB_FETCH_TIMEOUT_MS` | `10000` | Timeout for proxied PeerDB API requests. |

Example:

```bash
PEERDB_API_URL=https://peerdb.example.com/api
PEERDB_PASSWORD=my-peerdb-password
PEERDB_CACHE_TTL_MS=15000
```

## Notes & limitations

- This integration is **read-only**. Any PeerDB API call that would mutate state (create/delete/pause/resume mirrors or peers) is blocked at the chmonitor proxy layer and returns HTTP 403.
- The PeerDB API URL must be reachable from the chmonitor server, not from the user's browser. All PeerDB requests are server-side proxied.
- `PEERDB_API_URL` that points to the bare origin (without `/api`) is intended for direct flow-api use; the UI mirrors/peers pages expect the `/api`-suffixed URL.
- PeerDB version compatibility is not guaranteed across major PeerDB releases. If the PeerDB API shape changes, some fields may not render correctly.
- No ClickHouse system tables are queried by this section.

## Related

- [Feature permissions](/advanced/feature-permissions)
- [PeerDB documentation](https://docs.peerdb.io)
