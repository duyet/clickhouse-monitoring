import { useCallback, useMemo } from 'react'

interface TablePersistenceConfig {
  // Column persistence
  enableColumnPersistence?: boolean
  columnOrderStorageKey?: string
  columnVisibilityStorageKey?: string
  columnSizingStorageKey?: string

  // Row selection persistence
  enableRowSelectionPersistence?: boolean
  rowSelectionStorageKey?: string

  // Filter persistence
  enableFilterPersistence?: boolean
  filterStorageKey?: string

  // URL sync
  enableUrlSync?: boolean
  urlPrefix?: string
  storageNamespace?: string
}

interface TablePersistence {
  // Column persistence
  saveColumnOrder: (order: string[]) => void
  loadColumnOrder: () => string[] | null
  saveColumnVisibility: (visibility: Record<string, boolean>) => void
  loadColumnVisibility: () => Record<string, boolean> | null
  saveColumnSizing: (sizing: Record<string, number>) => void
  loadColumnSizing: () => Record<string, number> | null

  // Row selection persistence
  saveRowSelection: (selection: Record<string, boolean>) => void
  loadRowSelection: () => Record<string, boolean> | null

  // Filter persistence
  saveFilters: (filters: Record<string, string>) => void
  loadFilters: () => Record<string, string> | null

  // URL sync
  syncToUrl: (state: Record<string, any>) => void
  loadFromUrl: () => Record<string, any> | null

  // Cleanup
  clearAll: () => void
  clearColumns: () => void
  clearSelection: () => void
  clearFilters: () => void
}

const DEFAULT_NAMESPACE = 'data-table'
const DEFAULT_URL_PREFIX = 'table'

/**
 * Handles localStorage and URL synchronization for table state persistence
 */
