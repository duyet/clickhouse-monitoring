# ClickHouse Monitoring Dashboard

[![Build and Test](https://github.com/duyet/clickhouse-monitoring/actions/workflows/ci.yml/badge.svg)](https://github.com/duyet/clickhouse-monitoring/actions/workflows/ci.yml)
[![All-time uptime](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fduyet%2Fuptime%2FHEAD%2Fapi%2Fclickhouse-monitoring-vercel-app%2Fuptime.json)](https://duyet.github.io/uptime/history/clickhouse-monitoring-vercel-app)

The simple Next.js dashboard that relies on `system.*` tables to help monitor and provide an overview of your ClickHouse cluster.

**Features:**

- Query monitor: current queries, query history, query resources (memory, parts read, file_open, ...), most expensive queries, most used tables or columns, etc.
- Cluster monitor: total memory/CPU usage, distributed queue, global settings, mergetree settings, metrics, etc.
- Tables and parts information: size, row count, compression, part size, etc., at the column level detail.
- Useful tools: Zookeeper data exploration, query EXPLAIN, kill queries, etc.
- Visualization metric charts: queries and resource usage, number of merges/mutation, merge performance, query performance, etc.

## Demo

_The ClickHouse server running on my homelab so can be slow sometimes_:

- [clickhouse-monitoring.duyet.net](https://clickhouse-monitoring.duyet.net)

## Documentation

- https://zread.ai/duyet/clickhouse-monitoring _(AI Generated)_
- https://duyet.github.io/clickhouse-monitoring
  - [Getting Started](https://duyet.github.io/clickhouse-monitoring/getting-started)
    - [Local Development](https://duyet.github.io/clickhouse-monitoring/getting-started/local)
    - [User Role and Profile](https://duyet.github.io/clickhouse-monitoring/getting-started/clickhouse-requirements)
    - [Enable System Tables](https://duyet.github.io/clickhouse-monitoring/getting-started/clickhouse-enable-system-tables)
  - [Deployments](https://duyet.github.io/clickhouse-monitoring/deploy)
    - [Vercel](https://duyet.github.io/clickhouse-monitoring/deploy/vercel)
    - [Docker](https://duyet.github.io/clickhouse-monitoring/deploy/docker)
    - [Kubernetes Helm Chart](https://duyet.github.io/clickhouse-monitoring/deploy/k8s)
  - [Advanced](https://duyet.github.io/clickhouse-monitoring/advanced)

## Screenshots

![](.github/screenshots/screenshot_1.png)
![](.github/screenshots/screenshot_2.png)
![](.github/screenshots/screenshot_3.png)
![](.github/screenshots/screenshot_4.png)
![](.github/screenshots/screenshot_5.png)
![](.github/screenshots/screenshot_6.png)
![](.github/screenshots/screenshot_7.png)
![](.github/screenshots/screenshot_8.png)

## Feedback and Contributions

Feedback and contributions are welcome! Feel free to open issues or submit pull requests.

## License

See [LICENSE](LICENSE).

---

![Alt](https://repobeats.axiom.co/api/embed/830f9ce7ba9e7a42f93630e2581506ca34c84067.svg 'Repobeats analytics image')

