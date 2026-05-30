# clickhouse-monitoring Helm chart

Production Helm chart for the [ClickHouse Monitoring](https://github.com/duyet/clickhouse-monitoring)
dashboard. Vendored in-repo so the chart tracks the app it ships.

## Install

```bash
helm install my-chm ./deploy/helm/clickhouse-monitoring \
  --set clickhouse.host="https://clickhouse.example.com:8443" \
  --set clickhouse.user="default" \
  --set clickhouse.password="<password>"
```

Upgrade:

```bash
helm upgrade my-chm ./deploy/helm/clickhouse-monitoring -f my-values.yaml
```

Uninstall:

```bash
helm uninstall my-chm
```

## Values overview

| Key | Default | Description |
|---|---|---|
| `replicaCount` | `1` | Number of pod replicas (ignored when autoscaling is on). |
| `image.repository` | `ghcr.io/duyet/clickhouse-monitoring` | Container image. |
| `image.tag` | `""` | Image tag; falls back to the chart `appVersion`. |
| `image.pullPolicy` | `IfNotPresent` | Image pull policy. |
| `service.type` | `ClusterIP` | Kubernetes Service type. |
| `service.port` | `3000` | Service port. |
| `containerPort` | `3000` | Container port the app listens on. |
| `resources` | requests 100m/256Mi, limits 500m/512Mi | Pod resource requests/limits. |
| `autoscaling.enabled` | `false` | Enable the HorizontalPodAutoscaler. |
| `autoscaling.minReplicas` | `1` | Min replicas when autoscaling. |
| `autoscaling.maxReplicas` | `10` | Max replicas when autoscaling. |
| `autoscaling.targetCPUUtilizationPercentage` | `80` | CPU target for autoscaling. |
| `ingress.enabled` | `false` | Enable the Ingress. |
| `clickhouse.host` | `http://localhost:8123` | Comma-separated ClickHouse host URLs (`CLICKHOUSE_HOST`). |
| `clickhouse.user` | `default` | Comma-separated usernames (`CLICKHOUSE_USER`). |
| `clickhouse.password` | `""` | Comma-separated passwords; stored in a Secret (`CLICKHOUSE_PASSWORD`). |
| `clickhouse.maxExecutionTime` | `"60"` | Query timeout in seconds (`CLICKHOUSE_MAX_EXECUTION_TIME`). |
| `clickhouse.existingSecret` | `""` | Use an existing Secret (key `CLICKHOUSE_PASSWORD`) instead of `clickhouse.password`. |
| `extraEnv` | `[]` | Extra environment variables (e.g. `CLICKHOUSE_NAME`). |

See [`values.yaml`](./values.yaml) for the full list.

## Health probes

- **Liveness** — `GET /healthz` (static, always `200` while the process runs).
- **Readiness** — `GET /api/healthz` (returns `503` when no configured
  ClickHouse host is reachable, so traffic is only routed once a host is up).

## Security

Pods run as the non-root `app` user (uid/gid `1001`) baked into the Docker
runner stage, with `allowPrivilegeEscalation: false` and all Linux capabilities
dropped.
