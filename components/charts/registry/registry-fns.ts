/**
 * Registry Functions
 *
 * Core functions for interacting with the chart registry.
 */

import type { LazyChartComponent } from './types'
import { chartImports } from './chart-imports'

/**
 * Get a chart component by name
 * Returns undefined if chart is not registered
 */
export function getChartComponent(
  chartName: string
): LazyChartComponent | undefined {
  return chartImports[chartName]
}

/**
 * Check if a chart is registered
 */
export function hasChart(chartName: string): boolean {
  return chartName in chartImports
}

/**
 * Get all registered chart names
 */
export function getRegisteredChartNames(): string[] {
  return Object.keys(chartImports)
}

/**
 * Get charts by category
 */
export function getChartsByCategory(category: string): string[] {
  return getRegisteredChartNames().filter((name) =>
    name.startsWith(category.toLowerCase())
  )
}
