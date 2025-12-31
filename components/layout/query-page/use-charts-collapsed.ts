/**
 * useChartsCollapsed Hook
 *
 * Manages the collapsed state of the charts section with localStorage persistence.
 * The state is shared across all pages using QueryPageLayout.
 */

'use client'

import { useState } from 'react'

const CHARTS_COLLAPSED_KEY = 'clickhouse-monitor-charts-collapsed'

export function useChartsCollapsed() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(CHARTS_COLLAPSED_KEY)
      return stored === 'true'
    }
    return false
  })

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const newValue = !prev
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(CHARTS_COLLAPSED_KEY, String(newValue))
      }
      return newValue
    })
  }

  return { isCollapsed, toggleCollapsed }
}
