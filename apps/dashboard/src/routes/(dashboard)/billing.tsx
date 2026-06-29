import { ExternalLinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { createFileRoute } from '@tanstack/react-router'

import { useState } from 'react'
import {
  type BillingPeriod,
  BillingPeriodToggle,
  CurrentPlanBadge,
  PlanCard,
  PopularBadge,
} from '@/components/billing/plan-card'
import { PlanComparison } from '@/components/billing/plan-comparison'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { BILLING_PLAN_LIST, getPlan } from '@/lib/billing/plans'
import {
  openBillingPortal,
  startCheckout,
  useBillingSubscription,
} from '@/lib/billing/use-billing'

function BillingPage() {
  const { data: sub, isLoading } = useBillingSubscription()
  const [period, setPeriod] = useState<BillingPeriod>('yearly')
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
      <BillingPeriodToggle value={period} onChange={setPeriod} />

      {/* Plan grid */}
      <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-4">
        {BILLING_PLAN_LIST.map((plan) => {
          const isCurrent = plan.id === currentPlanId
          const paid = plan.id === 'pro' || plan.id === 'max'
          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              period={period}
              featured={plan.id === 'pro'}
              badge={
                isCurrent ? (
                  <CurrentPlanBadge />
                ) : plan.id === 'pro' ? (
                  <PopularBadge />
                ) : undefined
              }
              cta={
                isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : paid ? (
                  <Button
                    className="w-full"
                    onClick={() => onCheckout(plan.id as 'pro' | 'max')}
                    disabled={busy !== null}
                  >
                    {busy === plan.id
                      ? 'Redirecting…'
                      : `Upgrade to ${plan.name}`}
                  </Button>
                ) : plan.id === 'enterprise' ? (
                  <Button variant="outline" className="w-full" asChild>
                    <a href="mailto:hello@chmonitor.dev">Contact us</a>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Free forever
                  </Button>
                )
              }
            />
          )
        })}
      </div>

      {/* Full benefits matrix */}
      <PlanComparison currentPlanId={currentPlanId} />
    </div>
  )
}

export const Route = createFileRoute('/(dashboard)/billing')({
  component: BillingPage,
})
