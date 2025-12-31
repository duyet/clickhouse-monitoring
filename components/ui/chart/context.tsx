/**
 * Chart Context
 *
 * Provides chart configuration to all child components.
 */

'use client'

import * as React from 'react'
import type { ChartConfig, ChartContextProps } from './types'

export const ChartContext = React.createContext<ChartContextProps | null>(null)

/**
 * Hook to access chart context
 * @throws Error if used outside ChartContainer
 */
export function useChartContext(): ChartContextProps {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }

  return context
}

/** @deprecated Use useChartContext instead */
export function useChart(): ChartContextProps {
  return useChartContext()
}
