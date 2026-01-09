'use client'

import {
  type ColumnOrderState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface UseTablePersistenceOptions {
  /** Storage key for column order */
  columnOrderStorageKey?: string
  /** Query config name for default storage key */
  queryConfigName: string
  /** Enable URL state sync */
  enableUrlSync?: boolean
  /** URL parameter prefix */
  urlPrefix?: string
}

interface UseTablePersistenceResult {
  // Load/save column order
  loadColumnOrder: () => ColumnOrderState
  saveColumnOrder: (order: ColumnOrderState) => void
  clearColumnOrder: () => void

  // URL state management
  updateUrlState: (state: {
    sorting?: SortingState
    columnVisibility?: VisibilityState
    rowSelection?: RowSelectionState
  }) => void
  loadUrlState: () => {
    sorting: SortingState
    columnVisibility: VisibilityState
    rowSelection: RowSelectionState
  }

  // Storage key getter
  getStorageKey: () => string
}

/**
 * Handles persistence of table state to localStorage and URL parameters
 * Supports both localStorage for column order and URL sync for sharable state
 */
export function useTablePersistence({
  columnOrderStorageKey,
  queryConfigName,
  enableUrlSync = false,
  urlPrefix = 'filter',
}: UseTablePersistenceOptions): UseTablePersistenceResult {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const getStorageKey = useCallback(
    () => `data-table-column-order-${columnOrderStorageKey || queryConfigName}`,
    [columnOrderStorageKey, queryConfigName]
  )

  // Column order persistence
  const loadColumnOrder = useCallback((): ColumnOrderState => {
    if (typeof window === 'undefined') return []

    try {
      const saved = localStorage.getItem(getStorageKey())
      return saved ? (JSON.parse(saved) as ColumnOrderState) : []
    } catch {
      return []
    }
  }, [getStorageKey])

  const saveColumnOrder = useCallback(
    (order: ColumnOrderState) => {
      if (typeof window === 'undefined') return

      try {
        localStorage.setItem(getStorageKey(), JSON.stringify(order))
      } catch {
        // Ignore localStorage errors
      }
    },
    [getStorageKey]
  )

  const clearColumnOrder = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(getStorageKey())
    } catch {
      // Ignore localStorage errors
    }
  }, [getStorageKey])

  // URL state management
  const updateUrlState = useCallback(
    (state: {
      sorting?: SortingState
      columnVisibility?: VisibilityState
      rowSelection?: RowSelectionState
    }) => {
      if (!enableUrlSync) return

      const params = new URLSearchParams(searchParams.toString())

      // Update sorting
      if (state.sorting !== undefined) {
        if (state.sorting.length > 0) {
          params.set(`${urlPrefix}_sort`, JSON.stringify(state.sorting))
        } else {
          params.delete(`${urlPrefix}_sort`)
        }
      }

      // Update column visibility
      if (state.columnVisibility !== undefined) {
        const hiddenCols = Object.entries(state.columnVisibility)
          .filter(([, visible]) => !visible)
          .map(([col]) => col)
        if (hiddenCols.length > 0) {
          params.set(`${urlPrefix}_hide`, hiddenCols.join(','))
        } else {
          params.delete(`${urlPrefix}_hide`)
        }
      }

      // Update row selection
      if (state.rowSelection !== undefined) {
        const selectedRows = Object.keys(state.rowSelection)
        if (selectedRows.length > 0) {
          params.set(`${urlPrefix}_select`, selectedRows.join(','))
        } else {
          params.delete(`${urlPrefix}_select`)
        }
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [enableUrlSync, router, pathname, searchParams, urlPrefix]
  )

  const loadUrlState = useCallback((): {
    sorting: SortingState
    columnVisibility: VisibilityState
    rowSelection: RowSelectionState
  } => {
    if (!enableUrlSync) {
      return { sorting: [], columnVisibility: {}, rowSelection: {} }
    }

    const sortingParam = searchParams.get(`${urlPrefix}_sort`)
    const hideParam = searchParams.get(`${urlPrefix}_hide`)
    const selectParam = searchParams.get(`${urlPrefix}_select`)

    // Parse sorting
    let sorting: SortingState = []
    if (sortingParam) {
      try {
        sorting = JSON.parse(sortingParam) as SortingState
      } catch {
        // Invalid JSON, ignore
      }
    }

    // Parse column visibility (hidden columns)
    let columnVisibility: VisibilityState = {}
    if (hideParam) {
      const hiddenCols = hideParam.split(',')
      // Note: This returns only hidden columns; the actual visibility state
      // will be built from all columns in the table component
      hiddenCols.forEach((col) => {
        columnVisibility[col] = false
      })
    }

    // Parse row selection
    let rowSelection: RowSelectionState = {}
    if (selectParam) {
      const selectedRows = selectParam.split(',')
      selectedRows.forEach((rowId) => {
        rowSelection[rowId] = true
      })
    }

    return { sorting, columnVisibility, rowSelection }
  }, [enableUrlSync, searchParams, urlPrefix])

  return {
    loadColumnOrder,
    saveColumnOrder,
    clearColumnOrder,
    updateUrlState,
    loadUrlState,
    getStorageKey,
  }
}