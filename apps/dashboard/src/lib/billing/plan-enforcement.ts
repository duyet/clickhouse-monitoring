/**
 * Plan-benefit enforcement registry — the single source of truth for *whether
 * each advertised plan benefit is actually enforced in code yet*.
 *
 * Why this exists: `@chm/pricing` advertises limits + capabilities, but during
 * **early access everything is free** ("Early access — free while in beta"), so
 * per-tier feature gating is intentionally NOT switched on — turning it on now
 * would remove capabilities current users already have. The risk is that the
 * gap between "advertised" and "enforced" drifts silently and the marketing
 * promise quietly becomes untrue.
 *
 * This registry makes the gap EXPLICIT and the tests (`plan-enforcement.test.ts`)
 * make it impossible to add a benefit without classifying it. Flipping a benefit
 * from `deferred` to `enforced` at GA is a one-line change here plus its wiring.
 *
 * See plans/02-plan-benefits-parity.md.
 */

import type { PlanCapability } from '@chm/pricing'

export type Enforcement =
  /** Gated in code today. `gate` names where (file / function). */
  | { status: 'enforced'; gate: string }
  /** Advertised but not gated yet (free during beta / GA roadmap). */
  | { status: 'deferred'; reason: string }
  /** Not software-gated by nature (e.g. support tier, core monitoring). */
  | { status: 'inherent' }

const BETA = 'Free during early access; gate when paid GA launches.'

/**
 * Enforcement status for every {@link PlanCapability}. The test suite asserts
 * this covers the full union — adding a capability to `@chm/pricing` without a
 * line here fails the build.
 */
export const CAPABILITY_ENFORCEMENT: Record<PlanCapability, Enforcement> = {
  core_monitoring: { status: 'inherent' },
  priority_support: { status: 'inherent' },
  ai_agent: { status: 'deferred', reason: BETA },
  ai_insights_scheduled: { status: 'deferred', reason: BETA },
  alerting_basic: {
    status: 'deferred',
    reason: 'Alerting feature not built in this app yet.',
  },
  alerting_advanced: {
    status: 'deferred',
    reason: 'Alerting feature not built in this app yet.',
  },
  data_export: { status: 'deferred', reason: BETA },
  anomaly_detection: { status: 'deferred', reason: BETA },
  fleet_view: { status: 'deferred', reason: BETA },
  custom_dashboards: { status: 'deferred', reason: BETA },
  webhook_integrations: { status: 'deferred', reason: BETA },
  api_mcp_access: { status: 'deferred', reason: BETA },
  sso_rbac_audit: { status: 'deferred', reason: BETA },
}

/** Numeric limits advertised by every plan. */
export type LimitKey =
  | 'hosts'
  | 'seats'
  | 'alertRules'
  | 'retentionDays'
  | 'aiRequestsPerDay'

/**
 * Enforcement status for each numeric limit. Only the host cap is wired today.
 */
export const LIMIT_ENFORCEMENT: Record<LimitKey, Enforcement> = {
  hosts: {
    status: 'enforced',
    gate: 'routes/api/v1/user-connections.ts handlePost → checkHostLimit (pooled by countOwnerHosts)',
  },
  seats: {
    status: 'deferred',
    reason:
      'Needs a Clerk organizationMembership.created webhook to count members vs plan.seats.',
  },
  alertRules: {
    status: 'deferred',
    reason: 'No alert-rule create path exists yet.',
  },
  retentionDays: {
    status: 'deferred',
    reason:
      'Conversations/insights are not pruned or read-filtered by plan retention yet.',
  },
  aiRequestsPerDay: {
    status: 'deferred',
    reason:
      'Agent route needs a per-owner daily counter (D1) before checkAiDailyLimit can gate.',
  },
}
