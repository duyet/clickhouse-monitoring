import { Check, Minus } from 'lucide-react'

import {
  BILLING_PLAN_LIST,
  type Plan,
  type PlanCapability,
  type PlanId,
  planAiUsage,
  planAlertRules,
  planHasCapability,
  planHosts,
  planRetention,
  planSeats,
} from '@/lib/billing/plans'
import { cn } from '@/lib/utils'

/**
 * Side-by-side "what you get" matrix for the billing page. Derives entirely from
 * the shared @chm/pricing source (same data + display helpers the marketing
 * pricing matrix uses) so the two surfaces can never disagree. Two row groups:
 * hard Limits (numeric) and Features (capability flags). The current plan's
 * column is highlighted.
 */

type LimitRow = {
  label: string
  /** Cell value per plan. */
  value: (plan: Plan) => string
}

type FeatureRow = {
  label: string
  /** Either a capability flag (✓/—) or a custom per-plan string. */
  capability?: PlanCapability
  value?: (plan: Plan) => string | boolean
}

const LIMIT_ROWS: LimitRow[] = [
  { label: 'ClickHouse hosts', value: planHosts },
  { label: 'Team seats', value: planSeats },
  { label: 'Alert rules', value: planAlertRules },
  { label: 'Conversation & insights history', value: planRetention },
  { label: 'AI usage', value: planAiUsage },
]

const FEATURE_ROWS: FeatureRow[] = [
  { label: 'Full monitoring dashboard', capability: 'core_monitoring' },
  { label: 'AI agent', capability: 'ai_agent' },
  { label: 'Scheduled AI Insights', capability: 'ai_insights_scheduled' },
  {
    label: 'Alerting',
    value: (plan) =>
      planHasCapability(plan.id, 'alerting_advanced')
        ? 'Advanced'
        : planHasCapability(plan.id, 'alerting_basic')
          ? 'Basic'
          : false,
  },
  { label: 'Anomaly detection', capability: 'anomaly_detection' },
  { label: 'Data export & reports', capability: 'data_export' },
  { label: 'Custom dashboards', capability: 'custom_dashboards' },
  { label: 'Webhook integrations', capability: 'webhook_integrations' },
  { label: 'Fleet view', capability: 'fleet_view' },
  { label: 'API / MCP access', capability: 'api_mcp_access' },
  { label: 'SSO / SAML, RBAC, audit logs', capability: 'sso_rbac_audit' },
  { label: 'Priority support', capability: 'priority_support' },
]

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex">
        <Check
          className="size-4 text-emerald-600 dark:text-emerald-400"
          strokeWidth={2}
          aria-label="Included"
        />
      </span>
    )
  }
  if (value === false) {
    return (
      <Minus
        className="text-muted-foreground/40 size-4"
        strokeWidth={1.5}
        aria-label="Not included"
      />
    )
  }
  return <span className="text-[13px] font-medium">{value}</span>
}

export function PlanComparison({ currentPlanId }: { currentPlanId: PlanId }) {
  const plans = BILLING_PLAN_LIST

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Compare plans</h2>
        <p className="text-muted-foreground text-sm">
          Everything you get on each tier, side by side.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="w-[30%] px-4 py-3 text-left font-medium text-muted-foreground">
                Plan
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.id}
                  className={cn(
                    'px-4 py-3 text-center font-semibold',
                    plan.id === currentPlanId && 'bg-muted/50'
                  )}
                >
                  <span className="flex flex-col items-center gap-0.5">
                    <span>{plan.name}</span>
                    {plan.id === currentPlanId && (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Current
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <RowGroup label="Limits" colSpan={plans.length + 1} />
            {LIMIT_ROWS.map((row) => (
              <tr key={row.label} className="border-b last:border-0">
                <td className="px-4 py-2.5 text-left text-muted-foreground">
                  {row.label}
                </td>
                {plans.map((plan) => (
                  <td
                    key={plan.id}
                    className={cn(
                      'px-4 py-2.5 text-center',
                      plan.id === currentPlanId && 'bg-muted/30'
                    )}
                  >
                    <Cell value={row.value(plan)} />
                  </td>
                ))}
              </tr>
            ))}

            <RowGroup label="Features" colSpan={plans.length + 1} />
            {FEATURE_ROWS.map((row) => (
              <tr key={row.label} className="border-b last:border-0">
                <td className="px-4 py-2.5 text-left text-muted-foreground">
                  {row.label}
                </td>
                {plans.map((plan) => {
                  const value: string | boolean = row.capability
                    ? planHasCapability(plan.id, row.capability)
                    : (row.value?.(plan) ?? false)
                  return (
                    <td
                      key={plan.id}
                      className={cn(
                        'px-4 py-2.5 text-center',
                        plan.id === currentPlanId && 'bg-muted/30'
                      )}
                    >
                      <span className="inline-flex items-center justify-center">
                        <Cell value={value} />
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function RowGroup({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <tr className="bg-muted/40 border-b">
      <td
        colSpan={colSpan}
        className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </td>
    </tr>
  )
}
