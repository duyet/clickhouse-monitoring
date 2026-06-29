import { CheckIcon, ExternalLinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { createFileRoute } from '@tanstack/react-router'

import type { Plan } from '@/lib/billing/plans'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  BILLING_PLAN_LIST,
  getPlan,
  monthlyEquivalentUsd,
} from '@/lib/billing/plans'
import {
  openBillingPortal,
  startCheckout,
  useBillingSubscription,
} from '@/lib/billing/use-billing'
import { cn } from '@/lib/utils'

type Period = 'monthly' | 'yearly'

function priceLabel(plan: Plan, period: Period): string {
  if (plan.priceMonthlyUsd === null) return 'Custom'
  if (plan.priceMonthlyUsd === 0) return '$0'
  const v = monthlyEquivalentUsd(plan, period)
  return v === null ? 'Custom' : `$${v}`
}

function BillingPage() {
  const { data: sub, isLoading } = useBillingSubscription()
  const [period, setPeriod] = useState<Period>('yearly')
  const [busy, setBusy] = useState<string | null>(null)

  const currentPlanId = sub?.planId ?? 'free'
  const currentPlan = getPlan(currentPlanId)
  // 'none' means "never subscribed" — show it as the free plan, not a raw status.
  const hasSubscription = Boolean(sub && sub.status !== 'none')
  const statusLabel = hasSubscription ? sub?.status : 'free'

  async function onCheckout(planId: 'pro' | 'max') {
    setBusy(planId)
    try {
      await startCheckout(planId, period)
    } catch (err) {
      setBusy(null)
      toast.error(err instanceof Error ? err.message : 'Checkout failed')
    }
  }

  async function onPortal() {
    setBusy('portal')
    try {
      await openBillingPortal()
    } catch (err) {
      setBusy(null)
      toast.error(
        err instanceof Error ? err.message : 'Could not open billing portal'
      )
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground text-sm">
          Manage your plan and host limits. Early access is free while in beta.
        </p>
      </div>

      {/* Current plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {currentPlan.name}
                <Badge variant="secondary">
                  {isLoading ? '…' : statusLabel}
                </Badge>
              </CardTitle>
              <CardDescription>
                {currentPlan.hosts === null
                  ? 'Unlimited hosts'
                  : `${currentPlan.hosts} host${currentPlan.hosts === 1 ? '' : 's'} included`}
                {currentPlan.seats !== null &&
                  ` · ${currentPlan.seats} seat${currentPlan.seats === 1 ? '' : 's'}`}
              </CardDescription>
            </div>
            {hasSubscription && (
              <Button
                variant="outline"
                onClick={onPortal}
                disabled={busy !== null}
              >
                Manage billing <ExternalLinkIcon className="size-4" />
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Billing period toggle */}
      <div className="flex items-center justify-center gap-2">
        <div className="bg-muted inline-flex rounded-full p-1">
          {(['monthly', 'yearly'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors',
                period === p
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              )}
            >
              {p}
              {p === 'yearly' && (
                <span className="text-emerald-600 dark:text-emerald-400">
                  {' '}
                  · 2 months free
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plan grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {BILLING_PLAN_LIST.map((plan) => {
          const isCurrent = plan.id === currentPlanId
          const paid = plan.id === 'pro' || plan.id === 'max'
          return (
            <Card
              key={plan.id}
              className={cn(
                isCurrent && 'border-primary ring-primary/30 ring-1'
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {isCurrent && <Badge variant="secondary">Current</Badge>}
                </CardTitle>
                <div className="text-2xl font-bold tabular-nums">
                  {priceLabel(plan, period)}
                  {plan.priceMonthlyUsd != null && plan.priceMonthlyUsd > 0 ? (
                    <span className="text-muted-foreground text-sm font-normal">
                      {' '}
                      / mo
                    </span>
                  ) : null}
                </div>
                <CardDescription>{plan.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.highlights.map((h) => (
                    <li key={h} className="flex gap-2 text-sm">
                      <CheckIcon className="text-emerald-500 mt-0.5 size-4 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                {paid && !isCurrent && (
                  <Button
                    className="w-full"
                    onClick={() => onCheckout(plan.id as 'pro' | 'max')}
                    disabled={busy !== null}
                  >
                    {busy === plan.id
                      ? 'Redirecting…'
                      : `Upgrade to ${plan.name}`}
                  </Button>
                )}
                {plan.id === 'enterprise' && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href="mailto:hello@chmonitor.dev">Contact us</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/(dashboard)/billing')({
  component: BillingPage,
})
