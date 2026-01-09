'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { ColumnOrderState } from '@tanstack/react-table'

export interface TablePersistenceConfig {
  /** Enable localStorage persistence (default: true) */
  enableLocalStorage?: boolean
  /** Enable URL parameter sync (default: false) */
  enableUrlSync?: boolean
  /** LocalStorage key prefix */
  storagePrefix?: string
  /** Query config name for storage key generation */
  queryConfigName?: string
  /** URL parameter prefix for state sync */
  urlPrefix?: string
  /** Specific state keys to persist (all by default) */
  persistKeys?: Array<'columnOrder' | 'columnVisibility' | 'sorting' | 'pagination' | 'columnSizing'>
}

export interface TablePersistenceState {
  /** Column order from localStorage */
  columnOrder: ColumnOrderState
  /** Any URL query parameters that match the prefix */
  urlParams: Record<string, string>
}

/**
 * useTablePersistence - Handle localStorage and URL synchronization for table state
 *
 * Features:
 * - localStorage persistence for column order and visibility
 * - URL parameter synchronization for shareable table state
 * - State restoration on component mount
 * - Graceful error handling for localStorage failures
 * - Support for selective state persistence
 *
 * @example
 * ```tsx
 * const { loadState, saveState, syncToUrl, clearUrlParams } = useTablePersistence({
 *   queryConfigName: 'my-table',
 *   enableUrlSync: true,
 *   urlPrefix: 'table'
 * })
 * ```
 */
