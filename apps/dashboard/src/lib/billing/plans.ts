/**
 * Billing plans for the dashboard.
 *
 * The canonical data + types now live in the zero-dep `@chm/pricing` package so
 * the marketing landing app and this dashboard share ONE source of truth (they
 * can no longer drift). This module just re-exports it; keep dashboard-specific
 * billing logic in `entitlements.ts` / `billing-owner.ts`, not here.
 *
 * @see packages/pricing/src/plans.ts
 */

export * from '@chm/pricing'
