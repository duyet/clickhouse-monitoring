---
id: pr-1021-component-ci-stability
title: PR 1021 Component CI Stability
type: incident
status: draft
updated: 2026-05-01
source_pr: 1021
source_branch: codex/implement-data-logic-in-rust-and-update-pr
tags:
  - cypress
  - component-test
  - ci
  - recharts
  - nextjs
related:
  - knowledge-index
  - pr-1021-rust-wasm-performance
artifacts:
  - cypress/support/component.ts
  - components/charts/factory/create-area-chart.tsx
  - components/charts/factory/create-bar-chart.tsx
  - components/charts/factory/create-custom-chart.tsx
  - components/charts/primitives/bar-list.tsx
  - components/charts/primitives/area.cy.tsx
  - components/charts/merge/summary-used-by-merges.cy.tsx
  - components/dashboard/render-chart.tsx
  - components/dashboard/chart-params.tsx
  - components/dialogs/dialog-content.tsx
  - components/feedback/error-alert.cy.tsx
  - components/controls/interval-select/interval-select.cy.tsx
  - components/controls/reload-button/reload-button.cy.tsx
  - components/data-table/cells/actions/action-menu.tsx
  - components/data-table/components/data-table-header.cy.tsx
  - components/data-table/formatters/index.cy.tsx
  - components/navigation/nav-main.cy.tsx
  - components/tables/table-client.cy.tsx
---

# PR 1021 Component CI Stability

This note captures the component-test investigation from PR #1021. It is linked
from the [knowledge index](./README.md) and complements the
[Rust/WASM performance note](./pr-1021-rust-wasm-performance.md).

## Current State

The PR CI failure was `component-test` timing out after 30 minutes. The failure
was not caused by the Rust/WASM changes directly. Local investigation found a
mix of existing Cypress component-test fragility and one real component bug.

## Findings

- Recharts specs can render blank when mounted without a stable container size.
- Some chart component specs make unmocked `/api/v1/charts/*` or dashboard
  settings requests, causing slow retries in CI.
- `components/charts/merge/summary-used-by-merges.tsx` did not pass
  `className` through to `ChartCard`.
- `components/dashboard/render-chart.tsx` used `export *` from a client module.
  Next/SWC rejects that pattern in component compilation.
- `components/dashboard/chart-params.tsx` mixes `useRouter()` with the form
  behavior, which makes isolated component tests harder to mount.
- Factory charts accepted `hostId` in `ChartProps` but ignored it in favor of
  `useHostId()`. Component specs that passed a host override then waited for the
  wrong mocked URL.
- Shared SWR cache state can leak between component mounts and make loading or
  error-state specs depend on previous specs.
- Some specs asserted test-only ARIA roles such as `role="dialog-content"` or
  `role="open-query"`. Prefer semantic elements or explicit `data-testid`
  attributes instead.
- Several older component specs used Cypress commands at module scope, called
  React hooks outside a component, imported stale module paths, or mounted
  context-bound controls without their providers.
- Isolated component mounts need App Router, pathname, and search-param
  providers when components call `useRouter()`, `usePathname()`, or
  `useSearchParams()`.
- Cmdk-based controls do not expose listbox/option roles through the local
  shadcn wrapper, so specs should use cmdk attributes or visible text instead
  of invented roles.
- Recharts SVG internals are not stable enough for exact label-text assertions
  in CI. Prefer asserting chart visibility, bars, legends, and stable wrapper
  elements.

## Patch Direction

Keep these fixes narrow:

- Add a stable component mount surface in `cypress/support/component.ts`.
- Add default component-test intercepts only for common dashboard settings reads
  that should not hit the network in isolated component tests.
- Keep chart endpoint mocks spec-local. A global `/api/v1/charts/*` fallback can
  steal requests from explicit `@chartData` aliases and cause slow retries.
- Pass `className` through in `ChartSummaryUsedByMerges`.
- Replace `export *` in `RenderChart` with explicit type exports.
- Extract a hook-free `ChartParamsForm` and keep `ChartParams` as the router
  wrapper.
- Keep per-mount SWR state isolated in `cypress/support/component.ts`.
- In chart factories, prefer an explicit `hostId` prop when provided and fall
  back to `useHostId()` for routed pages.
- Add stable test ids to non-semantic internal rendering layers when the visible
  text appears in multiple stacked layers, such as `BarList`.
- Do not add invalid ARIA roles only for Cypress selectors.
- Keep Cypress commands inside `it`, `beforeEach`, or helper functions executed
  by a running test. Do not call `cy.stub()`, `cy.intercept()`, or React hooks at
  spec module scope.
- When a component uses `useAppContext()`, mount it under `AppProvider` in the
  spec instead of weakening the production hook guard.
- Keep Next app-router providers in the shared Cypress mount harness. Override
  pathname/search params in a spec with nested context providers when needed.
- Prefer accessible trigger labels for production controls that open menus, such
  as action-menu and reload buttons.

## Handoff Rules

- Do not broaden this into a Cypress redesign.
- Do not edit `components/ui/*` to satisfy component tests.
- Kill stale Cypress processes before rerunning focused specs. Orphaned Cypress
  apps can keep ports and webpack caches busy.
- If local UI testing is allowed, verify focused specs first, then run
  `bun run component:headless`.
- If local UI testing is paused, use GitHub CI logs for component-test evidence
  and run non-UI checks only.
- If the full component run is still too slow, inspect the next failing spec
  and patch only the missing mock or assertion drift.
