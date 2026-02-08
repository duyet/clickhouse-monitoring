'use client'

import {
  ArrowRightIcon,
  BarChartIcon,
  DashboardIcon,
  HomeIcon,
  MixIcon,
  ShuffleIcon,
  TableIcon,
  UpdateIcon,
} from '@radix-ui/react-icons'
import {
  BookOpenIcon,
  CircleDollarSignIcon,
  CpuIcon,
  DatabaseZapIcon,
  HardDriveIcon,
  RollerCoasterIcon,
  ScrollTextIcon,
  ShieldAlertIcon,
  ShieldIcon,
  UngroupIcon,
} from 'lucide-react'

import Link from 'next/link'
import { Suspense } from 'react'
import { BentoGrid, BentoItem } from '@/components/overview/bento-grid'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useHosts } from '@/lib/swr/use-hosts'

// ============================================================================
// Types
// ============================================================================

interface QuickStat {
  readonly label: string
  readonly value: string | number
  readonly icon: React.ComponentType<{ className?: string }>
  readonly href: string
  readonly description?: string
}

interface NavCard {
  readonly title: string
  readonly description: string
  readonly href: string
  readonly icon: React.ComponentType<{ className?: string }>
  readonly badge?: string
}

// ============================================================================
// Quick Stats Component
// ============================================================================

function QuickStatsSkeleton() {
  return (
    <BentoGrid className="mb-6">
      {[...Array(4)].map((_, i) => (
        <BentoItem key={i} size="small">
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-md" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </BentoItem>
      ))}
    </BentoGrid>
  )
}

interface QuickStatsProps {
  hostCount: number
}

function QuickStats({ hostCount }: QuickStatsProps) {
  // For now, show static quick stats that link to relevant pages
  // In the future, this could fetch real-time metrics
  const stats: QuickStat[] = [
    {
      label: 'Connected Hosts',
      value: hostCount,
      icon: UngroupIcon,
      href: '/clusters',
      description: 'ClickHouse clusters',
    },
    {
      label: 'Running Queries',
      value: 'View',
      icon: MixIcon,
      href: '/running-queries',
      description: 'Active queries',
    },
    {
      label: 'Tables',
      value: 'Explore',
      icon: TableIcon,
      href: '/explorer',
      description: 'Database explorer',
    },
    {
      label: 'Merges',
      value: 'Monitor',
      icon: ShuffleIcon,
      href: '/merges',
      description: 'Merge operations',
    },
  ]

  return (
    <BentoGrid className="mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <BentoItem key={stat.label} size="small" interactive>
            <Link
              href={stat.href}
              className="flex flex-col h-full justify-between group"
            >
              <div className="flex items-center gap-2">
                <div className="flex shrink-0 items-center justify-center rounded-md p-1.5 bg-blue-500/10 text-blue-500 dark:bg-blue-500/20">
                  <Icon className="size-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-2xl font-semibold">{stat.value}</span>
                <ArrowRightIcon className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          </BentoItem>
        )
      })}
    </BentoGrid>
  )
}

// ============================================================================
// Navigation Cards Component
// ============================================================================

interface NavigationCardsProps {
  className?: string
}

function NavigationCardsSkeleton({ className }: NavigationCardsProps) {
  return (
    <div className={className}>
      <h2 className="text-lg font-semibold mb-3">Quick Navigation</h2>
      <BentoGrid>
        {[...Array(8)].map((_, i) => (
          <BentoItem key={i} size="small">
            <div className="flex flex-col h-full">
              <Skeleton className="size-8 rounded-md mb-3" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </BentoItem>
        ))}
      </BentoGrid>
    </div>
  )
}

