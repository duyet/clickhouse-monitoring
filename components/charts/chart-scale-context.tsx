'use client'

import type { YAxisScale } from '@/types/charts'

import { createContext, useContext, useEffect, useState } from 'react'

const LOCAL_STORAGE_KEY = 'chart-log-scale-preference'

interface ChartScaleContextValue {
  /** Current scale preference */
  scale: YAxisScale
  /** Whether log scale is enabled (for toggle state) */
  isLogScale: boolean
  /** Toggle between linear and auto (log) scale */
  toggleScale: () => void
  /** Set scale explicitly */
  setScale: (scale: YAxisScale) => void
}

const ChartScaleContext = createContext<ChartScaleContextValue | null>(null)

/**
 * Get initial scale preference from localStorage
 */
function getInitialScale(): YAxisScale {
  if (typeof window === 'undefined') return 'linear'
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored === 'linear' || stored === 'log' || stored === 'auto') {
      return stored
    }
  } catch {
    // Ignore storage errors
  }
  return 'linear' // Default to linear scale (log scale off)
}

/**
 * Save scale preference to localStorage
 */
function saveScale(scale: YAxisScale) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, scale)
  } catch {
    // Ignore storage errors
  }
}

interface ChartScaleProviderProps {
  children: React.ReactNode
  /** Override scale (when not using global preference) */
  initialScale?: YAxisScale
}

/**
 * Provider for chart scale context
 * Manages scale state with localStorage persistence
 */
export function ChartScaleProvider({
  children,
  initialScale,
}: ChartScaleProviderProps) {
  const [scale, setScaleState] = useState<YAxisScale>(
    initialScale ?? getInitialScale
  )

  // Sync with localStorage on mount
  useEffect(() => {
    if (!initialScale) {
      setScaleState(getInitialScale())
    }
  }, [initialScale])

  const setScale = (newScale: YAxisScale) => {
    setScaleState(newScale)
    saveScale(newScale)
  }

  const toggleScale = () => {
    const newScale = scale === 'linear' ? 'log' : 'linear'
    setScale(newScale)
  }

  const value: ChartScaleContextValue = {
    scale,
    isLogScale: scale === 'auto' || scale === 'log',
    toggleScale,
    setScale,
  }

  return (
    <ChartScaleContext.Provider value={value}>
      {children}
    </ChartScaleContext.Provider>
  )
}

/**
 * Hook to access chart scale context
 * Returns null if not within a ChartScaleProvider
 */
export function useChartScale(): ChartScaleContextValue | null {
  return useContext(ChartScaleContext)
}

/**
 * Hook to get the current scale value
 * Falls back to 'auto' if not in a provider
 */
export function useChartScaleValue(): YAxisScale {
  const context = useContext(ChartScaleContext)
  return context?.scale ?? 'auto'
}
