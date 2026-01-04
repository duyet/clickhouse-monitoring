'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'

export type ExplorerTab =
  | 'data'
  | 'structure'
  | 'ddl'
  | 'indexes'
  | 'dependencies'

export interface ExplorerState {
  hostId: number
  database: string | null
  table: string | null
  engine: string | null
  tab: ExplorerTab
}

export function useExplorerState(): ExplorerState & {
  setDatabase: (database: string | null) => void
  setTable: (table: string | null, engine?: string | null) => void
  setDatabaseAndTable: (
    database: string,
    table: string,
    engine?: string
  ) => void
  setTab: (tab: ExplorerTab) => void
} {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const state = useMemo<ExplorerState>(() => {
    const hostParam = searchParams.get('host')
    const hostId = hostParam !== null ? Number(hostParam) : 0

    return {
      hostId: Number.isNaN(hostId) ? 0 : hostId,
      database: searchParams.get('database'),
      table: searchParams.get('table'),
      engine: searchParams.get('engine'),
      tab: (searchParams.get('tab') as ExplorerTab) || 'data',
    }
  }, [searchParams])

  const updateParams = useCallback(
    (updates: Partial<Omit<ExplorerState, 'hostId'>>) => {
      const params = new URLSearchParams(searchParams.toString())

      if (updates.database !== undefined) {
        if (updates.database === null) {
          params.delete('database')
          params.delete('table') // Clear table when database is cleared
          params.delete('engine')
        } else {
          params.set('database', updates.database)
        }
      }

      if (updates.table !== undefined) {
        if (updates.table === null) {
          params.delete('table')
          params.delete('engine')
        } else {
          params.set('table', updates.table)
        }
      }

      if (updates.engine !== undefined) {
        if (updates.engine === null) {
          params.delete('engine')
        } else {
          params.set('engine', updates.engine)
        }
      }

      if (updates.tab !== undefined) {
        params.set('tab', updates.tab)
      }

      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, pathname, router]
  )

  const setDatabase = useCallback(
    (database: string | null) => {
      updateParams({ database, table: null }) // Clear table when changing database
    },
    [updateParams]
  )

  const setTable = useCallback(
    (table: string | null, engine?: string | null) => {
      updateParams({ table, engine: engine ?? null })
    },
    [updateParams]
  )

  const setDatabaseAndTable = useCallback(
    (database: string, table: string, engine?: string) => {
      updateParams({ database, table, engine: engine ?? null, tab: 'data' })
    },
    [updateParams]
  )

  const setTab = useCallback(
    (tab: ExplorerTab) => {
      updateParams({ tab })
    },
    [updateParams]
  )

  return {
    ...state,
    setDatabase,
    setTable,
    setDatabaseAndTable,
    setTab,
  }
}
