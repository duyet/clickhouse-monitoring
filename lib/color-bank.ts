/**
 * Color bank utilities for automatic color assignment based on column names.
 *
 * Provides deterministic color assignment using string hashing,
 * with shade calculation based on percentage values.
 *
 * Uses inline CSS with HSL color values to avoid Tailwind purging issues.
 */

/**
 * HSL color representation.
 * Each color has shades from 200 (lightest) to 700 (darkest).
 */
export interface HSLColor {
  h: number // hue (0-360)
  s: number // saturation percentage (0-100)
  l: number // lightness percentage (0-100)
}

/**
 * Color bank with HSL values for all shades.
 * Each color has shades 200, 250, 300, ..., 700 (11 shades total).
 *
 * Ultra-pastel/cute color palette with very high lightness and very soft saturation:
 * - 200: lightest (~90-95% lightness, extremely pastel)
 * - 700: darkest (~70-80% lightness, still very soft)
 */
export const COLOR_MAP: Readonly<
  Record<string, Readonly<Record<number, HSLColor>>>
> = {
  // Mint green - fresh and airy
  mint: {
    200: { h: 156, s: 35, l: 94 },
    250: { h: 156, s: 36, l: 91 },
    300: { h: 156, s: 38, l: 88 },
    350: { h: 156, s: 40, l: 85 },
    400: { h: 156, s: 42, l: 82 },
    450: { h: 156, s: 44, l: 79 },
    500: { h: 156, s: 45, l: 76 },
    550: { h: 156, s: 45, l: 75 },
    600: { h: 156, s: 46, l: 74 },
    650: { h: 156, s: 46, l: 73 },
    700: { h: 156, s: 48, l: 72 },
  },
  // Baby blue - dreamy sky blue
  blue: {
    200: { h: 205, s: 40, l: 93 },
    250: { h: 205, s: 42, l: 90 },
    300: { h: 205, s: 44, l: 87 },
    350: { h: 205, s: 46, l: 84 },
    400: { h: 205, s: 48, l: 81 },
    450: { h: 205, s: 50, l: 78 },
    500: { h: 205, s: 52, l: 75 },
    550: { h: 205, s: 52, l: 74 },
    600: { h: 205, s: 54, l: 73 },
    650: { h: 205, s: 54, l: 72 },
    700: { h: 205, s: 56, l: 71 },
  },
  // Seafoam - gentle aqua green
  seafoam: {
    200: { h: 168, s: 38, l: 93 },
    250: { h: 168, s: 40, l: 90 },
    300: { h: 168, s: 42, l: 87 },
    350: { h: 168, s: 44, l: 84 },
    400: { h: 168, s: 46, l: 81 },
    450: { h: 168, s: 48, l: 78 },
    500: { h: 168, s: 50, l: 75 },
    550: { h: 168, s: 50, l: 74 },
    600: { h: 168, s: 52, l: 73 },
    650: { h: 168, s: 52, l: 72 },
    700: { h: 168, s: 54, l: 71 },
  },
  // Periwinkle - soft blue-purple dream
  periwinkle: {
    200: { h: 235, s: 38, l: 93 },
    250: { h: 235, s: 40, l: 90 },
    300: { h: 235, s: 42, l: 87 },
    350: { h: 235, s: 44, l: 84 },
    400: { h: 235, s: 46, l: 81 },
    450: { h: 235, s: 48, l: 78 },
    500: { h: 235, s: 50, l: 75 },
    550: { h: 235, s: 50, l: 74 },
    600: { h: 235, s: 52, l: 73 },
    650: { h: 235, s: 52, l: 72 },
    700: { h: 235, s: 54, l: 71 },
  },
  // Coral - soft pink-orange cotton candy
  coral: {
    200: { h: 10, s: 45, l: 93 },
    250: { h: 10, s: 48, l: 90 },
    300: { h: 10, s: 50, l: 87 },
    350: { h: 10, s: 52, l: 84 },
    400: { h: 10, s: 54, l: 81 },
    450: { h: 10, s: 56, l: 78 },
    500: { h: 10, s: 58, l: 75 },
    550: { h: 10, s: 58, l: 74 },
    600: { h: 10, s: 60, l: 73 },
    650: { h: 10, s: 60, l: 72 },
    700: { h: 10, s: 62, l: 71 },
  },
  // Lavender - soft purple field
  lavender: {
    200: { h: 260, s: 35, l: 93 },
    250: { h: 260, s: 36, l: 90 },
    300: { h: 260, s: 38, l: 87 },
    350: { h: 260, s: 40, l: 84 },
    400: { h: 260, s: 42, l: 81 },
    450: { h: 260, s: 44, l: 78 },
    500: { h: 260, s: 46, l: 75 },
    550: { h: 260, s: 46, l: 74 },
    600: { h: 260, s: 48, l: 73 },
    650: { h: 260, s: 48, l: 72 },
    700: { h: 260, s: 50, l: 71 },
  },
  // Peach - soft sunset glow
  peach: {
    200: { h: 25, s: 42, l: 93 },
    250: { h: 25, s: 44, l: 90 },
    300: { h: 25, s: 46, l: 87 },
    350: { h: 25, s: 48, l: 84 },
    400: { h: 25, s: 50, l: 81 },
    450: { h: 25, s: 52, l: 78 },
    500: { h: 25, s: 54, l: 75 },
    550: { h: 25, s: 54, l: 74 },
    600: { h: 25, s: 56, l: 73 },
    650: { h: 25, s: 56, l: 72 },
    700: { h: 25, s: 58, l: 71 },
  },
  // Lemon - soft sunshine
  lemon: {
    200: { h: 50, s: 45, l: 95 },
    250: { h: 50, s: 48, l: 92 },
    300: { h: 50, s: 50, l: 89 },
    350: { h: 50, s: 52, l: 86 },
    400: { h: 50, s: 54, l: 83 },
    450: { h: 50, s: 56, l: 80 },
    500: { h: 50, s: 58, l: 77 },
    550: { h: 50, s: 58, l: 76 },
    600: { h: 50, s: 60, l: 75 },
    650: { h: 50, s: 60, l: 74 },
    700: { h: 50, s: 62, l: 73 },
  },
  // Lilac - soft purple blossom
  lilac: {
    200: { h: 275, s: 32, l: 93 },
    250: { h: 275, s: 34, l: 90 },
    300: { h: 275, s: 36, l: 87 },
    350: { h: 275, s: 38, l: 84 },
    400: { h: 275, s: 40, l: 81 },
    450: { h: 275, s: 42, l: 78 },
    500: { h: 275, s: 44, l: 75 },
    550: { h: 275, s: 44, l: 74 },
    600: { h: 275, s: 46, l: 73 },
    650: { h: 275, s: 46, l: 72 },
    700: { h: 275, s: 48, l: 71 },
  },
  // Rose - soft petal pink
  rose: {
    200: { h: 345, s: 40, l: 93 },
    250: { h: 345, s: 42, l: 90 },
    300: { h: 345, s: 44, l: 87 },
    350: { h: 345, s: 46, l: 84 },
    400: { h: 345, s: 48, l: 81 },
    450: { h: 345, s: 50, l: 78 },
    500: { h: 345, s: 52, l: 75 },
    550: { h: 345, s: 52, l: 74 },
    600: { h: 345, s: 54, l: 73 },
    650: { h: 345, s: 54, l: 72 },
    700: { h: 345, s: 56, l: 71 },
  },
  // Turquoise - tropical waters
  turquoise: {
    200: { h: 180, s: 35, l: 93 },
    250: { h: 180, s: 36, l: 90 },
    300: { h: 180, s: 38, l: 87 },
    350: { h: 180, s: 40, l: 84 },
    400: { h: 180, s: 42, l: 81 },
    450: { h: 180, s: 44, l: 78 },
    500: { h: 180, s: 46, l: 75 },
    550: { h: 180, s: 46, l: 74 },
    600: { h: 180, s: 48, l: 73 },
    650: { h: 180, s: 48, l: 72 },
    700: { h: 180, s: 50, l: 71 },
  },
  // Sky - cotton candy clouds
  sky: {
    200: { h: 195, s: 38, l: 94 },
    250: { h: 195, s: 40, l: 91 },
    300: { h: 195, s: 42, l: 88 },
    350: { h: 195, s: 44, l: 85 },
    400: { h: 195, s: 46, l: 82 },
    450: { h: 195, s: 48, l: 79 },
    500: { h: 195, s: 50, l: 76 },
    550: { h: 195, s: 50, l: 75 },
    600: { h: 195, s: 52, l: 74 },
    650: { h: 195, s: 52, l: 73 },
    700: { h: 195, s: 54, l: 72 },
  },
} as const

/**
 * Color bank - base color names available for assignment.
 * Colors are automatically assigned to columns based on name hash.
 */
export const COLOR_BANK: ReadonlyArray<string> = [
  'mint',
  'blue',
  'seafoam',
  'periwinkle',
  'coral',
  'lavender',
  'peach',
  'lemon',
  'lilac',
  'rose',
  'turquoise',
  'sky',
] as const

export type ColorBankColor = (typeof COLOR_BANK)[number]

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
export function getShade(percentage: number): number {
  const minShade = 200
  const maxShade = 700
  const shade = minShade + (percentage / 100) * (maxShade - minShade)
  // Round to nearest 50 (Tailwind shades are 50, 100, 200, ..., 900)
  return Math.round(shade / 50) * 50
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
  const color = COLOR_MAP[baseColor]?.[roundedShade]

  if (!color) {
    // Fallback to soft gray if color not found
    return { backgroundColor: `hsl(220 20% 80% / ${opacity})` }
  }

  return {
    backgroundColor: `hsl(${color.h} ${color.s}% ${color.l}% / ${opacity})`,
  }
}
