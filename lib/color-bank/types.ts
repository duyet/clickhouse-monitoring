/**
 * Color bank type definitions.
 *
 * Provides TypeScript types for HSL color representation,
 * color bank colors, and utility functions.
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
 * Valid shade numbers in Tailwind color scale.
 * Each color has 11 shades: 200, 250, 300, ..., 700.
 */
export type ShadeNumber =
  | 200
  | 250
  | 300
  | 350
  | 400
  | 450
  | 500
  | 550
  | 600
  | 650
  | 700

/**
 * Color map structure mapping color names to their shades.
 */
export type ColorMap = Record<string, Record<ShadeNumber, HSLColor>>

/**
 * Valid color names in the color bank.
 */
export type ColorBankColor =
  | 'mint'
  | 'blue'
  | 'seafoam'
  | 'periwinkle'
  | 'coral'
  | 'lavender'
  | 'peach'
  | 'lemon'
  | 'lilac'
  | 'rose'
  | 'turquoise'
  | 'sky'