function NavigationCards({ className }: NavigationCardsProps) {
  const navCards: NavCard[] = [
    {
      title: 'Query Monitoring',
      description:
        'Running queries, history, failures, and performance analysis',
      href: '/running-queries',
      icon: MixIcon,
    },
    {
      title: 'Database Explorer',
      description: 'Browse databases, tables, and schema metadata',
      href: '/explorer',
      icon: TableIcon,
    },
    {
      title: 'Merge Operations',
      description: 'Active merges, mutations, and performance metrics',
      href: '/merges',
      icon: ShuffleIcon,
    },
    {
      title: 'Cluster Overview',
      description: 'Cluster configuration, ZooKeeper, and connections',
      href: '/clusters',
      icon: UngroupIcon,
    },
    {
      title: 'Metrics & Monitoring',
      description: 'Real-time server metrics and async metrics',
      href: '/metrics',
      icon: BarChartIcon,
    },
    {
      title: 'Security Logs',
      description: 'Sessions, login attempts, and audit logs',
      href: '/security/sessions',
      icon: ShieldIcon,
      badge: 'New',
    },
    {
      title: 'System Logs',
      description: 'Text logs, stack traces, and crash reports',
      href: '/logs/text-log',
      icon: ScrollTextIcon,
      badge: 'New',
    },
    {
      title: 'Custom Dashboard',
      description: 'Build your own monitoring dashboards',
      href: '/dashboard',
      icon: DashboardIcon,
    },
  ]

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold mb-3">Quick Navigation</h2>
      <BentoGrid>
        {navCards.map((card) => {
          const Icon = card.icon
          return (
            <BentoItem key={card.title} size="small" interactive>
              <Link href={card.href} className="flex flex-col h-full group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex shrink-0 items-center justify-center rounded-md p-1.5 bg-muted/50">
                    <Icon className="size-5" />
                  </div>
                  {card.badge && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 dark:bg-blue-500/20">
                      {card.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {card.description}
                </p>
              </Link>
            </BentoItem>
          )
        })}
      </BentoGrid>
    </div>
  )
}

// ============================================================================
// Hero Section Component
// ============================================================================

interface HeroSectionProps {
  hostCount: number
}

function HeroSection({ hostCount }: HeroSectionProps) {
  return (
    <div className="mb-8 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <HomeIcon className="size-6" />
          <h1 className="text-3xl font-bold tracking-tight">
            ClickHouse Monitor
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Real-time monitoring and analytics dashboard for ClickHouse clusters.
          View query performance, table metrics, merge operations, and system
          health in one place.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="lg">
          <Link href="/overview?host=0">
            Go to Dashboard
            <ArrowRightIcon className="ml-2 size-4" />
          </Link>
        </Button>

        {hostCount > 1 && (
          <Button asChild variant="outline" size="lg">
            <Link href="/clusters">
              View Clusters
              <UngroupIcon className="ml-2 size-4" />
            </Link>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-green-500 animate-pulse" />
          <span>
            {hostCount} host{hostCount !== 1 ? 's' : ''} connected
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Landing Page Content
// ============================================================================

function LandingPageContent() {
  const { hosts } = useHosts()
  const hostCount = hosts?.length ?? 0

  return (
    <div className="space-y-8 pb-8">
      <HeroSection hostCount={hostCount} />

      <Suspense fallback={<QuickStatsSkeleton />}>
        <QuickStats hostCount={hostCount} />
      </Suspense>

      <Suspense fallback={<NavigationCardsSkeleton />}>
        <NavigationCards />
      </Suspense>

      {/* Additional Features Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">System & Operations</h2>
        <BentoGrid>
          <BentoItem size="small" interactive>
            <Link href="/disks" className="flex flex-col h-full group">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex shrink-0 items-center justify-center rounded-md p-1.5 bg-muted/50">
                  <HardDriveIcon className="size-5" />
                </div>
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                  Storage Disks
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Monitor disk usage and configuration
              </p>
            </Link>
          </BentoItem>

          <BentoItem size="small" interactive>
            <Link href="/settings" className="flex flex-col h-full group">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex shrink-0 items-center justify-center rounded-md p-1.5 bg-muted/50">
                  <UpdateIcon className="size-5" />
                </div>
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                  Server Settings
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                View and manage ClickHouse configuration
              </p>
            </Link>
          </BentoItem>

          <BentoItem size="small" interactive>
            <Link
              href="/zookeeper?path=/"
              className="flex flex-col h-full group"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex shrink-0 items-center justify-center rounded-md p-1.5 bg-muted/50">
                  <RollerCoasterIcon className="size-5" />
                </div>
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                  ZooKeeper/Keeper
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Browse distributed coordination data
              </p>
            </Link>
          </BentoItem>

          <BentoItem size="small" interactive>
            <Link href="/profiler" className="flex flex-col h-full group">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex shrink-0 items-center justify-center rounded-md p-1.5 bg-blue-500/10 text-blue-500 dark:bg-blue-500/20">
                  <CpuIcon className="size-5" />
                </div>
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                  CPU Profiler
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-500 dark:bg-blue-500/20">
                  New
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Profile query performance
              </p>
            </Link>
          </BentoItem>

          <BentoItem size="small" interactive>
            <Link href="/query-cache" className="flex flex-col h-full group">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex shrink-0 items-center justify-center rounded-md p-1.5 bg-muted/50">
                  <DatabaseZapIcon className="size-5" />
                </div>
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                  Query Cache
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Cache hit/miss statistics
              </p>
            </Link>
          </BentoItem>

          <BentoItem size="small" interactive>
            <Link
              href="/expensive-queries"
              className="flex flex-col h-full group"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex shrink-0 items-center justify-center rounded-md p-1.5 bg-muted/50">
                  <CircleDollarSignIcon className="size-5" />
                </div>
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                  Expensive Queries
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Resource-intensive query analysis
              </p>
            </Link>
          </BentoItem>

          <BentoItem size="small" interactive>
            <Link href="/dictionaries" className="flex flex-col h-full group">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex shrink-0 items-center justify-center rounded-md p-1.5 bg-blue-500/10 text-blue-500 dark:bg-blue-500/20">
                  <BookOpenIcon className="size-5" />
                </div>
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                  Dictionaries
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-500 dark:bg-blue-500/20">
                  New
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                External dictionary status
              </p>
            </Link>
          </BentoItem>

          <BentoItem size="small" interactive>
            <Link
              href="/security/audit-log"
              className="flex flex-col h-full group"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex shrink-0 items-center justify-center rounded-md p-1.5 bg-blue-500/10 text-blue-500 dark:bg-blue-500/20">
                  <ShieldAlertIcon className="size-5" />
                </div>
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                  Audit Log
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-500 dark:bg-blue-500/20">
                  New
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Security events and access control
              </p>
            </Link>
          </BentoItem>
        </BentoGrid>
      </div>
    </div>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function HomePage() {
  return (
    <Suspense fallback={<QuickStatsSkeleton />}>
      <LandingPageContent />
    </Suspense>
  )
}
