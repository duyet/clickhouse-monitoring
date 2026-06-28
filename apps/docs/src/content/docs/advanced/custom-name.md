---
title: "Custom Name"
editUrl: "https://github.com/duyet/clickhouse-monitoring/edit/main/docs/content/advanced/custom-name.mdx"
---

Set `CLICKHOUSE_NAME` to give each ClickHouse host a human-readable label. The label appears in the host selector dropdown in the dashboard header.

---

## Configuration

```bash
CLICKHOUSE_HOST=http://ch-1:8123,http://ch-2:8123,http://ch-3:8123
CLICKHOUSE_NAME=Production,Staging,Dev
```

The number of comma-separated values must match `CLICKHOUSE_HOST`. Position N in `CLICKHOUSE_NAME` labels host index N.

If `CLICKHOUSE_NAME` is not set, hosts are labeled by index: **Host 0**, **Host 1**, etc.

---

## Docker

```bash
docker run -d \
  -e CLICKHOUSE_HOST='http://ch-1:8123,http://ch-2:8123' \
  -e CLICKHOUSE_NAME='Production,Staging' \
  -e CLICKHOUSE_USER='default' \
  -e CLICKHOUSE_PASSWORD='' \
  -p 3000:3000 \
  ghcr.io/duyet/chmonitor:vX.Y.Z
```

---

## Kubernetes / Helm

```yaml
env:
  - name: CLICKHOUSE_HOST
    value: "http://ch-1:8123,http://ch-2:8123"
  - name: CLICKHOUSE_NAME
    value: "Production,Staging"
```

See [Multiple Hosts](/advanced/multiple-hosts) for full multi-host setup.
