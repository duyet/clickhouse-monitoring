'use client'

import { ExplorerBreadcrumb } from './explorer-breadcrumb'
import { ExplorerEmptyState } from './explorer-empty-state'
import { useExplorerState } from './hooks/use-explorer-state'
import { DataTab } from './tabs/data-tab'
import { DdlTab } from './tabs/ddl-tab'
import { IndexesTab } from './tabs/indexes-tab'
import { StructureTab } from './tabs/structure-tab'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ExplorerContentProps {
  hostName?: string
}

export function ExplorerContent({ hostName }: ExplorerContentProps) {
  const { database, table, tab, setTab } = useExplorerState()

  if (!table || !database) {
    return <ExplorerEmptyState />
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <ExplorerBreadcrumb hostName={hostName} />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as any)}
        className="flex-1"
      >
        <TabsList>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="ddl">DDL</TabsTrigger>
          <TabsTrigger value="indexes">Indexes</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="flex-1">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <DataTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="structure" className="flex-1">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <StructureTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="ddl" className="flex-1">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <DdlTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="indexes" className="flex-1">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <IndexesTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
