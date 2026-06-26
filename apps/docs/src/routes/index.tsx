import {
  ArrowRight,
  Bot,
  Boxes,
  Database,
  Gauge,
  Github,
  Plug,
  ShieldCheck,
} from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'

import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { baseOptions } from '@/lib/layout.shared'
import { dashboardUrl, gitConfig } from '@/lib/shared'

export const Route = createFileRoute('/')({
  component: HomePage,
})

const FEATURES = [
  {
    icon: Gauge,
    title: 'Real-time monitoring',
    body: 'Live queries, memory, disk, and CPU read straight from system.* tables — no agents, no extra storage.',
  },
  {
    icon: Database,
    title: 'Tables & storage',
    body: 'Track table sizes, parts, compression, and disk growth across every database.',
  },
  {
    icon: Boxes,
    title: 'Cluster & replication',
    body: 'Replication lag, queue depth, and replica health across every host in the cluster.',
  },
  {
    icon: Bot,
    title: 'AI agent',
    body: 'Ask natural-language questions about your cluster and get answers grounded in live data.',
  },
  {
    icon: Plug,
    title: 'MCP server',
    body: 'Expose monitoring tools to Claude, Cursor, and any MCP-compatible AI client.',
  },
  {
    icon: ShieldCheck,
    title: 'Pluggable auth',
    body: 'Public, Clerk, Cloudflare Access, or trusted-header — with per-feature access control.',
  },
]

function HomePage() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="flex flex-1 flex-col">
        <Hero />
        <FeatureGrid />
        <ClosingCta />
      </main>
    </HomeLayout>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      {/* Visual art: layered radial glow + grid, in the fumadocs.dev spirit. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-20%,var(--color-fd-primary)/18%,transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(circle_at_50%_0%,black,transparent_70%)] bg-[linear-gradient(to_right,var(--color-fd-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-fd-border)_1px,transparent_1px)] bg-[size:36px_36px] opacity-40"
      />
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center sm:py-32">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border bg-fd-secondary/40 px-3 py-1 text-xs font-medium text-fd-muted-foreground">
          Open source · self-hostable · read-only by default
        </span>
        <h1 className="bg-gradient-to-b from-fd-foreground to-fd-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
          Monitor ClickHouse,
          <br className="hidden sm:block" /> without the guesswork.
        </h1>
        <p className="mt-6 max-w-2xl text-balance text-lg text-fd-muted-foreground">
          chmonitor is a client-rendered dashboard for ClickHouse — query
          performance, storage, cluster health, and an AI agent, all reading
          live from your <code className="text-fd-foreground">system.*</code>{' '}
          tables.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/getting-started"
            className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-semibold text-fd-primary-foreground transition-opacity hover:opacity-90"
          >
            Get started
            <ArrowRight className="size-4" />
          </a>
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-lg border bg-fd-card px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
          >
            Live demo
          </a>
          <a
            href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-fd-muted-foreground transition-colors hover:text-fd-foreground"
          >
            <Github className="size-4" />
            Star on GitHub
          </a>
        </div>
        <div className="mt-10 w-full max-w-xl">
          <div className="overflow-hidden rounded-xl border bg-fd-card text-left shadow-sm">
            <div className="flex items-center gap-1.5 border-b bg-fd-secondary/30 px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-red-400/70" />
              <span className="size-2.5 rounded-full bg-yellow-400/70" />
              <span className="size-2.5 rounded-full bg-green-400/70" />
              <span className="ml-2 text-xs text-fd-muted-foreground">
                docker
              </span>
            </div>
            <pre className="overflow-x-auto px-4 py-4 text-sm leading-relaxed">
              <code>
                <span className="text-fd-muted-foreground">
                  # one command to run the dashboard
                </span>
                {'\n'}docker run -p 3000:3000 \{'\n'}
                {'  '}-e CLICKHOUSE_HOST=https://your-host:8443 \{'\n'}
                {'  '}duyet/clickhouse-monitoring
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureGrid() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Everything you need to operate ClickHouse
        </h2>
        <p className="mt-3 text-fd-muted-foreground">
          One dashboard for queries, storage, replication, and the AI tooling on
          top of it.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="group rounded-xl border bg-fd-card p-5 transition-colors hover:border-fd-primary/40"
          >
            <div className="mb-3 inline-flex rounded-lg border bg-fd-secondary/40 p-2 text-fd-primary">
              <Icon className="size-5" />
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm text-fd-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ClosingCta() {
  return (
    <section className="border-t">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Ready in five minutes
        </h2>
        <p className="mt-3 max-w-xl text-fd-muted-foreground">
          Point it at a ClickHouse host and deploy on Docker, Kubernetes,
          Cloudflare Workers, or Vercel.
        </p>
        <a
          href="/getting-started"
          className="mt-7 inline-flex items-center gap-2 rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-semibold text-fd-primary-foreground transition-opacity hover:opacity-90"
        >
          Read the guide
          <ArrowRight className="size-4" />
        </a>
      </div>
    </section>
  )
}
