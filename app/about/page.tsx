'use client'

import { Activity, BookOpen, Github, Server, Shield, Zap } from 'lucide-react'
import packageInfo from '@/package.json'

import { useState } from 'react'
import { useAnalyticsContext } from '@/components/analytics'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

const GITHUB_REPO =
  packageInfo.repository?.url ||
  'https://github.com/duyet/clickhouse-monitoring'
const LICENSE = 'MIT'

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
    <div className="mx-auto max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl space-y-8 py-8 px-4">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-12 items-center justify-center rounded-xl">
            <Server className="text-primary size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              ClickHouse Monitor
            </h1>
            <p className="text-muted-foreground text-sm">
              Monitoring Dashboard • v{packageInfo.version}
            </p>
          </div>
        </div>
        <p className="text-muted-foreground">{packageInfo.description}</p>
      </div>

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
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Open Source</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="group transition-shadow shadow-none">
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

          <Card className="group transition-shadow shadow-none">
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

      {/* Build Information - Only show in production builds */}
      {process.env.NEXT_PUBLIC_CI && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Build Information</h2>
          <Card className="shadow-none">
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Git Commit */}
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm font-medium">
                    Git Commit
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted rounded px-2 py-1 text-sm font-mono">
                      {process.env.NEXT_PUBLIC_GIT_SHA?.slice(0, 7)}
                    </code>
                    {process.env.NEXT_PUBLIC_GIT_SHA && (
                      <a
                        href={`https://github.com/duyet/clickhouse-monitoring/commit/${process.env.NEXT_PUBLIC_GIT_SHA}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground text-sm"
                        aria-label="View commit on GitHub"
                      >
                        <Github className="size-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Branch/Tag */}
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm font-medium">
                    Branch / Tag
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {process.env.NEXT_PUBLIC_GIT_REF}
                    </Badge>
                  </div>
                </div>

                {/* Build Timestamp */}
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-muted-foreground text-sm font-medium">
                    Build Time
                  </p>
                  <p className="text-sm">
                    {process.env.NEXT_PUBLIC_BUILD_TIMESTAMP
                      ? new Date(
                          process.env.NEXT_PUBLIC_BUILD_TIMESTAMP
                        ).toLocaleString('en-US', {
                          dateStyle: 'long',
                          timeStyle: 'medium',
                          timeZone: 'UTC',
                        })
                      : 'Unknown'}{' '}
                    <span className="text-muted-foreground">(UTC)</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <Separator />

      {/* Analytics Settings Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Privacy & Analytics</h2>
        <AnalyticsSettingsCard />
      </section>

      <Separator />

      <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
        <p>
          Released under the <Badge variant="outline">{LICENSE}</Badge> License
        </p>
      </div>
    </div>
  )
}

/**
 * Analytics Settings Card
 * Allows users to manage analytics preferences
 */
function AnalyticsSettingsCard() {
  const { hasConsent, setConsent, config } = useAnalyticsContext()
  const [isEnabled, setIsEnabled] = useState(hasConsent)

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked)
    setConsent(checked)
  }

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-5" />
          Analytics & Usage Tracking
        </CardTitle>
        <CardDescription>
          Help improve the dashboard by sharing anonymous usage data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle Switch */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Enable Analytics</p>
            <p className="text-muted-foreground text-xs">
              {isEnabled
                ? 'Analytics is enabled. Data is stored in your ClickHouse instance.'
                : 'Analytics is disabled. No usage data will be collected.'}
            </p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            aria-label="Toggle analytics"
          />
        </div>

        {/* What We Track */}
        <div className="space-y-2">
          <p className="text-sm font-medium">What We Track</p>
          <div className="grid gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex size-5 items-center justify-center rounded">
                <Zap className="text-primary size-3" />
              </div>
              <span>Page views and navigation patterns</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex size-5 items-center justify-center rounded">
                <Server className="text-primary size-3" />
              </div>
              <span>Feature usage (which charts are viewed)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex size-5 items-center justify-center rounded">
                <Shield className="text-primary size-3" />
              </div>
              <span>Performance metrics (load times, errors)</span>
            </div>
          </div>
        </div>

        {/* Privacy Guarantee */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-muted-foreground text-xs">
            <strong>Privacy Guarantee:</strong> All data is stored locally in
            your ClickHouse instance. We do not send data to external services
            or track personally identifiable information. You can opt out at any
            time.
          </p>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between border-t pt-3">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Status:</span>{' '}
            {hasConsent ? (
              <span className="text-green-600 dark:text-green-400">Active</span>
            ) : (
              <span className="text-muted-foreground">Disabled</span>
            )}
          </div>
          {hasConsent && (
            <a
              href="/page-views"
              className="text-primary hover:underline text-xs"
            >
              View Analytics
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
