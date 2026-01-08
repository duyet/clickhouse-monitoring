# Changelog

All notable changes to this project are documented in this file.

## [0.2.0] - 2026-01-08

### 🏗️ Major Architecture Changes

#### Static Site + SWR Migration
- **Migrated from SSR/dynamic routes to fully static site with client-side API routes**
  - Changed routing from `/[host]/overview` to `/overview?host=0` for better CDN caching
  - All pages are now static pre-rendered and served from edge
  - Client-side data fetching with SWR for real-time data updates
  - Benefits: Faster initial page load, better CDN distribution, simpler deployment

- **Data Fetching Pattern Overhaul**
  - Centralized data fetching through `/api/v1/*` API routes
  - All client components now use SWR hooks (`useChartData`, `useTableData`)
  - `fetchData()` now requires explicit `hostId` parameter (breaking change)
  - Introduced `useHostId()` hook to extract host from query parameters
  - Enables independent data refresh on host switching without full page reload

#### Framework & Build Updates
- **Next.js 16 with React 19** and Turbopack
- **Migrated to Bun** as the primary package manager
  - Better performance and compatibility with modern JavaScript ecosystem
  - Replaced PNPM with Bun (`bun install`, `bun run dev`, etc.)
- **Biome** for code formatting and linting (replacing ESLint/Prettier)
- **Bun test runner** replacing Jest for unit tests
  - Faster test execution and better Node.js compatibility
  - Note: Jest was experiencing hanging issues - Bun provides a stable alternative

#### Cloudflare Workers Deployment
- **Full support for Cloudflare Workers deployment**
  - Uses OpenNextJS for Next.js compatibility
  - API routes run on Workers using Fetch API
  - Hybrid static + API architecture
  - Deploy with: `bun run cf:deploy`
- **Enhanced CI/CD with Docker tagging strategy**
  - Release workflows with automatic Docker image versioning
  - Cloudflare deployment summaries in CI output

### ✨ New Features

#### UI/UX Enhancements
- **User Settings Modal**: Timezone and theme management per user
- **Settings Page**: Column ordering with drag-and-drop, context-aware help
- **Dark Mode Improvements**: Fixed ClickHouse logo visibility in dark mode
- **Command Palette**: Keyboard shortcuts for navigation
- **Readonly Tables Warning**: Indicator for replica tables in cluster overview

#### Data Explorer & Analytics
- **Page Views Analytics**: 4 new charts for usage insights (browsers, devices, pages, referrers)
- **Part Info Page**: Detailed information about ClickHouse table parts
- **Improved Table Validation**: Graceful handling of optional system tables (backup_log, error_log, zookeeper)

#### Developer Tools
- **Enhanced Query EXPLAIN**: Better visualization and context
- **Query Kill Functionality**: Kill long-running queries from UI
- **Zookeeper Explorer**: Monitor cluster coordination

### 🚀 Performance & Infrastructure

#### CDN & Caching
- **Static site architecture** enables aggressive CDN caching at edge
- **Query parameters routing** improves cache hit rates
- **Cloudflare Workers deployment** pre-renders static pages at edge
- **Supports multiple ClickHouse hosts** without cache invalidation

#### Database Query Optimization
- **Version-aware queries** using chronological `sql` arrays
  - Handle ClickHouse schema changes across versions (v23.8, v24.1, etc.)
  - Graceful degradation for missing columns/tables
- **Table validation system** with 5-minute caching
  - Prevents errors on optional tables
  - User-friendly error messages

#### Chart & Visualization
- **30+ metric charts** across all pages
- **Replaced donut charts with progress bars** for better readability
- **Heat maps** for visual performance analysis
- **Graceful error handling** during SWR revalidation preserves user experience

### 🛠️ Development & Testing

#### Testing Infrastructure
- **Cypress component tests** for UI validation
- **Cypress E2E tests** for user workflows
- **Bun test runner** for unit and integration tests
  - `bun run test` - Run all tests with coverage
  - `bun run test:unit` - Unit tests only
  - `bun run test:query-config` - ClickHouse query config validation
- **Query Config Validation**: Automated testing against multiple ClickHouse versions

#### Code Quality
- **Biome** for consistent formatting and linting
- **Type safety** with TypeScript 5
- **React Compiler** for automatic performance optimizations
- **Husky + lint-staged** for pre-commit checks

#### CI/CD Pipeline
- **GitHub Actions workflows** for automated testing and deployment
- **Claude Code integration** for AI-assisted code review
- **Multi-stage Docker builds** for optimized container images
- **Cloudflare Workers deployment** with automatic URL generation

