import { AlertTriangleIcon, CalendarClockIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { apiFetch } from '@/lib/swr/api-fetch'
import { cn } from '@/lib/utils'

/**
 * Current-plan usage summary — the used-vs-cap meters + renewal/cancel banner
 * shown inside the billing current-plan card. Data comes from
 * GET /api/v1/billing/usage (see routes/api/v1/billing/usage.ts).
 *
 * Cloud-only surface: in OSS the billing page is never gated (Clerk off), so the
 * endpoint 401s and this component quietly renders nothing.
 */

interface UsageMeter {
  used: number
  limit: number | null
  unlimited: boolean
}

interface BillingUsage {
  planId: string
  planName: string
  hosts: UsageMeter
  seats: UsageMeter
  aiMessages: UsageMeter
  renewal: {
    currentPeriodEnd: number | null
    cancelAtPeriodEnd: boolean
    status: string
    billingPeriod: 'monthly' | 'yearly' | null
  }
}

interface Envelope<T> {
  success: boolean
  data?: T
  error?: { message?: string }
}

async function fetchUsage(): Promise<BillingUsage> {
  const res = await apiFetch('/api/v1/billing/usage')
  const json = (await res
    .json()
    .catch(() => null)) as Envelope<BillingUsage> | null
  if (!res.ok || !json?.success || json.data === undefined) {
    throw new Error(json?.error?.message || `Request failed (${res.status})`)
  }
  return json.data
}

function useBillingUsage() {
  return useQuery({
    queryKey: ['billing', 'usage'],
    queryFn: fetchUsage,
    staleTime: 60_000,
    // Match useBillingSubscription: the Clerk __session cookie is refreshed a few
    // seconds after a cold load, so retry until the fresh cookie lands.
    refetchOnMount: 'always',
    retry: 5,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  })
}

/** "in 12 days" / "in 3 months"-style relative label for a unix-seconds instant. */
function formatRenewalDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function UsageSummary() {
  const { data, isLoading, isError } = useBillingUsage()

  // OSS / signed-out / not-configured: the endpoint errors — render nothing so
  // the card falls back to its plain entitlement description.
  if (isError) return null

  if (isLoading || !data) {
    return (
      <div className="space-y-4 pt-2">
        <Skeleton className="h-4 w-40" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const { hosts, seats, aiMessages, renewal } = data

  return (
    <div className="space-y-4 pt-2">
      <div className="grid gap-4 sm:grid-cols-3">
        <UsageMeterBar label="Hosts" meter={hosts} />
        <UsageMeterBar label="Team seats" meter={seats} />
        <UsageMeterBar label="AI messages today" meter={aiMessages} />
      </div>
      <RenewalBanner renewal={renewal} />
    </div>
  )
}

function UsageMeterBar({ label, meter }: { label: string; meter: UsageMeter }) {
  const { used, limit, unlimited } = meter
  // Percentage of the cap consumed (0 when unlimited — nothing to fill toward).
  const pct =
    unlimited || limit == null || limit <= 0
      ? 0
      : Math.min(100, Math.round((used / limit) * 100))
  const atLimit = !unlimited && limit != null && used >= limit
  const nearLimit = !unlimited && pct >= 80

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-muted-foreground text-xs font-medium">
          {label}
        </span>
        <span className="text-sm font-semibold tabular-nums">
          {used}
          <span className="text-muted-foreground font-normal">
            {unlimited || limit == null ? ' / ∞' : ` / ${limit}`}
          </span>
        </span>
      </div>
      <Progress
        value={pct}
        className={cn(
          '[&>div]:transition-all',
          atLimit
            ? '[&>div]:bg-destructive'
            : nearLimit
              ? '[&>div]:bg-amber-500'
              : undefined
        )}
      />
    </div>
  )
}

function RenewalBanner({ renewal }: { renewal: BillingUsage['renewal'] }) {
  const { currentPeriodEnd, cancelAtPeriodEnd, status } = renewal

  // Nothing meaningful to show for the free tier (no period, never subscribed).
  if (status === 'none' || currentPeriodEnd == null) return null

  const dateLabel = formatRenewalDate(currentPeriodEnd)

  if (cancelAtPeriodEnd) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
        <AlertTriangleIcon
          className="mt-0.5 size-3.5 shrink-0"
          strokeWidth={2}
        />
        <span>
          Your subscription is cancelled and will end on{' '}
          <span className="font-medium">{dateLabel}</span>. You keep access
          until then — reactivate any time from the billing portal.
        </span>
      </div>
    )
  }

  return (
    <div className="text-muted-foreground flex items-center gap-2 text-xs">
      <CalendarClockIcon className="size-3.5 shrink-0" strokeWidth={2} />
      <span>
        Renews on{' '}
        <span className="text-foreground font-medium">{dateLabel}</span>
      </span>
    </div>
  )
}
