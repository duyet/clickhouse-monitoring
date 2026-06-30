/**
 * Shared, framework-agnostic display helpers for plan limits.
 *
 * Both the in-app billing comparison (apps/dashboard) and the marketing pricing
 * matrix (apps/landing) render these EXACT strings, so the "what you get" cells
 * can never disagree across surfaces. Pure functions over {@link Plan} — no
 * React, no Astro, no app imports.
 */

import type { Plan } from './plans'

/** ClickHouse host limit cell, e.g. "3" or "Unlimited". */
export function planHosts(plan: Plan): string {
  return plan.hosts === null ? 'Unlimited' : String(plan.hosts)
}

/** Team-seat limit cell, e.g. "3" or "Unlimited". */
export function planSeats(plan: Plan): string {
  return plan.seats === null ? 'Unlimited' : String(plan.seats)
}

/** Alert-rule limit cell: "—" (none), a number, or "Unlimited". */
export function planAlertRules(plan: Plan): string {
  if (plan.alertRules === null) return 'Unlimited'
  if (plan.alertRules === 0) return '—'
  return String(plan.alertRules)
}

/** Conversation & AI-insights retention cell, e.g. "30 days" or "Custom". */
export function planRetention(plan: Plan): string {
  return plan.retentionDays === null ? 'Custom' : `${plan.retentionDays} days`
}

/**
 * AI-usage cell. Daily included messages, plus the overage policy on metered
 * paid tiers. Enterprise (no daily cap) is BYOK.
 * - Free:  "5/day"
 * - Pro:   "100/day + $5/2,000"
 * - Max:   "1,000/day + $5/2,000"
 * - Ent:   "BYOK"
 */
export function planAiUsage(plan: Plan): string {
  if (plan.aiRequestsPerDay === null) return 'BYOK'
  const perDay = `${plan.aiRequestsPerDay.toLocaleString('en-US')}/day`
  if (!plan.aiOverage) return perDay
  return `${perDay} + $${plan.aiOverage.usdPer}/${plan.aiOverage.messages.toLocaleString('en-US')}`
}
