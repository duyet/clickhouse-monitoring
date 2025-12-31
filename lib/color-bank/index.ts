/**
 * Color bank utilities for automatic color assignment based on column names.
 *
 * Provides deterministic color assignment using string hashing,
 * with shade calculation based on percentage values.
 *
 * Uses inline CSS with HSL color values to avoid Tailwind purging issues.
 */

export type { ColorBankColor, ColorMap, HSLColor, ShadeNumber } from './types'
export { COLOR_BANK, COLOR_MAP } from './data/color-map'
import type { ColorBankColor, ShadeNumber } from './types'
import { COLOR_BANK, COLOR_MAP } from './data/color-map'

/**
 * Simple string hash for deterministic color assignment.
 * Uses DJB2 algorithm variant for consistent results.
 *
 * @param str - The string to hash
 * @returns A positive hash value
 *
 * @example
 * ```ts
 * getStringHash('readable_compressed') // => 1234567890
 * getStringHash('readable_compressed') // => 1234567890 (deterministic)
 * ```
 */
export function getStringHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Get color from bank based on column name.
 * Returns a deterministic color for the same column name.
 *
 * @param columnName - The column name to get a color for
 * @returns A color name from the color bank
 *
 * @example
 * ```ts
 * getColorFromBank('readable_compressed') // => 'mint'
 * getColorFromBank('readable_compressed') // => 'mint' (same result)
 * getColorFromBank('readable_rows')       // => 'blue'
 * ```
 */
export function getColorFromBank(columnName: string): ColorBankColor {
  const hash = getStringHash(columnName)
  const index = hash % COLOR_BANK.length
  return COLOR_BANK[index]
}

/**
 * Calculate shade based on percentage.
 * Larger percentages result in darker/more saturated shades.
 *
 * Maps 0-100% to shade 200-700 (lighter to darker).
 * Result is rounded to nearest 50 (Tailwind shades: 50, 100, 200, ..., 900).
 *
 * @param percentage - The percentage value (0-100)
 * @returns A Tailwind shade number (200, 250, 300, ..., 700)
 *
 * @example
 * ```ts
 * getShade(0)    // => 200 (lightest)
 * getShade(50)   // => 450
 * getShade(100)  // => 700 (darkest)
 * ```
 */
export function getShade(percentage: number): ShadeNumber {
  const minShade = 200
  const maxShade = 700
  const shade = minShade + (percentage / 100) * (maxShade - minShade)
  // Round to nearest 50 (Tailwind shades are 50, 100, 200, ..., 900)
  return Math.round(shade / 50) * 50 as ShadeNumber
}

/**
 * Get inline styles for the background bar.
 * Returns React CSS properties with HSL color values.
 *
 * @param baseColor - The base color name (e.g., 'mint', 'blue', 'coral')
 * @param shade - The shade number (200, 250, ..., 700)
 * @param opacity - Optional opacity value (default: 0.6 for pastel)
 * @returns A React style object with backgroundColor
 *
 * @example
 * ```ts
 * getBarStyle('mint', 500) // => { backgroundColor: 'hsl(156 65% 60% / 0.6)' }
 * getBarStyle('coral', 300, 0.8) // => { backgroundColor: 'hsl(10 75% 78% / 0.8)' }
 * ```
 */
export function getBarStyle(
  baseColor: string,
  shade: number,
  opacity: number = 0.6
): React.CSSProperties {
  // Round shade to nearest valid shade value
  const roundedShade = Math.round(shade / 50) * 50
  const color = COLOR_MAP[baseColor]?.[roundedShade as ShadeNumber]

  if (!color) {
    // Fallback to soft gray if color not found
    return { backgroundColor: `hsl(220 20% 80% / ${opacity})` }
  }

  return {
    backgroundColor: `hsl(${color.h} ${color.s}% ${color.l}% / ${opacity})`,
  }
}