export function useTablePersistence(config: TablePersistenceConfig) {
  const {
    enableLocalStorage = true,
    enableUrlSync = false,
    storagePrefix = 'data-table',
    queryConfigName = 'default',
    urlPrefix = 'table',
    persistKeys = ['columnOrder', 'columnVisibility', 'sorting'],
  } = config

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Generate storage keys
  const storageKeys = useMemo(() => ({
    columnOrder: `${storagePrefix}-column-order-${queryConfigName}`,
    columnVisibility: `${storagePrefix}-column-visibility-${queryConfigName}`,
    sorting: `${storagePrefix}-sorting-${queryConfigName}`,
    pagination: `${storagePrefix}-pagination-${queryConfigName}`,
    columnSizing: `${storagePrefix}-column-sizing-${queryConfigName}`,
  }), [storagePrefix, queryConfigName])

  // Load state from localStorage
  const loadFromLocalStorage = useCallback((): Partial<TablePersistenceState> => {
    if (!enableLocalStorage || typeof window === 'undefined') {
      return {}
    }

    const state: Partial<TablePersistenceState> = {}

    if (persistKeys.includes('columnOrder')) {
      try {
        const saved = localStorage.getItem(storageKeys.columnOrder)
        if (saved) {
          state.columnOrder = JSON.parse(saved) as ColumnOrderState
        }
      } catch (error) {
        console.warn('Failed to load column order from localStorage:', error)
      }
    }

    return state
  }, [enableLocalStorage, persistKeys, storageKeys])

  // Load state from URL parameters
  const loadFromUrl = useCallback((): Partial<TablePersistenceState> => {
    if (!enableUrlSync || typeof window === 'undefined') {
      return {}
    }

    const urlParams: Record<string, string> = {}
    const params = new URLSearchParams(window.location.search)

    for (const [key, value] of params.entries()) {
      if (key.startsWith(`${urlPrefix}.`) && value) {
        const paramKey = key.slice(urlPrefix.length + 1)
        urlParams[paramKey] = value
      }
    }

    return { urlParams }
  }, [enableUrlSync, urlPrefix])

  // Save state to localStorage
  const saveToLocalStorage = useCallback(<T>(key: string, value: T) => {
    if (!enableLocalStorage || typeof window === 'undefined') {
      return
    }

    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }, [enableLocalStorage])

  // Save column order to localStorage
  const saveColumnOrder = useCallback((columnOrder: ColumnOrderState) => {
    if (persistKeys.includes('columnOrder')) {
      saveToLocalStorage(storageKeys.columnOrder, columnOrder)
    }
  }, [persistKeys, saveToLocalStorage, storageKeys])

  // Save column visibility to localStorage
  const saveColumnVisibility = useCallback((columnVisibility: Record<string, boolean>) => {
    if (persistKeys.includes('columnVisibility')) {
      saveToLocalStorage(storageKeys.columnVisibility, columnVisibility)
    }
  }, [persistKeys, saveToLocalStorage, storageKeys])

  // Save sorting state to localStorage
  const saveSorting = useCallback((sorting: Array<{ id: string; desc: boolean }>) => {
    if (persistKeys.includes('sorting')) {
      saveToLocalStorage(storageKeys.sorting, sorting)
    }
  }, [persistKeys, saveToLocalStorage, storageKeys])

  // Sync state to URL parameters
  const syncToUrl = useCallback((state: {
    columnOrder?: ColumnOrderState
    columnVisibility?: Record<string, boolean>
    sorting?: Array<{ id: string; desc: boolean }>
  }) => {
    if (!enableUrlSync || typeof window === 'undefined') {
      return
    }

    const params = new URLSearchParams(window.location.search)

    // Clear existing table parameters
    for (const key of Array.from(params.keys())) {
      if (key.startsWith(`${urlPrefix}.`)) {
        params.delete(key)
      }
    }

    // Add new parameters
    if (state.columnOrder && persistKeys.includes('columnOrder')) {
      params.set(`${urlPrefix}.columnOrder`, JSON.stringify(state.columnOrder))
    }

    if (state.columnVisibility && persistKeys.includes('columnVisibility')) {
      params.set(`${urlPrefix}.columnVisibility`, JSON.stringify(state.columnVisibility))
    }

    if (state.sorting && persistKeys.includes('sorting')) {
      params.set(`${urlPrefix}.sorting`, JSON.stringify(state.sorting))
    }

    // Update URL without navigation
    const newUrl = `${pathname}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
  }, [enableUrlSync, urlPrefix, persistKeys, pathname])

  // Clear URL parameters for table state
  const clearUrlParams = useCallback(() => {
    if (!enableUrlSync || typeof window === 'undefined') {
      return
    }

    const params = new URLSearchParams(window.location.search)
    for (const key of Array.from(params.keys())) {
      if (key.startsWith(`${urlPrefix}.`)) {
        params.delete(key)
      }
    }

    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`
    window.history.replaceState({}, '', newUrl)
  }, [enableUrlSync, urlPrefix, pathname])

  // Clear specific localStorage keys
  const clearLocalStorage = useCallback(() => {
    if (!enableLocalStorage || typeof window === 'undefined') {
      return
    }

    try {
      Object.values(storageKeys).forEach((key) => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  }, [enableLocalStorage, storageKeys])

  // Load all persistence state on mount
  const loadState = useCallback((): TablePersistenceState => {
    const localStorageState = loadFromLocalStorage()
    const urlState = loadFromUrl()

    return {
      columnOrder: localStorageState.columnOrder || [],
      urlParams: urlState.urlParams || {},
    }
  }, [loadFromLocalStorage, loadFromUrl])

  // Clear all persistence
  const clearAll = useCallback(() => {
    clearLocalStorage()
    clearUrlParams()
  }, [clearLocalStorage, clearUrlParams])

  // Auto-restore state on mount if enabled
  useEffect(() => {
    if (enableLocalStorage || enableUrlSync) {
      // This effect runs on mount to signal that restoration can happen
      // Actual restoration happens in the table component via loadState()
    }
  }, [enableLocalStorage, enableUrlSync])

  return {
    // State loading
    loadState,
    loadFromLocalStorage,
    loadFromUrl,

    // State saving
    saveColumnOrder,
    saveColumnVisibility,
    saveSorting,
    syncToUrl,

    // State clearing
    clearLocalStorage,
    clearUrlParams,
    clearAll,
  }
}