# Changelog

## [0.2.0] - Unreleased

### Breaking Changes
- **Static routes**: `/[host]/overview` → `/overview?host=0`
- **Query format**: `variants` → `sql: [{ since: '23.8', sql: '...' }]`
- **Data fetching**: Server-side → client-side SWR; `fetchData()` requires `hostId`

### Features
- Data Explorer with database tree browser
- Version-aware queries for ClickHouse compatibility
- Multi-host monitoring support
- Cloudflare Workers deployment

### Improvements
- Column resizing and text wrapping in data tables
- SWR caching for charts and tables
- Centralized query configs in `lib/query-config/`
- Removed deprecated wrappers and functions

## [0.1.0] - 2024

Initial release with query monitoring, cluster overview, table analytics, 30+ metric charts, and developer tools.
