# Changelog

## [0.2.0] - Unreleased

**This release includes a complete UI rewrite for improved performance, better developer experience, and resolved numerous bugs.**

### Breaking Changes
- **Static Site Architecture**: Migrated from dynamic routes (`/[host]/overview`) to static routes with query parameters (`/overview?host=0`)
- **Query Config Format**: Changed from range-based `variants` to chronological `since` format for version-aware queries
  - Old: `variants: [{ versions: '<24.1', sql: '...' }]`
  - New: `sql: [{ since: '23.8', sql: '...' }]`
- **Data Fetching**: All server-side data fetching moved to client-side via SWR; `fetchData()` now requires `hostId` parameter

### Major Features
- **Data Explorer**: Interactive database tree browser with fast tab switching for Data, Structure, Indexes, DDL, Dependencies, and Projections
- **Version-Aware Queries**: Automatic selection of appropriate SQL queries based on ClickHouse version with support for system tables that differ between versions
- **Overview Reorganization**: Charts reorganized into 5 logical tabs (Connections, Queries, Merges, Replication, System)
- **Multi-Host Support**: Monitor multiple ClickHouse instances from a single dashboard with query parameter routing

### Enhancements
- **Data Tables**: Added column resizing with draggable borders and text wrapping toggle
- **Chart Improvements**: Replaced donut charts with progress bars for better readability (query cache, query types)
- **Performance**: SWR caching for all chart and table data; static shell pre-rendered for faster initial page load
- **Deployment**: Cloudflare Workers support with standalone output mode

### Developer Experience
- **ClickHouse Schema Docs**: Auto-generated documentation for ClickHouse system tables per version in `docs/clickhouse-schemas/`
- **Query Config Registry**: Centralized query configurations in `lib/query-config/`
- **Table Validation**: Automatic validation for optional system tables (`backup_log`, `error_log`, `zookeeper`)

### Code Cleanup
- **Removed deprecated re-export wrappers**:
  - `components/data-table/format-cell.tsx` → use `@/components/data-table/formatters`
  - `components/data-table/column-defs.tsx` → use `@/components/data-table/column-defs/column-defs`
  - `components/charts/metric-card.tsx` → use `@/components/cards/metric`
  - `components/charts/primitives/bar.tsx` → use `@/components/charts/primitives/bar/bar`
- **Removed deprecated functions**:
  - `binding()` from `lib/utils.ts` → use `replaceTemplateVariables` from `@/lib/template-utils`
  - `BarTooltip` component → use `renderBarTooltip` function
- **Updated deployment config**: `vercel.json` now uses `bun run build` instead of `pnpm build`

## [0.1.0] - 2024

### Initial Release
- **Query Monitoring**: Current queries, query history, expensive queries, most used tables/columns
- **Cluster Overview**: Memory/CPU usage, distributed queue, global settings, MergeTree settings
- **Table Analytics**: Size, row count, compression, part sizes with column-level granularity
- **Visualization**: 30+ metric charts for queries, resources, merges, and system health
- **Developer Tools**: Zookeeper explorer, query EXPLAIN, query kill functionality
- **Additional Pages**: Users, roles, distributed DDL queue, readonly tables, backups
