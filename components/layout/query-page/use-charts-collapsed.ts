/**
 * useChartsCollapsed Hook
 *
 * Manages the collapsed state of the charts section with localStorage persistence.
 * Supports both master collapse (all charts) and row-level collapse (per-row toggling).
 * The state is shared across all pages using QueryPageLayout.
 */

'use client'

import { useEffect, useState } from 'react'

const OLD_CHARTS_COLLAPSED_KEY = 'clickhouse-monitor-charts-collapsed'
const CHARTS_ROWS_KEY = 'clickhouse-monitor-chart-rows'

interface ChartsRowsState {
  allCollapsed: boolean
  collapsedRows: number[]
}

export interface UseChartsCollapsedReturn {
  isCollapsed: boolean
  collapsedRows: Set<number>
  toggleCollapsed: () => void
  toggleRow: (index: number) => void
  isRowCollapsed: (index: number) => boolean
}

const DEFAULT_STATE: ChartsRowsState = {
  allCollapsed: false,
  collapsedRows: [],
}

/**
 * Load state from localStorage with migration support
 * Only call this on client after hydration
 */
function loadFromStorage(): ChartsRowsState {
  // Check for new format first
  const stored = localStorage.getItem(CHARTS_ROWS_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // Invalid JSON, use defaults
    }
  }

  // Migrate from old format
  const oldStored = localStorage.getItem(OLD_CHARTS_COLLAPSED_KEY)
  if (oldStored !== null) {
    const allCollapsed = oldStored === 'true'
    const newState = { allCollapsed, collapsedRows: [] }

    // Save to new format and delete old key
    localStorage.setItem(CHARTS_ROWS_KEY, JSON.stringify(newState))
    localStorage.removeItem(OLD_CHARTS_COLLAPSED_KEY)

    return newState
  }

  return DEFAULT_STATE
}

/**
 * Persist state to localStorage
 */
function persistState(state: ChartsRowsState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CHARTS_ROWS_KEY, JSON.stringify(state))
  }
}

export function useChartsCollapsed(
  _rowCount?: number
): UseChartsCollapsedReturn {
  // Start with default state to match SSR
  const [state, setState] = useState<ChartsRowsState>(DEFAULT_STATE)

  // Load from localStorage after hydration to avoid mismatch
  useEffect(() => {
    setState(loadFromStorage())
  }, [])

  const toggleCollapsed = () => {
    setState((prev) => {
      const newState = {
        allCollapsed: !prev.allCollapsed,
        collapsedRows: prev.collapsedRows,
      }
      persistState(newState)
      return newState
    })
  }

  const toggleRow = (index: number) => {
    setState((prev) => {
      const collapsedSet = new Set(prev.collapsedRows)

      if (collapsedSet.has(index)) {
        collapsedSet.delete(index)
      } else {
        collapsedSet.add(index)
      }

      const newState = {
        allCollapsed: prev.allCollapsed,
        collapsedRows: Array.from(collapsedSet),
      }
      persistState(newState)
      return newState
    })
  }

  const isRowCollapsed = (index: number): boolean => {
    return state.collapsedRows.includes(index)
  }

  return {
    isCollapsed: state.allCollapsed,
    collapsedRows: new Set(state.collapsedRows),
    toggleCollapsed,
    toggleRow,
    isRowCollapsed,
  }
}
