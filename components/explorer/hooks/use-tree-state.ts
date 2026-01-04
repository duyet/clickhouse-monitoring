'use client'

import { useCallback, useEffect, useState } from 'react'

interface TreeState {
  expandedDatabases: Set<string>
  expandedTables: Set<string>
}

const STORAGE_KEY = 'explorer-tree-state'

function loadTreeState(): TreeState {
  if (typeof window === 'undefined') {
    return { expandedDatabases: new Set(), expandedTables: new Set() }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        expandedDatabases: new Set(parsed.expandedDatabases || []),
        expandedTables: new Set(parsed.expandedTables || []),
      }
    }
  } catch (error) {
    console.error('Failed to load tree state:', error)
  }

  return { expandedDatabases: new Set(), expandedTables: new Set() }
}

function saveTreeState(state: TreeState) {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        expandedDatabases: Array.from(state.expandedDatabases),
        expandedTables: Array.from(state.expandedTables),
      })
    )
  } catch (error) {
    console.error('Failed to save tree state:', error)
  }
}

export function useTreeState(
  database: string | null,
  table: string | null
): {
  expandedDatabases: Set<string>
  expandedTables: Set<string>
  toggleDatabase: (database: string) => void
  toggleTable: (key: string) => void
  isDatabaseExpanded: (database: string) => boolean
  isTableExpanded: (key: string) => boolean
} {
  const [state, setState] = useState<TreeState>(loadTreeState)

  // Auto-expand path to selected item
  useEffect(() => {
    if (database) {
      setState((prev) => {
        const newState = { ...prev }
        newState.expandedDatabases = new Set(prev.expandedDatabases)
        newState.expandedDatabases.add(database)

        if (table) {
          newState.expandedTables = new Set(prev.expandedTables)
          newState.expandedTables.add(`${database}.${table}`)
        }

        return newState
      })
    }
  }, [database, table])

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveTreeState(state)
  }, [state])

  const toggleDatabase = useCallback((database: string) => {
    setState((prev) => {
      const newExpandedDatabases = new Set(prev.expandedDatabases)
      if (newExpandedDatabases.has(database)) {
        newExpandedDatabases.delete(database)
      } else {
        newExpandedDatabases.add(database)
      }
      return { ...prev, expandedDatabases: newExpandedDatabases }
    })
  }, [])

  const toggleTable = useCallback((key: string) => {
    setState((prev) => {
      const newExpandedTables = new Set(prev.expandedTables)
      if (newExpandedTables.has(key)) {
        newExpandedTables.delete(key)
      } else {
        newExpandedTables.add(key)
      }
      return { ...prev, expandedTables: newExpandedTables }
    })
  }, [])

  const isDatabaseExpanded = useCallback(
    (database: string) => state.expandedDatabases.has(database),
    [state.expandedDatabases]
  )

  const isTableExpanded = useCallback(
    (key: string) => state.expandedTables.has(key),
    [state.expandedTables]
  )

  return {
    expandedDatabases: state.expandedDatabases,
    expandedTables: state.expandedTables,
    toggleDatabase,
    toggleTable,
    isDatabaseExpanded,
    isTableExpanded,
  }
}
