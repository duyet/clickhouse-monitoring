# `apps/telemetry` — anonymous telemetry collector

The ingest endpoint that `CHM_TELEMETRY_ENDPOINT` points at. It receives the
anonymous instance ping (and optional aggregate events) emitted by
[`apps/dashboard/src/lib/telemetry`](../dashboard/src/lib/telemetry) and records
them to **Cloudflare Analytics Engine**.

This closes the gap described in
[`docs/content/operate/advanced/telemetry.mdx`](../../docs/content/operate/advanced/telemetry.mdx):
the dashboard already builds and (when enabled) sends the ping, but until now no
endpoint existed to receive it. `track()` events still need a client-side sink
registered before they flow — see *Follow-ups* below.

## What it accepts

Public, write-only. No auth (it cannot be read back over HTTP — only the
project's Cloudflare account can query the dataset). Everything is validated
against a closed shape; unknown fields are ignored.

### `POST /v1/ping`
```json
{ "instance_hash": "<64-char sha256 hex>", "deploy_target": "docker", "ch_version": "24.8" }
```
- `instance_hash` — required, must be 64-char lowercase hex. Opaque per-install
  id (SHA-256 of a random local UUID). Used only to count distinct installs.
- `deploy_target` — one of `docker | helm | cf | dev | unknown` (else `unknown`).
- `ch_version` — optional, `MAJOR.MINOR` only (e.g. `24.8`); anything else dropped.

### `POST /v1/event`
```json
{ "event": "cluster_connected", "props": { "deploy_target": "docker", "ch_version": "24.8", "ch_flavor": "oss" } }
```
- `event` — one of the five names in `TELEMETRY_EVENTS` (else rejected).
- `props` — only `deploy_target`, `ch_version`, `ch_flavor` are stored.

### `GET /` or `/health`
Returns `200` — liveness only.

## Storage layout (Analytics Engine `chm_telemetry`)

| column   | ping                | event                       |
|----------|---------------------|-----------------------------|
| `index1` | `instance_hash`     | event name                  |
| `blob1`  | `ping`              | `event`                     |
| `blob2`  | `deploy_target`     | event name                  |
| `blob3`  | `ch_version`        | `deploy_target`             |
| `blob4`  | —                   | `ch_version`                |
| `blob5`  | —                   | `ch_flavor`                 |
| `double1`| `1`                 | `1`                         |

## Deploy

```bash
cd apps/telemetry
bun install
bun run deploy            # production → telemetry.chmonitor.dev
bun run deploy:preview    # preview    → preview.telemetry.chmonitor.dev
```

No secrets required. The Analytics Engine dataset is created on first write.

## Querying (active installs, by version / deploy target)

Analytics Engine is read via the SQL API with a Cloudflare API token that has
**Account Analytics: Read**:

```bash
curl "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/analytics_engine/sql" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -d "
    SELECT
      blob2 AS deploy_target,
      blob3 AS ch_version,
      count(DISTINCT index1) AS active_installs
    FROM chm_telemetry
    WHERE blob1 = 'ping' AND timestamp > now() - INTERVAL '30' DAY
    GROUP BY deploy_target, ch_version
    ORDER BY active_installs DESC
  "
```

Total active installs in the last 30 days:
```sql
SELECT count(DISTINCT index1) AS active_installs
FROM chm_telemetry
WHERE blob1 = 'ping' AND timestamp > now() - INTERVAL '30' DAY
```

Event volume by name (when the event sink is wired):
```sql
SELECT blob2 AS event, sum(double1) AS n
FROM chm_telemetry
WHERE blob1 = 'event' AND timestamp > now() - INTERVAL '30' DAY
GROUP BY event ORDER BY n DESC
```

> Note: Analytics Engine adaptively samples high-volume datasets. For a self-host
> telemetry volume this is effectively exact; if it ever samples, multiply
> `double1` sums by `_sample_interval` for unbiased counts. Distinct-install
> counts via `count(DISTINCT index1)` remain accurate because `index1` is the
> sampling key.

## Turning it on

Telemetry stays **off by default**. To collect from a deployment, set both:

```bash
CHM_TELEMETRY=on
CHM_TELEMETRY_ENDPOINT=https://telemetry.chmonitor.dev/v1/ping
```

### Decision for the maintainer: default endpoint

For the project to receive adoption data, the **official** builds (the hosted
`dash.chmonitor.dev` and the published Docker/Helm images) would need to ship
with the endpoint pre-set. That is a deliberate posture change from today's
"opt-in + no endpoint" to "endpoint baked into official builds, **opt-out** via
`CHM_TELEMETRY=off` / `DO_NOT_TRACK`". This collector does not make that choice;
it only provides the destination. Decide and wire the default separately.

## Follow-ups (not in this collector)

1. **Default endpoint** for official builds (above) — the only step needed to
   make the instance ping actually flow.
2. **Event sink** — register a `TelemetrySink` in the dashboard that POSTs to
   `/v1/event`, so the five `track()` events reach the collector. The collector
   already accepts them.
3. **Send `ch_version` in the ping** — `maybePingInstance()` currently passes
   `version: undefined`; thread the connected cluster's version through for a
   per-version install breakdown.
4. **Honor `DO_NOT_TRACK`** in `config.ts` alongside `CHM_TELEMETRY` if the
   default-on posture is adopted.
