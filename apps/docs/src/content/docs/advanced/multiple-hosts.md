---
title: "Multiple Hosts"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/advanced/multiple-hosts.mdx"
---

chmonitor can monitor multiple ClickHouse clusters from a single deployment. The host selector in the dashboard header lets you switch between them. The URL reflects the active host as `?host=N`.

---

## How it works

Set `CLICKHOUSE_HOST` to a comma-separated list of host URLs. Position N across all four connection variables maps to host index N:

| Variable | Example |
|---|---|
| `CLICKHOUSE_HOST` | `http://ch-1:8123,http://ch-2:8123` |
| `CLICKHOUSE_USER` | `user1,user2` |
| `CLICKHOUSE_PASSWORD` | `pass1,pass2` |
| `CLICKHOUSE_NAME` | `Production,Staging` |

`CLICKHOUSE_HOST` defines the host count. `CLICKHOUSE_NAME` is optional — if omitted, hosts are labeled by their index (Host 0, Host 1, …). For credentials, you can provide a single shared value (applied to all hosts) or one value per host position.

The URL parameter `?host=0` targets the first host, `?host=1` the second, and so on. The dashboard defaults to `?host=0` on first load.

---

## Same credentials for all hosts

If all hosts share the same user and password, set a single value:

```bash
CLICKHOUSE_HOST=http://ch-1:8123,http://ch-2:8123
CLICKHOUSE_NAME=ch-1,ch-2
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
```

---

## Different credentials per host

Set a value per position:

```bash
CLICKHOUSE_HOST=http://ch-1:8123,http://ch-2:8123
CLICKHOUSE_NAME=Production,Staging
CLICKHOUSE_USER=prod_user,staging_user
CLICKHOUSE_PASSWORD=prod_pass,staging_pass
```

---

## Docker examples

Replace `vX.Y.Z` with the release tag you want to run.

**Same credentials:**

```bash
docker run -d \
  -e CLICKHOUSE_HOST='http://ch-1:8123,http://ch-2:8123' \
  -e CLICKHOUSE_NAME='ch-1,ch-2' \
  -e CLICKHOUSE_USER='default' \
  -e CLICKHOUSE_PASSWORD='' \
  -p 3000:3000 \
  --name chmonitor \
  ghcr.io/duyet/chmonitor:vX.Y.Z
```

**Different credentials:**

```bash
docker run -d \
  -e CLICKHOUSE_HOST='http://ch-1:8123,http://ch-2:8123' \
  -e CLICKHOUSE_NAME='ch-1,ch-2' \
  -e CLICKHOUSE_USER='user1,user2' \
  -e CLICKHOUSE_PASSWORD='password1,password2' \
  -p 3000:3000 \
  --name chmonitor \
  ghcr.io/duyet/chmonitor:vX.Y.Z
```

---

## Kubernetes / Helm examples

```yaml
## values.yaml — same credentials
env:
  - name: CLICKHOUSE_HOST
    value: "http://ch-1:8123,http://ch-2:8123"
  - name: CLICKHOUSE_NAME
    value: "ch-1,ch-2"
  - name: CLICKHOUSE_USER
    value: "default"
  - name: CLICKHOUSE_PASSWORD
    value: ""
```

```yaml
## values.yaml — different credentials
env:
  - name: CLICKHOUSE_HOST
    value: "http://ch-1:8123,http://ch-2:8123"
  - name: CLICKHOUSE_NAME
    value: "Production,Staging"
  - name: CLICKHOUSE_USER
    value: "prod_user,staging_user"
  - name: CLICKHOUSE_PASSWORD
    value: "prod_pass,staging_pass"
```

Install or upgrade:

```bash
helm repo add chmonitor https://charts.chmonitor.dev
helm upgrade --install chmonitor chmonitor/chmonitor -f values.yaml
```

---

## Notes

- Adding or removing a host requires a restart (env change).
- Health alerts run over all configured hosts when `HEALTH_ALERT_ENABLED=true`.
- The agent API accepts a `hostId` parameter to target a specific host.

See [Custom Name](/advanced/custom-name) for display labels, and [Environment Variables](/reference/environment-variables) for the full connection reference.
