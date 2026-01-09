import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import type { RowSelectionState, ColumnOrderState, ColumnSizingState, SortingState } from '@tanstack/react-table'

interface PersistenceOptions {
  enableColumnOrderPersistence?: boolean
  enableFilterUrlSync?: boolean
  enableSelectionUrlSync?: boolean
  filterUrlPrefix?: string
  selectionUrlParam?: string
  storagePrefix?: string
}

interface TablePersistence<TState> {
  loadState: () => TState | null
  saveState: (state: TState) => void
  clearState: () => void
  syncWithURL: (state: TState) => void
  syncFromURL: () => TState | null
}

/**
 * Custom hook for managing table persistence (localStorage and URL synchronization)
 *
 * This hook provides a unified interface for:
 * - Storing table state in localStorage
 * - Synchronizing state with URL parameters for shareable links
 * - Graceful handling of storage errors
 * - Type-safe persistence operations
 *
 * Features:
 * - Optional localStorage persistence
 * - URL parameter synchronization for filters and selection
 * - Configurable storage keys and URL parameters
 * - Error-resistant storage operations
 * - Support for multiple state types (filters, selection, etc.)
 */
export function useTablePersistence<TState extends Record<string, any>>(
  storageKey: string,
  options: PersistenceOptions = {}
): TablePersistence<TState> {
  const {
    enableColumnOrderPersistence = false,
    enableFilterUrlSync = false,
    enableSelectionUrlSync = false,
    filterUrlPrefix = 'filter',
    selectionUrlParam = 'selection',
    storagePrefix = 'data-table',
  } = options

  const searchParams = useSearchParams()

  // Generate full storage key with prefix
  const fullStorageKey = useMemo(
    () => `${storagePrefix}-${storageKey}`,
    [storagePrefix, storageKey]
  )

  // Load state from localStorage
  const loadState = useCallback((): TState | null => {
    if (typeof window === 'undefined') return null

    try {
      const saved = localStorage.getItem(fullStorageKey)
      return saved ? JSON.parse(saved) : null
    } catch {
      // Ignore localStorage errors
      return null
    }
  }, [fullStorageKey])

  // Save state to localStorage
  const saveState = useCallback(
    (state: TState) => {
      if (typeof window === 'undefined' || !enableColumnOrderPersistence) return

      try {
        localStorage.setItem(fullStorageKey, JSON.stringify(state))
      } catch {
        // Ignore localStorage errors
      }
    },
    [fullStorageKey, enableColumnOrderPersistence]
  )

  // Clear state from localStorage
  const clearState = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(fullStorageKey)
    } catch {
      // Ignore localStorage errors
    }
  }, [fullStorageKey])

  // Sync state with URL parameters
  const syncWithURL = useCallback(
    (state: TState) => {
      if (!enableFilterUrlSync && !enableSelectionUrlSync) return

      const params = new URLSearchParams(searchParams.toString())

      // Sync filters
      if (enableFilterUrlSync && state.columnFilters) {
        // Clear existing filters
        params.delete(filterUrlPrefix)

        // Add new filters
        state.columnFilters.forEach((filter: any) => {
          if (filter.value && filter.value !== '') {
            params.append(`${filterUrlPrefix}[${filter.id}]`, filter.value)
          }
        })
      }

      // Sync selection
      if (enableSelectionUrlSync && state.rowSelection) {
        // Clear existing selection
        params.delete(selectionUrlParam)

        // Add new selection
        Object.keys(state.rowSelection).forEach(id => {
          if (state.rowSelection[id]) {
            params.append(selectionUrlParam, id)
          }
        })
      }

      // Update URL without triggering navigation
      if (typeof window !== 'undefined') {
        const newUrl = `${window.location.pathname}?${params.toString()}`
        window.history.replaceState({}, '', newUrl)
      }
    },
    [searchParams, enableFilterUrlSync, enableSelectionUrlSync, filterUrlPrefix, selectionUrlParam]
  )

  // Sync state from URL parameters
  const syncFromURL = useCallback((): TState | null => {
    if (!enableFilterUrlSync && !enableSelectionUrlSync) return null

    const state: Partial<TState> = {}

    // Parse filters from URL
    if (enableFilterUrlSync) {
      const filters: any[] = []
      searchParams.forEach((value, key) => {
        if (key.startsWith(`${filterUrlPrefix}[`)) {
          const id = key.match(/\[([^\]]+)\]/)?.[1]
          if (id) {
            filters.push({ id, value })
          }
        }
      })
      if (filters.length > 0) {
        state.columnFilters = filters
      }
    }

    // Parse selection from URL
    if (enableSelectionUrlSync) {
      const selection: RowSelectionState = {}
      searchParams.getAll(selectionUrlParam).forEach(id => {
        selection[id] = true
      })
      if (Object.keys(selection).length > 0) {
        state.rowSelection = selection
      }
    }

    return Object.keys(state).length > 0 ? (state as TState) : null
  }, [searchParams, enableFilterUrlSync, enableSelectionUrlSync, filterUrlPrefix, selectionUrlParam])

  return {
    loadState,
    saveState,
    clearState,
    syncWithURL,
    syncFromURL,
  }
}

/**
 * Specialized hook for persisting table column order
 */
export function useColumnOrderPersistence(
  storageKey: string,
  enabled: boolean = true
): {
  loadColumnOrder: () => ColumnOrderState
  saveColumnOrder: (order: ColumnOrderState) => void
  clearColumnOrder: () => void
} {
  const { loadState, saveState, clearState } = useTablePersistence<ColumnOrderState>(
    `column-order-${storageKey}`,
    { enableColumnOrderPersistence: enabled }
  )

  const loadColumnOrder = useCallback(() => loadState() || [], [loadState])
  const saveColumnOrder = useCallback(
    (order: ColumnOrderState) => saveState(order),
    [saveState]
  )
  const clearColumnOrder = useCallback(clearState, [clearState])

  return {
    loadColumnOrder,
    saveColumnOrder,
    clearColumnOrder,
  }
}

/**
 * Specialized hook for persisting table selection
 */
export function useSelectionPersistence(
  storageKey: string,
  enabled: boolean = true
): {
  loadSelection: () => RowSelectionState
  saveSelection: (selection: RowSelectionState) => void
  clearSelection: () => void
} {
  const { loadState, saveState, clearState } = useTablePersistence<RowSelectionState>(
    `selection-${storageKey}`,
    { enableColumnOrderPersistence: enabled }
  )

  const loadSelection = useCallback(() => loadState() || {}, [loadState])
  const saveSelection = useCallback(
    (selection: RowSelectionState) => saveState(selection),
    [saveState]
  )
  const clearSelection = useCallback(clearState, [clearState])

  return {
    loadSelection,
    saveSelection,
    clearSelection,
  }
}