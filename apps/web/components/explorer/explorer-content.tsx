'use client'

import { ExternalLink, Loader2, SquareTerminal } from 'lucide-react'

import { DatabaseOverview } from './database-overview'
import { ExplorerBreadcrumb } from './explorer-breadcrumb'
import { ExplorerEmptyState } from './explorer-empty-state'
import { type ExplorerTab, useExplorerState } from './hooks/use-explorer-state'
import { DataTab } from './tabs/data-tab'
import { DdlTab } from './tabs/ddl-tab'
import { DependenciesTab } from './tabs/dependencies-tab'
import { IndexesTab } from './tabs/indexes-tab'
import { QueryTab } from './tabs/query-tab'
import { StructureTab } from './tabs/structure-tab'
import { useEffect, useRef, useState } from 'react'
import { AppLink as Link } from '@/components/ui/app-link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHostId } from '@/lib/swr'
import { cn } from '@/lib/utils'

interface ExplorerContentProps {
  hostName?: string
}

// Track which tabs have been visited for this table to enable pre-loading
function useTabVisitTracker(tableKey: string | null, currentTab: ExplorerTab) {
  const [visitedTabs, setVisitedTabs] = useState<Set<ExplorerTab>>(
    () => new Set<ExplorerTab>(['data', currentTab])
  )
  const prevTableKey = useRef<string | null>(null)

  // Reset visited tabs when table changes, keeping the active tab
  // biome-ignore lint/correctness/useExhaustiveDependencies: currentTab is only used to seed the set on table reset
  useEffect(() => {
    if (tableKey !== prevTableKey.current) {
      setVisitedTabs(new Set<ExplorerTab>(['data', currentTab]))
      prevTableKey.current = tableKey
    }
  }, [tableKey])

  // Track visited tabs when currentTab changes externally (e.g. URL/history navigation)
  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(currentTab)) return prev
      const next = new Set(prev)
      next.add(currentTab)
      return next
    })
  }, [currentTab])

  const markVisited = (tab: ExplorerTab) => {
    setVisitedTabs((prev) => {
      if (prev.has(tab)) return prev
      const next = new Set(prev)
      next.add(tab)
      return next
    })
  }

  return { visitedTabs, markVisited }
}

export function ExplorerContent({ hostName }: ExplorerContentProps) {
  const hostId = useHostId()
  const { database, table, tab, setTab } = useExplorerState()
  const [isTabSwitching, setIsTabSwitching] = useState(false)
  const tableKey = database && table ? `${database}.${table}` : null
  const { visitedTabs, markVisited } = useTabVisitTracker(tableKey, tab)

  // Handle tab switching with instant visual feedback
  const handleTabChange = (value: string) => {
    if (value === tab) return

    setIsTabSwitching(true)
    markVisited(value as ExplorerTab)
    setTab(value as ExplorerTab)

    // Clear switching state after a brief moment
    requestAnimationFrame(() => {
      setIsTabSwitching(false)
    })
  }

  // No database selected and not on query tab — show empty state
  if (!database && tab !== 'query') {
    return <ExplorerEmptyState />
  }

  // Database selected but no table, and not on query tab — show database overview
  if (database && !table && tab !== 'query') {
    return <DatabaseOverview database={database} />
  }

  // Query tab without a table context — render standalone (no tab strip)
  if (tab === 'query' && !table) {
    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
        <ExplorerBreadcrumb hostName={hostName} />
        <QueryTab />
      </div>
    )
  }

  const partInfoUrl = `/part-info?host=${hostId}&database=${encodeURIComponent(database!)}&table=${encodeURIComponent(table!)}`

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <ExplorerBreadcrumb hostName={hostName} />

      <Tabs id="explorer-tabs" value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="data" className="gap-2">
            Data
            {isTabSwitching && tab === 'data' && (
              <Loader2 className="size-3 animate-spin" />
            )}
          </TabsTrigger>
          <TabsTrigger value="structure" className="gap-2">
            Structure
            {isTabSwitching && tab === 'structure' && (
              <Loader2 className="size-3 animate-spin" />
            )}
          </TabsTrigger>
          <TabsTrigger value="ddl" className="gap-2">
            DDL
            {isTabSwitching && tab === 'ddl' && (
              <Loader2 className="size-3 animate-spin" />
            )}
          </TabsTrigger>
          <TabsTrigger value="indexes" className="gap-2">
            Indexes
            {isTabSwitching && tab === 'indexes' && (
              <Loader2 className="size-3 animate-spin" />
            )}
          </TabsTrigger>
          <TabsTrigger value="dependencies" className="gap-2">
            Dependencies
            {isTabSwitching && tab === 'dependencies' && (
              <Loader2 className="size-3 animate-spin" />
            )}
          </TabsTrigger>
          <TabsTrigger value="query" className="gap-2">
            <SquareTerminal className="size-3.5" />
            Query
            {isTabSwitching && tab === 'query' && (
              <Loader2 className="size-3 animate-spin" />
            )}
          </TabsTrigger>
          <Link
            href={partInfoUrl}
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-[color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Parts
            <ExternalLink className="size-3" />
          </Link>
        </TabsList>

        {/* Data tab: always force-mounted to preserve pagination state */}
        <TabsContent
          value="data"
          className={cn('mt-4', tab !== 'data' && 'hidden flex-none')}
          forceMount
        >
          <DataTab />
        </TabsContent>

        {/* Structure tab: don't force-mount due to complex filter state */}
        <TabsContent value="structure" className="mt-4 flex-none">
          <StructureTab />
        </TabsContent>

        {/* DDL tab: force-mount to keep content cached */}
        <TabsContent
          value="ddl"
          className={cn('mt-4', tab !== 'ddl' && 'hidden flex-none')}
          forceMount
        >
          {visitedTabs.has('ddl') && <DdlTab />}
        </TabsContent>

        {/* Indexes tab: force-mount to keep content cached */}
        <TabsContent
          value="indexes"
          className={cn('mt-4', tab !== 'indexes' && 'hidden flex-none')}
          forceMount
        >
          {visitedTabs.has('indexes') && <IndexesTab />}
        </TabsContent>

        {/* Dependencies tab: force-mount to keep content cached */}
        <TabsContent
          value="dependencies"
          className={cn('mt-4', tab !== 'dependencies' && 'hidden flex-none')}
          forceMount
        >
          {visitedTabs.has('dependencies') && <DependenciesTab />}
        </TabsContent>

        {/* Query tab: force-mount to preserve editor state */}
        <TabsContent
          value="query"
          className={cn('mt-4', tab !== 'query' && 'hidden flex-none')}
          forceMount
        >
          {visitedTabs.has('query') && <QueryTab />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
