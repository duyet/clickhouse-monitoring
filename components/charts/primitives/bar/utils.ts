/**
 * Bar chart utility functions
 */

import type { ChartConfig } from '@/components/ui/chart'

/**
 * Generates chart configuration for bar categories
 * Maps each category to a color from the provided palette
 */
export function generateChartConfig(
  categories: string[],
  colors?: string[],
  colorLabel?: string
): ChartConfig {
  return categories.reduce(
    (acc, category, index) => {
      acc[category] = {
        label: category,
        color: colors ? `var(${colors[index]})` : `var(--chart-${index + 1})`,
      }

      return acc
    },
    {
      label: {
        color: colorLabel ? `var(${colorLabel})` : 'var(--background)',
      },
    } as ChartConfig
  )
}

/**
 * Radius calculation options for bar corners
 */
export interface BarRadiusOptions {
  index: number
  categories: string[]
  stack: boolean
  horizontal: boolean
  radius?: number
}

/**
 * Calculates bar corner radius based on position and layout
 *
 * For stacked bars:
 * - First bar gets top-left and top-left radius
 * - Last bar gets bottom-right and bottom-right radius
 * - Middle bars have no radius
 *
 * For non-stacked bars, all corners get the same radius
 */
export function getBarRadius({
  index,
  categories,
  stack,
  horizontal,
  radius = 6,
}: BarRadiusOptions): number | [number, number, number, number] {
  const length = categories.length

  if (!stack) {
    return radius
  }

  if (length === 1) {
    return radius
  }

  // First bar in stack
  if (index === 0) {
    if (horizontal) {
      return [radius, 0, 0, radius] // top-left, top-right, bottom-right, bottom-left
    } else {
      return [0, 0, radius, radius] // top-left, top-right, bottom-right, bottom-left
    }
  }

  // Last bar in stack
  if (index === length - 1) {
    if (horizontal) {
      return [0, radius, radius, 0] // top-left, top-right, bottom-right, bottom-left
    } else {
      return [radius, radius, 0, 0] // top-left, top-right, bottom-right, bottom-left
    }
  }

  // Middle bars in stack
  return [0, 0, 0, 0]
}
