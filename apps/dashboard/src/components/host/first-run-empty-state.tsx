import { DatabaseZap } from 'lucide-react'

import { AppLink } from '@/components/ui/app-link'
import { EmptyState } from '@/components/ui/empty-state'

/**
 * First-run onboarding surface.
 *
 * Rendered when ZERO ClickHouse hosts are configured (env + browser). Without
 * this, the host switcher collapses to null and the dashboard is a bare,
 * confusing surface. Guides the operator to set the required env vars with a
 * link to the docs.
 *
 * @see components/host/first-run-gate.tsx
 */
export function FirstRunEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
      <EmptyState
        variant="no-data"
        icon={
          <DatabaseZap
            className="h-10 w-10 text-muted-foreground/60"
            strokeWidth={1.5}
          />
        }
        title="Connect a ClickHouse host to get started"
        description={
          <span className="block">
            No ClickHouse hosts are configured yet. Set{' '}
            <code className="rounded bg-muted px-1 text-[11px]">
              CLICKHOUSE_HOST
            </code>
            ,{' '}
            <code className="rounded bg-muted px-1 text-[11px]">
              CLICKHOUSE_USER
            </code>{' '}
            and{' '}
            <code className="rounded bg-muted px-1 text-[11px]">
              CLICKHOUSE_PASSWORD
            </code>{' '}
            (comma-separated for multiple hosts), then restart the app.
          </span>
        }
        className="max-w-lg"
      />

      {/* Doc links live outside EmptyState because its built-in actions are
          onClick-only (no href) and its description is line-clamped. */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <AppLink
          href="/docs/getting-started"
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-[13px] font-medium text-background hover:bg-foreground/90"
        >
          Getting started
        </AppLink>
        <AppLink
          href="/docs/reference/environment-variables"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] font-medium hover:bg-muted"
        >
          Environment variables
        </AppLink>
      </div>
    </div>
  )
}
