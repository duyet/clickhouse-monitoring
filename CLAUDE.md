# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 (React 19) ClickHouse monitoring dashboard that provides real-time insights into ClickHouse clusters through system tables. The application connects to ClickHouse instances and displays metrics, query performance, table information, and cluster health.

## Commands

### Development

- `pnpm dev` - Start development server with turbopack
- `pnpm build` - Build for production with turbopack
- `pnpm start` - Start production server

### Testing

- `pnpm test` - Run Jest unit tests with coverage
- `pnpm jest` - Run Jest tests (excludes query-config tests)
- `pnpm test-queries-config` - Run query config specific tests
- `pnpm component` - Open Cypress component tests
- `pnpm component:headless` - Run Cypress component tests headless
- `pnpm e2e` - Open Cypress e2e tests
- `pnpm e2e:headless` - Run Cypress e2e tests headless

### Code Quality

- `pnpm lint` - Run Next.js ESLint
- `pnpm fmt` - Format code with Prettier

## Architecture

### Core Technologies

- **Next.js 15** with App Router and Server Components
- **React 19** with TypeScript
- **ClickHouse clients** (@clickhouse/client and @clickhouse/client-web)
- **TanStack Table** for data tables
- **Tailwind CSS** with shadcn/ui components
- **Recharts** and **Tremor** for charting
- **Radix UI** for accessible primitives

### File Structure

- `app/` - Next.js app directory with nested routes
- `components/` - Reusable UI components
  - `data-table/` - Advanced data table components with sorting, pagination, filtering
  - `charts/` - Chart components for various metrics
  - `ui/` - shadcn/ui components
- `lib/` - Utility functions and core logic
  - `clickhouse.ts` - ClickHouse client configuration and query functions
  - `server-context.ts` - Server-side context management
- `types/` - TypeScript type definitions
- `menu.ts` - Navigation menu configuration

### Key Patterns

#### Multi-Host Support

The application supports multiple ClickHouse instances through environment variables:

- `CLICKHOUSE_HOST` - Comma-separated list of hosts
- `CLICKHOUSE_USER` - Comma-separated list of users
- `CLICKHOUSE_PASSWORD` - Comma-separated list of passwords
- `CLICKHOUSE_NAME` - Comma-separated list of custom names

#### Data Table System

The `components/data-table/` directory contains a sophisticated table system:

- **Column definitions** with custom formatting (badges, links, duration, etc.)
- **Sorting** with custom sorting functions
- **Pagination** and **filtering**
- **Actions** for row-level operations
- **SQL display** showing the underlying query

#### Query Configuration

Each data view uses a `QueryConfig` type that defines:

- SQL query with parameters
- Column formatting specifications
- Sorting and filtering options
- Actions available for each row

#### Chart Components

Two chart systems are used:

- **Generic charts** in `components/generic-charts/` (area, bar, card-metric, radial)
- **Tremor charts** in `components/tremor/` for specific visualizations

### Development Conventions

#### File Organization

- Server components use `.tsx` without "use client"
- Client components explicitly use "use client" directive
- Page components are in `app/[...]/page.tsx`
- Layout components are in `app/[...]/layout.tsx`
- Config files are named `config.ts` within route directories

#### Component Patterns

- Use Server Components by default
- Client components for interactivity (context, state management)
- Compound components for complex UI (e.g., data tables)
- Custom hooks for shared logic

#### Query Patterns

- All queries include `QUERY_COMMENT` for identification
- Use `fetchData` function for consistent error handling and logging
- Query parameters are properly sanitized through `query_params`
- Host selection is handled through server context

#### Testing Strategy

- **Jest** for unit tests and utilities
- **Cypress** for component and e2e tests
- Component tests include visual regression testing
- Test files are co-located with components (`.cy.tsx` files)

## Environment Configuration

### Required Environment Variables

- `CLICKHOUSE_HOST` - ClickHouse host(s)
- `CLICKHOUSE_USER` - ClickHouse user(s)
- `CLICKHOUSE_PASSWORD` - ClickHouse password(s)

### Optional Environment Variables

- `CLICKHOUSE_NAME` - Custom names for hosts
- `CLICKHOUSE_MAX_EXECUTION_TIME` - Query timeout (default: 60s)
- `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED` - Enable Vercel analytics
- `NEXT_PUBLIC_MEASUREMENT_ID` - Google Analytics ID
- `NEXT_PUBLIC_SELINE_ENABLED` - Enable Seline analytics

## Common Tasks

### Adding a New Data View

1. Create route in `app/[host]/[view]/page.tsx`
2. Define `QueryConfig` in `config.ts`
3. Add menu item to `menu.ts`
4. Implement column formatters if needed
5. Add tests for the component

### Adding a New Chart

1. Create component in `components/charts/`
2. Define SQL query for data
3. Use appropriate chart type from generic-charts or tremor
4. Add to relevant dashboard or create new route

### Modifying Data Tables

- Column formatters are in `components/data-table/cells/`
- Sorting functions are in `components/data-table/sorting-fns.ts`
- Actions are defined in `components/data-table/cells/actions/`

### Working with ClickHouse Queries

- Use `fetchData` for consistent error handling
- All queries should include proper parameter sanitization
- Log query performance through built-in logging
- Use appropriate data formats (JSONEachRow, JSON, etc.)

## Important Files

- `lib/clickhouse.ts` - ClickHouse client and query functions
- `menu.ts` - Navigation configuration
- `app/context.tsx` - Global application context
- `components/data-table/` - Reusable table system
- `types/query-config.ts` - Query configuration types
