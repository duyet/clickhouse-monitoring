'use client'

import { GithubIcon, InfoIcon } from 'lucide-react'
import Link from 'next/link'

const GITHUB_REPO = 'https://github.com/duyet/clickhouse-monitoring'
const VERSION = '0.1.0'
const DESCRIPTION = 'Simple ClickHouse UI that relies on system tables to help monitor and provide overview of your cluster'

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
          <InfoIcon className="size-8" aria-hidden="true" />
          About
        </h1>
        <p className="text-muted-foreground">
          Learn more about the ClickHouse Monitoring Dashboard
        </p>
      </div>

      {/* Main Content */}
      <div className="grid gap-6">
        {/* Dashboard Info Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Dashboard Information</h2>
          <dl className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <dt className="text-muted-foreground text-sm font-medium">Version</dt>
            <dd className="text-sm">
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                {VERSION}
              </code>
            </dd>

            <dt className="text-muted-foreground text-sm font-medium">Description</dt>
            <dd className="text-sm">{DESCRIPTION}</dd>

            <dt className="text-muted-foreground text-sm font-medium">Technology</dt>
            <dd className="text-sm">
              Next.js {process.env.NEXT_VERSION || '16'} + React 19 + ClickHouse
            </dd>
          </dl>
        </div>

        {/* GitHub Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <GithubIcon className="size-5" aria-hidden="true" />
            Source Code
          </h2>
          <p className="text-muted-foreground mb-4 text-sm">
            The source code is available on GitHub. Feel free to report issues, suggest features, or contribute.
          </p>
          <Link
            href={GITHUB_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <GithubIcon className="size-4" aria-hidden="true" />
            View on GitHub
          </Link>
        </div>

        {/* ClickHouse Server Info Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">ClickHouse Server</h2>
          <p className="text-muted-foreground text-sm">
            This dashboard connects to your ClickHouse server to provide monitoring insights.
            The server version and configuration can be found in the{' '}
            <Link href="/settings" className="underline hover:text-foreground">
              Settings
            </Link>{' '}
            page.
          </p>
        </div>
      </div>
    </div>
  )
}
