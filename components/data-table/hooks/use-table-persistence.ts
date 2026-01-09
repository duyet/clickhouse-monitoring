'use client'

import type { ColumnOrderState } from '@tanstack/react-table'
import { useCallback, useEffect, useMemo } from 'react'

export interface PersistenceConfig {
  /** Storage key prefix for localStorage */
  storageKey?: string
  /** Enable URL parameter synchronization */
  enableUrlSync?: boolean
  /** URL parameter prefix for filters */
  urlPrefix?: string
  /** Query configuration name for unique storage key */
  queryConfigName?: string
}

export interface PersistenceResult {
  /** Get storage key for localStorage */
  getStorageKey: () => string
  /** Save to localStorage */
  saveToLocalStorage: (key: string, value: unknown) => void
  /** Load from localStorage */
  loadFromLocalStorage: <T>(key: string) => T | null
  /** Remove from localStorage */
  removeFromLocalStorage: (key: string) => void
  /** Sync column order to localStorage */
  syncColumnOrder: (columnOrder: ColumnOrderState) => void
  /** Load column order from localStorage */
  loadColumnOrder: () => ColumnOrderState
  /** Clear stored column order */
  clearColumnOrder: () => void
  /** Get URL parameters */
  getUrlParams: () => URLSearchParams
  /** Update URL parameters */
  updateUrlParams: (params: Record<string, string>) => void
  /** Clear URL parameters */
  clearUrlParams: (prefix?: string) => void
}

/**
 * Custom hook for managing table state persistence
 *
 * Handles:
 * - localStorage for column order, sizing, visibility
 * - URL parameter synchronization for shareable links
 * - Automatic cleanup on unmount
 *
 * Usage:
 * ```typescript
 * const {
 *   syncColumnOrder,
 *   loadColumnOrder,
 *   updateUrlParams,
 *   clearUrlParams
 * } = useTablePersistence({
 *   queryConfigName: 'queries',
 *   enableUrlSync: true,
 *   urlPrefix: 'filter'
 * })
 * ```
 */
export function useTablePersistence(config: PersistenceConfig = {}): PersistenceResult {
  const {
    storageKey: customStorageKey,
    enableUrlSync = false,
    urlPrefix = 'filter',
    queryConfigName = 'default',
  } = config

  // Generate storage key
  const getStorageKey = useCallback((): string => {
    return customStorageKey || `data-table-${queryConfigName}`
  }, [customStorageKey, queryConfigName])

  // localStorage operations
  const saveToLocalStorage = useCallback((key: string, value: unknown): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }, [])

  const loadFromLocalStorage = useCallback(<T>(key: string): T | null => {
    if (typeof window === 'undefined') return null
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.warn('Failed to load from localStorage:', error)
      return null
    }
  }, [])

  const removeFromLocalStorage = useCallback((key: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error)
    }
  }, [])

  // Column order persistence
  const syncColumnOrder = useCallback((columnOrder: ColumnOrderState): void => {
    const key = getStorageKey()
    saveToLocalStorage(key, columnOrder)
  }, [getStorageKey, saveToLocalStorage])

  const loadColumnOrder = useCallback((): ColumnOrderState => {
    const key = getStorageKey()
    return loadFromLocalStorage<ColumnOrderState>(key) || []
  }, [getStorageKey, loadFromLocalStorage])

  const clearColumnOrder = useCallback((): void => {
    const key = getStorageKey()
    removeFromLocalStorage(key)
  }, [getStorageKey, removeFromLocalStorage])

  // URL parameter operations
  const getUrlParams = useCallback((): URLSearchParams => {
    if (typeof window === 'undefined') return new URLSearchParams()
    return new URLSearchParams(window.location.search)
  }, [])

  const updateUrlParams = useCallback((params: Record<string, string>): void => {
    if (typeof window === 'undefined') return
    if (!enableUrlSync) return

    const url = new URL(window.location.href)
    const searchParams = url.searchParams

    Object.entries(params).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        searchParams.delete(key)
      } else {
        searchParams.set(key, value)
      }
    })

    // Update URL without reload
    window.history.replaceState({}, '', url.toString())
  }, [enableUrlSync])

  const clearUrlParams = useCallback((prefix?: string): void => {
    if (typeof window === 'undefined') return
    if (!enableUrlSync) return

    const url = new URL(window.location.href)
    const searchParams = url.searchParams
    const clearPrefix = prefix || urlPrefix

    // Remove all params with the prefix
    const keysToRemove: string[] = []
    searchParams.forEach((_, key) => {
      if (key.startsWith(clearPrefix)) {
        keysToRemove.push(key)
      }
    })

    keysToRemove.forEach((key) => searchParams.delete(key))

    // Update URL without reload
    window.history.replaceState({}, '', url.toString())
  }, [enableUrlSync, urlPrefix])

  // Cleanup on unmount - remove any temporary URL params if needed
  useEffect(() => {
    return () => {
      // Cleanup logic if needed
    }
  }, [])

  return useMemo(() => ({
    getStorageKey,
    saveToLocalStorage,
    loadFromLocalStorage,
    removeFromLocalStorage,
    syncColumnOrder,
    loadColumnOrder,
    clearColumnOrder,
    getUrlParams,
    updateUrlParams,
    clearUrlParams,
  }), [
    getStorageKey,
    saveToLocalStorage,
    loadFromLocalStorage,
    removeFromLocalStorage,
    syncColumnOrder,
    loadColumnOrder,
    clearColumnOrder,
    getUrlParams,
    updateUrlParams,
    clearUrlParams,
  ])
}
