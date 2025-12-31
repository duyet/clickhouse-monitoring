'use client'

import { BookOpen, Github, Heart, Server, Shield, Zap } from 'lucide-react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import packageInfo from '@/package.json'

const GITHUB_REPO = packageInfo.repository?.url || 'https://github.com/duyet/clickhouse-monitoring'
const LICENSE = 'MIT'

interface VersionResponse {
  ui: string
  clickhouse?: string | { version: string }[]
}

function VersionInfo() {
  const { data, error, isLoading } = useSWR<VersionResponse>('/api/version', {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  })

  const chVersion =
    data?.clickhouse && typeof data.clickhouse === 'object' && 'version' in data.clickhouse
      ? (data.clickhouse as { version: string }).version
      : typeof data?.clickhouse === 'string'
        ? data.clickhouse
        : null

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase">Dashboard UI</p>
          <p className="text-2xl font-semibold">{packageInfo.version}</p>
        </div>
        <Zap className="text-primary size-8" />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase">ClickHouse</p>
          <p className="text-2xl font-semibold">
            {chVersion || <span className="text-muted-foreground text-sm">Not connected</span>}
          </p>
        </div>
        <Server className="text-blue-500 size-8" />
      </div>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex gap-3">
      <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
        <Icon className="text-primary size-5" />
      </div>
      <div className="space-y-1">
        <h3 className="font-medium">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  )
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-12 items-center justify-center rounded-xl">
            <Server className="text-primary size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ClickHouse Monitor</h1>
            <p className="text-muted-foreground text-sm">Monitoring Dashboard</p>
          </div>
        </div>
        <p className="text-muted-foreground">{packageInfo.description}</p>
      </div>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Version Information</h2>
        <VersionInfo />
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Key Features</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <FeatureCard
            icon={Zap}
            title="Real-time Monitoring"
            description="Monitor queries, merges, mutations, and system metrics in real-time using ClickHouse system tables."
          />
          <FeatureCard
            icon={Shield}
            title="Multi-host Support"
            description="Connect to and monitor multiple ClickHouse clusters from a single dashboard interface."
          />
          <FeatureCard
            icon={BookOpen}
            title="Query Insights"
            description="Analyze running and historical queries, identify bottlenecks, and optimize performance."
          />
          <FeatureCard
            icon={Server}
            title="System Overview"
            description="View tables, replicas, disks, clusters, and ZooKeeper status at a glance."
          />
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Technology Stack</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Next.js 16</Badge>
              <Badge variant="secondary">React 19</Badge>
              <Badge variant="secondary">TypeScript</Badge>
              <Badge variant="secondary">Tailwind CSS</Badge>
              <Badge variant="secondary">shadcn/ui</Badge>
              <Badge variant="secondary">ClickHouse</Badge>
              <Badge variant="secondary">SWR</Badge>
              <Badge variant="secondary">Turbopack</Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Open Source</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="group hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="size-5" />
                Source Code
              </CardTitle>
              <CardDescription>
                Contribute, report issues, or star the project on GitHub
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a
                  href={GITHUB_REPO.replace('git+', '').replace('.git', '')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="mr-2 size-4" />
                  View Repository
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="size-5" />
                Documentation
              </CardTitle>
              <CardDescription>
                Learn how to configure and use the monitoring dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a
                  href={`${GITHUB_REPO.replace('git+', '').replace('.git', '')}#readme`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BookOpen className="mr-2 size-4" />
                  Read Docs
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
        <p>
          Released under the <Badge variant="outline">{LICENSE}</Badge> License
        </p>
        <p className="flex items-center gap-1">
          Made with <Heart className="size-3.5 fill-red-500 text-red-500" /> by{' '}
          <a
            href="https://github.com/duyet"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            @duyet
          </a>
        </p>
      </div>
    </div>
  )
}
