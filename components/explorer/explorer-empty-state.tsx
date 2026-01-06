'use client'

import type { LucideIcon } from 'lucide-react'
import {
  DatabaseIcon,
  DatabaseZapIcon,
  HardDriveIcon,
  Loader2,
  RefreshCwIcon,
  ServerIcon,
  TableIcon,
} from 'lucide-react'
import useSWR from 'swr'

import { useExplorerState } from './hooks/use-explorer-state'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useHostId } from '@/lib/swr'

interface Database {
  name: string
  engine: string
  item_count: number
}

function getDatabaseIcon(engine: string): {
  icon: LucideIcon
  color: string
  bg: string
} {
  switch (engine) {
    case 'PostgreSQL':
    case 'MaterializedPostgreSQL':
      return {
        icon: ServerIcon,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-500/10 group-hover:bg-blue-500/20',
      }
    case 'MySQL':
    case 'MaterializedMySQL':
      return {
        icon: DatabaseZapIcon,
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-500/10 group-hover:bg-orange-500/20',
      }
    case 'SQLite':
      return {
        icon: HardDriveIcon,
        color: 'text-sky-600 dark:text-sky-400',
        bg: 'bg-sky-500/10 group-hover:bg-sky-500/20',
      }
    case 'Replicated':
      return {
        icon: RefreshCwIcon,
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-500/10 group-hover:bg-green-500/20',
      }
    case 'Lazy':
      return {
        icon: DatabaseIcon,
        color: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-500/10 group-hover:bg-yellow-500/20',
      }
    // Atomic is the default ClickHouse database engine
    default:
      return {
        icon: DatabaseIcon,
        color: 'text-primary',
        bg: 'bg-primary/10 group-hover:bg-primary/20',
      }
  }
}

interface ApiResponse<T> {
  data: T
  metadata?: Record<string, unknown>
}

const fetcher = (url: string): Promise<ApiResponse<Database[]>> =>
  fetch(url).then((res) => res.json())

export function ExplorerEmptyState() {
  const hostId = useHostId()
  const { setDatabase } = useExplorerState()
  const {
    data: response,
    error,
    isLoading,
  } = useSWR<ApiResponse<Database[]>>(
    `/api/v1/explorer/databases?hostId=${hostId}`,
    fetcher
  )

  const databases = response?.data

  return (
    <div className="flex h-full flex-col gap-6 p-8">
      {/* Welcome Header */}
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <DatabaseIcon className="size-16 text-muted-foreground" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Welcome to Data Explorer</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Select a database and table from the sidebar to view its data,
            structure, DDL, indexes, and dependencies.
          </p>
        </div>
      </div>

      {/* Database List */}
      <div className="flex flex-col gap-4">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TableIcon className="size-4" />
          Available Databases
          {isLoading && <Loader2 className="size-3 animate-spin" />}
        </h4>

        {error && (
          <div className="text-sm text-destructive">
            Failed to load databases: {error.message}
          </div>
        )}

        {isLoading && !databases && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        )}

        {databases && databases.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No databases found
          </div>
        )}

        {databases && databases.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {databases.map((db) => {
              const { icon: Icon, color, bg } = getDatabaseIcon(db.engine)
              return (
                <Card
                  key={db.name}
                  className="group cursor-pointer p-4 transition-all hover:border-primary/50 hover:bg-muted/50"
                  onClick={() => setDatabase(db.name)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-9 items-center justify-center rounded-md transition-colors ${bg}`}
                    >
                      <Icon className={`size-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{db.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {db.item_count} {db.item_count === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