export function useTablePersistence(
  config: TablePersistenceConfig = {}
): TablePersistence {
  const {
    enableColumnPersistence = true,
    columnOrderStorageKey,
    columnVisibilityStorageKey,
    columnSizingStorageKey,
    enableRowSelectionPersistence = true,
    rowSelectionStorageKey,
    enableFilterPersistence = true,
    filterStorageKey,
    enableUrlSync = false,
    urlPrefix = DEFAULT_URL_PREFIX,
    storageNamespace = DEFAULT_NAMESPACE,
  } = config

  // Generate storage keys with namespace
  const getStorageKey = useCallback(
    (key: string) => {
      return `${storageNamespace}-${key}`
    },
    [storageNamespace]
  )

  // Generate URL parameter key
  const getUrlParamKey = useCallback(
    (key: string) => {
      return `${urlPrefix}-${key}`
    },
    [urlPrefix]
  )

  // Safe localStorage access
  const safeLocalStorage = {
    getItem: (key: string) => {
      if (typeof window === 'undefined') return null
      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    },
    setItem: (key: string, value: string) => {
      if (typeof window === 'undefined') return
      try {
        localStorage.setItem(key, value)
      } catch {
        // Ignore localStorage errors
      }
    },
    removeItem: (key: string) => {
      if (typeof window === 'undefined') return
      try {
        localStorage.removeItem(key)
      } catch {
        // Ignore localStorage errors
      }
    },
  }

  // Column persistence methods
  const saveColumnOrder = useCallback(
    (order: string[]) => {
      if (!enableColumnPersistence) return
      const key = getStorageKey(columnOrderStorageKey || 'column-order')
      safeLocalStorage.setItem(key, JSON.stringify(order))
    },
    [enableColumnPersistence, getStorageKey, columnOrderStorageKey]
  )

  const loadColumnOrder = useCallback((): string[] | null => {
    if (!enableColumnPersistence) return null
    const key = getStorageKey(columnOrderStorageKey || 'column-order')
    const item = safeLocalStorage.getItem(key)
    return item ? JSON.parse(item) : null
  }, [enableColumnPersistence, getStorageKey, columnOrderStorageKey])

  const saveColumnVisibility = useCallback(
    (visibility: Record<string, boolean>) => {
      if (!enableColumnPersistence) return
      const key = getStorageKey(
        columnVisibilityStorageKey || 'column-visibility'
      )
      safeLocalStorage.setItem(key, JSON.stringify(visibility))
    },
    [enableColumnPersistence, getStorageKey, columnVisibilityStorageKey]
  )

  const loadColumnVisibility = useCallback((): Record<
    string,
    boolean
  > | null => {
    if (!enableColumnPersistence) return null
    const key = getStorageKey(columnVisibilityStorageKey || 'column-visibility')
    const item = safeLocalStorage.getItem(key)
    return item ? JSON.parse(item) : null
  }, [enableColumnPersistence, getStorageKey, columnVisibilityStorageKey])

  const saveColumnSizing = useCallback(
    (sizing: Record<string, number>) => {
      if (!enableColumnPersistence) return
      const key = getStorageKey(columnSizingStorageKey || 'column-sizing')
      safeLocalStorage.setItem(key, JSON.stringify(sizing))
    },
    [enableColumnPersistence, getStorageKey, columnSizingStorageKey]
  )

  const loadColumnSizing = useCallback((): Record<string, number> | null => {
    if (!enableColumnPersistence) return null
    const key = getStorageKey(columnSizingStorageKey || 'column-sizing')
    const item = safeLocalStorage.getItem(key)
    return item ? JSON.parse(item) : null
  }, [enableColumnPersistence, getStorageKey, columnSizingStorageKey])

  // Row selection persistence methods
  const saveRowSelection = useCallback(
    (selection: Record<string, boolean>) => {
      if (!enableRowSelectionPersistence) return
      const key = getStorageKey(rowSelectionStorageKey || 'row-selection')
      safeLocalStorage.setItem(key, JSON.stringify(selection))
    },
    [enableRowSelectionPersistence, getStorageKey, rowSelectionStorageKey]
  )

  const loadRowSelection = useCallback((): Record<string, boolean> | null => {
    if (!enableRowSelectionPersistence) return null
    const key = getStorageKey(rowSelectionStorageKey || 'row-selection')
    const item = safeLocalStorage.getItem(key)
    return item ? JSON.parse(item) : null
  }, [enableRowSelectionPersistence, getStorageKey, rowSelectionStorageKey])

  // Filter persistence methods
  const saveFilters = useCallback(
    (filters: Record<string, string>) => {
      if (!enableFilterPersistence) return
      const key = getStorageKey(filterStorageKey || 'filters')
      safeLocalStorage.setItem(key, JSON.stringify(filters))
    },
    [enableFilterPersistence, getStorageKey, filterStorageKey]
  )

  const loadFilters = useCallback((): Record<string, string> | null => {
    if (!enableFilterPersistence) return null
    const key = getStorageKey(filterStorageKey || 'filters')
    const item = safeLocalStorage.getItem(key)
    return item ? JSON.parse(item) : null
  }, [enableFilterPersistence, getStorageKey, filterStorageKey])

  // URL sync methods
  const syncToUrl = useCallback(
    (state: Record<string, any>) => {
      if (!enableUrlSync) return
      const params = new URLSearchParams(window.location.search)

      Object.entries(state).forEach(([key, value]) => {
        const paramKey = getUrlParamKey(key)
        if (value === null || value === undefined || value === '') {
          params.delete(paramKey)
        } else {
          params.set(paramKey, String(value))
        }
      })

      const newUrl = `${window.location.pathname}?${params.toString()}`
      window.history.replaceState({}, '', newUrl)
    },
    [enableUrlSync, getUrlParamKey]
  )

  const loadFromUrl = useCallback((): Record<string, any> | null => {
    if (!enableUrlSync) return null
    const params = new URLSearchParams(window.location.search)
    const result: Record<string, any> = {}

    params.forEach((value, key) => {
      if (key.startsWith(`${urlPrefix}-`)) {
        const stateKey = key.replace(`${urlPrefix}-`, '')
        result[stateKey] = value
      }
    })

    return Object.keys(result).length > 0 ? result : null
  }, [enableUrlSync, urlPrefix])

  // Cleanup methods
  const clearAll = useCallback(() => {
    if (enableColumnPersistence) {
      safeLocalStorage.removeItem(
        getStorageKey(columnOrderStorageKey || 'column-order')
      )
      safeLocalStorage.removeItem(
        getStorageKey(columnVisibilityStorageKey || 'column-visibility')
      )
      safeLocalStorage.removeItem(
        getStorageKey(columnSizingStorageKey || 'column-sizing')
      )
    }
    if (enableRowSelectionPersistence) {
      safeLocalStorage.removeItem(
        getStorageKey(rowSelectionStorageKey || 'row-selection')
      )
    }
    if (enableFilterPersistence) {
      safeLocalStorage.removeItem(getStorageKey(filterStorageKey || 'filters'))
    }
  }, [
    enableColumnPersistence,
    enableRowSelectionPersistence,
    enableFilterPersistence,
    getStorageKey,
    columnOrderStorageKey,
    columnVisibilityStorageKey,
    columnSizingStorageKey,
    rowSelectionStorageKey,
    filterStorageKey,
  ])

  const clearColumns = useCallback(() => {
    if (enableColumnPersistence) {
      safeLocalStorage.removeItem(
        getStorageKey(columnOrderStorageKey || 'column-order')
      )
      safeLocalStorage.removeItem(
        getStorageKey(columnVisibilityStorageKey || 'column-visibility')
      )
      safeLocalStorage.removeItem(
        getStorageKey(columnSizingStorageKey || 'column-sizing')
      )
    }
  }, [
    enableColumnPersistence,
    getStorageKey,
    columnOrderStorageKey,
    columnVisibilityStorageKey,
    columnSizingStorageKey,
  ])

  const clearSelection = useCallback(() => {
    if (enableRowSelectionPersistence) {
      safeLocalStorage.removeItem(
        getStorageKey(rowSelectionStorageKey || 'row-selection')
      )
    }
  }, [enableRowSelectionPersistence, getStorageKey, rowSelectionStorageKey])

  const clearFilters = useCallback(() => {
    if (enableFilterPersistence) {
      safeLocalStorage.removeItem(getStorageKey(filterStorageKey || 'filters'))
    }
  }, [enableFilterPersistence, getStorageKey, filterStorageKey])

  return useMemo(
    () => ({
      // Column persistence
      saveColumnOrder,
      loadColumnOrder,
      saveColumnVisibility,
      loadColumnVisibility,
      saveColumnSizing,
      loadColumnSizing,

      // Row selection persistence
      saveRowSelection,
      loadRowSelection,

      // Filter persistence
      saveFilters,
      loadFilters,

      // URL sync
      syncToUrl,
      loadFromUrl,

      // Cleanup
      clearAll,
      clearColumns,
      clearSelection,
      clearFilters,
    }),
    [
      saveColumnOrder,
      loadColumnOrder,
      saveColumnVisibility,
      loadColumnVisibility,
      saveColumnSizing,
      loadColumnSizing,
      saveRowSelection,
      loadRowSelection,
      saveFilters,
      loadFilters,
      syncToUrl,
      loadFromUrl,
      clearAll,
      clearColumns,
      clearSelection,
      clearFilters,
    ]
  )
}