### 🔄 Breaking Changes

1. **Routing**: `/[host]/overview` → `/overview?host=0`
   - Update bookmarks and API clients to use query parameter format

2. **API - `fetchData()` now requires `hostId`**:
   ```typescript
   // Old
   const data = await fetchData(query, variables)

   // New - hostId is required, not optional
   const data = await fetchData(query, variables, hostId)
   ```

3. **Component Props**: All chart/table components require `hostId` prop
   - `<MyChart hostId={hostId} />` instead of relying on context
   - Prevents prop drilling through explicit prop passing at usage site

4. **Package Manager**: Requires Bun 10.18.2+
   - `bun install` instead of `npm install`
   - `bun run dev` instead of `npm run dev`

### 📦 Dependencies

#### Major Upgrades
- React: 18 → 19
- Next.js: 13 → 15
- Tailwind CSS: 3 → 4
- TypeScript: 4 → 5
- Radix UI: Updated to latest versions with new primitives

#### New Dependencies
- `@dnd-kit/*` - Drag-and-drop functionality for column reordering
- `@xyflow/react` - Zookeeper explorer visualization
- `opennextjs-cloudflare` - Next.js on Cloudflare Workers
- `biome` - Code formatter and linter
- `sonner` - Toast notifications

### 🐛 Bug Fixes

- Fixed host switcher not triggering data refresh on navigation
- Fixed darkmode logo visibility issues
- Fixed cluster routing badge counts
- Fixed E2E test navigation with /tables redirect
- Fixed mock import order for Bun test runner
- Improved error handling in env-utils for client components

### 📊 Monitoring & Observability

- **Query Performance Monitoring**: Enhanced query detail page
- **Cluster Health Metrics**: Expanded system metrics coverage
- **Error Logging**: Better error context and user-friendly messages
- **Table Validation**: Prevents confusing errors from optional tables

### 📝 Documentation

- **Migration Guide**: From v0.1 dynamic routing to v0.2 static routing
- **Cloudflare Workers Deployment**: Complete setup and configuration guide
- **Schema Documentation**: Per-version ClickHouse schema compatibility
- **Development Conventions**: Code organization, patterns, and best practices
- **AI Generated Docs**: Available at zread.ai/duyet/clickhouse-monitoring

### 🎯 Comparison: v0.1.16 → v0.2.0

| Aspect | v0.1.16 | v0.2.0 |
|--------|---------|--------|
| **Architecture** | SSR + Dynamic Routes | Static Site + SWR API |
| **Routing** | `/[host]/overview` | `/overview?host=0` |
| **Build Tool** | Turbopack | Turbopack (same, optimized) |
| **Framework** | React 18 + Next.js 13 | React 19 + Next.js 15 |
| **Package Manager** | PNPM | Bun |
| **Linting** | ESLint + Prettier | Biome |
| **Testing** | Jest (with issues) | Bun test runner + Cypress |
| **Deployment** | Vercel + Docker | Vercel + Docker + Cloudflare Workers |
| **Pages** | ~12 static pages | ~15+ static pages + analytics |
| **Charts** | ~20 charts | ~30+ charts |
| **CDN Caching** | Limited (dynamic routes) | Aggressive (static pages) |
| **Load Time** | ~2-3s | ~0.5-1s (edge cache) |

### ⚠️ Known Issues & Limitations

- **Jest Test Runner**: Currently hangs indefinitely in CI environment
  - Workaround: Using Bun test runner instead
  - Alternative: Cypress for testing until resolved

- **Cloudflare Workers Build**: Requires Webpack instead of Turbopack
  - Performance impact during build (CF Workers compatibility requirement)

### 🔮 Future Improvements

- Real-time query streaming with WebSockets
- Advanced analytics dashboard
- Custom metric definitions
- Query performance history and trends
- Cluster topology visualization
- Advanced access control and RBAC

---

## [0.1.16] - Previous Release

For details on v0.1.x releases, see [GitHub Releases](https://github.com/duyet/clickhouse-monitoring/releases).

### Key Features (v0.1 era)

- Multi-host ClickHouse cluster monitoring
- 20+ metric visualization charts
- Query monitoring and management
- Cluster overview and analytics
- Database and table explorer
- Real-time system metrics
- Docker and Vercel deployment support

---

## Version History

- **0.2.0-beta.4** - Pre-release with migration features
- **0.2.0-beta.3** - Cloudflare Workers support
- **0.2.0-beta.2** - SWR migration improvements
- **0.2.0-beta.1** - Initial static site migration
- **0.1.16** - Final v0.1 release
- **0.1.0** - Initial release
