/**
 * Chart color constants and utilities
 * Provides standardized color palettes for dashboard charts
 */

/**
 * Default CSS variable names for chart colors
 * These map to CSS custom properties defined in the application
 */
export const DEFAULT_CHART_COLORS = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--chart-6',
  '--chart-7',
  '--chart-8',
  '--chart-9',
  '--chart-10',
] as const

/**
 * Extended color palette with hex values for fallback
 * Used when CSS variables are not available
 */
export const CHART_COLOR_PALETTE = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
] as const

/**
 * Chart color type - either CSS variable name or direct color value
 */
export type ChartColor = typeof DEFAULT_CHART_COLORS[number] | string

/**
 * Gets the CSS variable value for a chart color index
 * @param index - Zero-based index for the color
 * @returns CSS variable name for the color
 */
export function getChartColorVariable(index: number): string {
  const safeIndex = Math.max(0, Math.min(index, DEFAULT_CHART_COLORS.length - 1))
  return DEFAULT_CHART_COLORS[safeIndex]
}

/**
 * Gets the hex fallback color for a chart color index
 * @param index - Zero-based index for the color
 * @returns Hex color value
 */
export function getChartColorHex(index: number): string {
  const safeIndex = Math.max(0, Math.min(index, CHART_COLOR_PALETTE.length - 1))
  return CHART_COLOR_PALETTE[safeIndex]
}
