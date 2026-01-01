'use client'

import { Database, Loader2, Table as TableIcon } from 'lucide-react'

import { ExplorerBreadcrumb } from './explorer-breadcrumb'
import { ExplorerEmptyState } from './explorer-empty-state'
import { useExplorerState } from './hooks/use-explorer-state'
import { DataTab } from './tabs/data-tab'
import { DdlTab } from './tabs/ddl-tab'
import { IndexesTab } from './tabs/indexes-tab'
import { StructureTab } from './tabs/structure-tab'
import { useEffect, useRef, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface ExplorerContentProps {
  hostName?: string
}

// Track which tabs have been visited for this table to enable pre-loading
function useTabVisitTracker(tableKey: string | null) {
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['data']))
  const prevTableKey = useRef<string | null>(null)

  useEffect(() => {
    if (tableKey !== prevTableKey.current) {
      // Reset visited tabs when table changes
      setVisitedTabs(new Set(['data']))
      prevTableKey.current = tableKey
    }
  }, [tableKey])

  const markVisited = (tab: string) => {
    setVisitedTabs((prev) => new Set([...prev, tab]))
  }

  return { visitedTabs, markVisited }
}

export function ExplorerContent({ hostName }: ExplorerContentProps) {
  const { database, table, tab, setTab } = useExplorerState()
  const [isTabSwitching, setIsTabSwitching] = useState(false)
  const tableKey = database && table ? `${database}.${table}` : null
  const { visitedTabs, markVisited } = useTabVisitTracker(tableKey)

  // Handle tab switching with instant visual feedback
  const handleTabChange = (value: string) => {
    if (value === tab) return

    setIsTabSwitching(true)
    markVisited(value)
    setTab(value as any)

    // Clear switching state after a brief moment
    requestAnimationFrame(() => {
      setIsTabSwitching(false)
    })
  }

  if (!table || !database) {
    return <ExplorerEmptyState />
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <ExplorerBreadcrumb hostName={hostName} />

      {/* Quick info bar */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Database className="size-4" />
        <span>{database}</span>
        <span className="text-muted-foreground/50">/</span>
        <TableIcon className="size-4" />
        <span className="font-medium text-foreground">{table}</span>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="flex-1">
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
        </TabsList>

        {/* Render all visited tabs to keep their state, hide non-active ones */}
        <div className={cn('flex-1', tab !== 'data' && 'hidden')}>
          <TabsContent value="data" className="mt-4" forceMount>
            <DataTab />
          </TabsContent>
        </div>

        <div className={cn('flex-1', tab !== 'structure' && 'hidden')}>
          {visitedTabs.has('structure') ? (
            <TabsContent value="structure" className="mt-4" forceMount>
              <StructureTab />
            </TabsContent>
          ) : (
            <TabsContent value="structure" className="mt-4" />
          )}
        </div>

        <div className={cn('flex-1', tab !== 'ddl' && 'hidden')}>
          {visitedTabs.has('ddl') ? (
            <TabsContent value="ddl" className="mt-4" forceMount>
              <DdlTab />
            </TabsContent>
          ) : (
            <TabsContent value="ddl" className="mt-4" />
          )}
        </div>

        <div className={cn('flex-1', tab !== 'indexes' && 'hidden')}>
          {visitedTabs.has('indexes') ? (
            <TabsContent value="indexes" className="mt-4" forceMount>
              <IndexesTab />
            </TabsContent>
          ) : (
            <TabsContent value="indexes" className="mt-4" />
          )}
        </div>
      </Tabs>
    </div>
  )
}
