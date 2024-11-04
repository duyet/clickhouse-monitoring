# ClickHouse Monitoring Dashboard

[![Build and Test](https://github.com/duyet/clickhouse-monitoring/actions/workflows/ci.yml/badge.svg)](https://github.com/duyet/clickhouse-monitoring/actions/workflows/ci.yml)

The simple Next.js dashboard that relies on `system.*` tables to help monitor and provide an overview of your ClickHouse cluster.

Features:

- Query monitor: current queries, query history, query resources (memory, parts read, file_open, ...), most expensive queries, most used tables or columns, etc.
- Cluster monitor: total memory/CPU usage, distributed queue, global settings, mergetree settings, metrics, etc.
- Tables and parts information: size, row count, compression, part size, etc., at the column level detail.
- Useful tools: Zookeeper data exploration, query EXPLAIN, kill queries, etc.
- Visualization metric charts: queries and resource usage, number of merges/mutation, merge performance, query performance, etc.

**Demo** (_The ClickHouse server running on my homelab so can be slow sometimes_):

- [clickhouse-monitoring.vercel.app](https://clickhouse-monitoring.vercel.app)
- [clickhouse.duyet.net](https://clickhouse.duyet.net)

![](.github/screenshots/screenshot_1.png)
![](.github/screenshots/screenshot_2.png)
![](.github/screenshots/screenshot_3.png)
![](.github/screenshots/screenshot_4.png)
![](.github/screenshots/screenshot_5.png)
![](.github/screenshots/screenshot_6.png)
![](.github/screenshots/screenshot_7.png)
![](.github/screenshots/screenshot_8.png)

## Getting Started

To get the project up and running on your local machine, follow these steps:

1. Clone the repository
2. Install dependencies using `npm install` or `yarn install`
3. Create a `.env.local` file by copying the `.env.example` file and filling in the required environment variables:

   - `CLICKHOUSE_HOST`: ClickHouse host(s), for example `http://localhost:8123` or `http://ch-1:8123,http://ch-2:8123`
   - `CLICKHOUSE_NAME`: (Optional) Name of ClickHouse instance, must match the number of hosts in `CLICKHOUSE_HOST`, for example `localhost` or `ch-1,ch-2`.
   - `CLICKHOUSE_USER`: ClickHouse user with permission to query the `system` database.
   - `CLICKHOUSE_PASSWORD`: ClickHouse password for the specified user.
   - `CLICKHOUSE_MAX_EXECUTION_TIME`: [`max_execution_time`](https://clickhouse.com/docs/en/operations/settings/query-complexity#max-execution-time) timeout in seconds. Default is `10`.
   - `CLICKHOUSE_TZ`: ClickHouse server timezone. Default: `''`.
   - `NEXT_QUERY_CACHE_TTL`: TTL of [`unstable_cache`](https://nextjs.org/docs/app/api-reference/functions/unstable_cache) - cache the results of most charts to speed up and reuse them across multiple requests. Default: `86400`.
   - `NEXT_PUBLIC_LOGO`: (Optional) HTTP path to logo image.
   - `EVENTS_TABLE_NAME`: The table name for storing dashboard self-tracking events. Default: `system.monitoring_events`

4. Run the development server with `npm run dev` or `yarn dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the dashboard.

## ClickHouse Requirements

### 1. Monitoring user role

Suggested role for "monitoring" user must have these privileges on `system` database:

```xml
# File: users.d/monitoring_role.xml
<clickhouse>
  <users>
    <monitoring>
      <password><!-- define password here --></password>
      <profile>monitoring_profile</profile>
      <networks><ip>::/0</ip></networks>
      <grants>
        <query>GRANT monitoring_role</query>
      </grants>
    </monitoring>
  </users>

  <roles>
    <monitoring_role>
      <grants>
        <query>REVOKE ALL ON *.*</query>
        <query>GRANT SELECT,SHOW,dictGet,REMOTE ON *.*</query>
        <query>GRANT SELECT,INSERT,ALTER,CREATE,DROP,TRUNCATE,OPTIMIZE,SHOW,dictGet ON system.*</query>
        <query>GRANT CREATE TEMPORARY TABLE ON *.*</query>
      </grants>
    </monitoring_role>
  </roles>
</clickhouse>
```

`CREATE TEMPORARY TABLE` is needed because the UI using `FROM merge(system, '^query_log')` allows retrieving all the data from old tables that were renamed during the upgrade.

### 2. Monitoring user profile

```xml
# File: users.d/monitoring_profile.xml
<clickhouse>
  <profiles>
    <monitoring_profile>
      <allow_experimental_analyzer>1</allow_experimental_analyzer>

      <!-- Optional: query cache to avoid hit too much queries on database -->
      <use_query_cache>1</use_query_cache>
      <query_cache_ttl>50</query_cache_ttl>
      <query_cache_max_entries>0</query_cache_max_entries>
    </monitoring_profile>
  </profiles>
</clickhouse>
```

## Deployment

### 1. Vercel

For easy deployment, use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme), created by the makers of Next.js. Refer to the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

### 2. Docker

Using the latest image here: https://github.com/duyet/clickhouse-monitoring/pkgs/container/clickhouse-monitoring

```bash
docker run -it \
    -e CLICKHOUSE_HOST='http://localhost' \
    -e CLICKHOUSE_USER='default' \
    -e CLICKHOUSE_PASSWORD='' \
    -e CLICKHOUSE_TZ='Asia/Ho_Chi_Minh' \
    -e CLICKHOUSE_MAX_EXECUTION_TIME='15' \
    -e NEXT_QUERY_CACHE_TTL='86400' \
    --name clickhouse-monitoring \
    ghcr.io/duyet/clickhouse-monitoring:main
```

### 3. Kubernetes Helm Chart

Using the latest helm chart here: https://github.com/duyet/charts/tree/master/clickhouse-monitoring

```bash
helm repo add duyet https://duyet.github.io/charts

cat <<EOF >> values.yaml
env:
  - name: CLICKHOUSE_HOST
    value: http://localhost:8123
  - name: CLICKHOUSE_USER
    value: default
  - name: CLICKHOUSE_PASSWORD
    value: ''
  - name: CLICKHOUSE_TZ
    value: 'Asia/Ho_Chi_Minh'
  - name: CLICKHOUSE_MAX_EXECUTION_TIME
    value: '15'
  - name: NEXT_QUERY_CACHE_TTL
    value: '86400'
EOF

helm install -f values.yaml clickhouse-monitoring-release duyet/clickhouse-monitoring
```

## Feedback and Contributions

Feedback and contributions are welcome! Feel free to open issues or submit pull requests.

## License

See [LICENSE](LICENSE).

---

![Alt](https://repobeats.axiom.co/api/embed/830f9ce7ba9e7a42f93630e2581506ca34c84067.svg 'Repobeats analytics image')
