import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  BookOpen,
  Bot,
  Database,
  FileText,
  Github,
  LifeBuoy,
  Plug,
  Rocket,
  Server,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'

import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { baseOptions } from '@/lib/layout.shared'
import { dashboardUrl, gitConfig } from '@/lib/shared'

export const Route = createFileRoute('/')({
  component: HomePage,
})

interface DocLink {
  title: string
  href: string
  desc: string
}

interface DocSection {
  icon: LucideIcon
  name: string
  href: string
  tagline: string
  links: DocLink[]
}

const SECTIONS: DocSection[] = [
  {
    icon: BookOpen,
    name: 'Guide',
    href: '/guide',
    tagline: 'Install chmonitor, connect a cluster, and learn each feature.',
    links: [
      {
        title: 'Getting started',
        href: '/guide/getting-started',
        desc: 'Run the dashboard against your first ClickHouse host.',
      },
      {
        title: 'Features',
        href: '/guide/features',
        desc: 'Overview, queries, tables, cluster, explorer, and more.',
      },
      {
        title: 'AI agent',
        href: '/guide/ai-agent',
        desc: 'Ask natural-language questions grounded in live data.',
      },
      {
        title: 'Guides',
        href: '/guide/guides/troubleshooting',
        desc: 'Proxy auth, upgrades, and troubleshooting walkthroughs.',
      },
    ],
  },
  {
    icon: Server,
    name: 'Operate',
    href: '/operate',
    tagline: 'Deploy, secure, and tune chmonitor for production.',
    links: [
      {
        title: 'Deploy',
        href: '/operate/deploy',
        desc: 'Docker, Kubernetes, Cloudflare Workers, Vercel, Traefik.',
      },
      {
        title: 'Authentication',
        href: '/operate/authentication',
        desc: 'Public, Clerk, Cloudflare Access, or trusted-header.',
      },
      {
        title: 'Multiple hosts',
        href: '/operate/advanced/multiple-hosts',
        desc: 'Monitor several clusters from one deployment.',
      },
      {
        title: 'Feature permissions',
        href: '/operate/advanced/feature-permissions',
        desc: 'Per-feature access control and editions.',
      },
    ],
  },
  {
    icon: FileText,
    name: 'Reference',
    href: '/reference',
    tagline: 'Configuration, APIs, integrations, and release history.',
    links: [
      {
        title: 'Configuration',
        href: '/reference/configuration',
        desc: 'Every setting that shapes the dashboard.',
      },
      {
        title: 'Environment variables',
        href: '/reference/environment-variables',
        desc: 'The full list of supported env vars.',
      },
      {
        title: 'MCP server',
        href: '/reference/mcp-server',
        desc: 'Expose monitoring tools to MCP-compatible clients.',
      },
      {
        title: 'Migrating to v0.3',
        href: '/reference/migrating/v0-3',
        desc: 'Upgrade notes from the Next.js-era app.',
      },
    ],
  },
]

const HIGHLIGHTS = [
  { icon: Database, label: 'Reads system.* tables — no agents' },
  { icon: Bot, label: 'Built-in AI agent' },
  { icon: Plug, label: 'MCP server' },
  { icon: ShieldCheck, label: 'Pluggable auth' },
]

function HomePage() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-14 sm:py-20">
        <Intro />
        <SectionGrid />
        <HelpRow />
      </main>
    </HomeLayout>
  )
}

function Intro() {
  return (
    <section className="mb-14 max-w-3xl">
      <span className="inline-flex items-center gap-2 rounded-full border bg-fd-secondary/40 px-3 py-1 text-xs font-medium text-fd-muted-foreground">
        Documentation
      </span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        chmonitor documentation
      </h1>
      <p className="mt-4 text-balance text-lg text-fd-muted-foreground">
        Everything to install, operate, and extend chmonitor — a read-only
        ClickHouse dashboard powered by your{' '}
        <code className="text-fd-foreground">system.*</code> tables. Pick a
        section below, or jump straight to{' '}
        <a
          href="/guide/getting-started"
          className="font-medium text-fd-primary underline underline-offset-4"
        >
          getting started
        </a>
        .
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        {HIGHLIGHTS.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-2 text-sm text-fd-muted-foreground"
          >
            <Icon className="size-4 text-fd-primary" />
            {label}
          </span>
        ))}
      </div>
    </section>
  )
}

function SectionGrid() {
  return (
    <section className="grid gap-5 lg:grid-cols-3">
      {SECTIONS.map(({ icon: Icon, name, href, tagline, links }) => (
        <div
          key={name}
          className="flex flex-col rounded-2xl border bg-fd-card p-6 transition-colors hover:border-fd-primary/40"
        >
          <a href={href} className="group flex items-center gap-3">
            <span className="inline-flex rounded-lg border bg-fd-secondary/40 p-2 text-fd-primary">
              <Icon className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight group-hover:text-fd-primary">
              {name}
            </span>
            <ArrowRight className="size-4 text-fd-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-fd-primary" />
          </a>
          <p className="mt-3 text-sm text-fd-muted-foreground">{tagline}</p>
          <ul className="mt-5 flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="group block rounded-lg px-3 py-2 -mx-3 transition-colors hover:bg-fd-accent"
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium group-hover:text-fd-accent-foreground">
                    {link.title}
                    <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                  <span className="mt-0.5 block text-xs text-fd-muted-foreground">
                    {link.desc}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}

function HelpRow() {
  const repo = `https://github.com/${gitConfig.user}/${gitConfig.repo}`
  const cards = [
    {
      icon: Rocket,
      title: 'Live demo',
      desc: 'Open the hosted dashboard.',
      href: dashboardUrl,
      external: true,
    },
    {
      icon: LifeBuoy,
      title: 'Troubleshooting',
      desc: 'Fixes for common setup issues.',
      href: '/guide/guides/troubleshooting',
      external: false,
    },
    {
      icon: Settings,
      title: 'FAQ',
      desc: 'Answers to frequent questions.',
      href: '/reference/faq',
      external: false,
    },
    {
      icon: Github,
      title: 'GitHub',
      desc: 'Source, issues, and discussions.',
      href: repo,
      external: true,
    },
  ]
  return (
    <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ icon: Icon, title, desc, href, external }) => (
        <a
          key={title}
          href={href}
          {...(external
            ? { target: '_blank', rel: 'noreferrer noopener' }
            : {})}
          className="group flex items-start gap-3 rounded-xl border bg-fd-card p-4 transition-colors hover:border-fd-primary/40"
        >
          <span className="inline-flex rounded-lg border bg-fd-secondary/40 p-2 text-fd-primary">
            <Icon className="size-4" />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold group-hover:text-fd-primary">
              {title}
            </span>
            <span className="text-xs text-fd-muted-foreground">{desc}</span>
          </span>
        </a>
      ))}
    </section>
  )
}
