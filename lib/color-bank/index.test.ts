/**
 * Tests for color-bank utilities
 *
 * @see lib/color-bank/index.ts
 */

import { describe, expect, it } from 'bun:test'
import {
  COLOR_BANK,
  COLOR_MAP,
  getColorFromBank,
  getBarStyle,
  getShade,
  getStringHash,
} from '.'

describe('getStringHash', () => {
  it('should return consistent hash for the same string', () => {
    const input = 'readable_compressed'
    const hash1 = getStringHash(input)
    const hash2 = getStringHash(input)
    expect(hash1).toBe(hash2)
    expect(hash1).toBeGreaterThan(0)
  })

  it('should return different hashes for different strings', () => {
    const hash1 = getStringHash('readable_compressed')
    const hash2 = getStringHash('readable_rows')
    expect(hash1).not.toBe(hash2)
  })

  it('should handle empty string', () => {
    expect(getStringHash('')).toBe(0)
  })

  it('should handle special characters', () => {
    const hash = getStringHash('test_column-name')
    expect(hash).toBeGreaterThan(0)
  })
})

describe('getColorFromBank', () => {
  it('should return a color from the color bank', () => {
    const color = getColorFromBank('readable_compressed')
    expect(COLOR_BANK).toContain(color)
  })

  it('should return consistent color for the same column name', () => {
    const color1 = getColorFromBank('readable_compressed')
    const color2 = getColorFromBank('readable_compressed')
    expect(color1).toBe(color2)
  })

  it('should distribute colors across different column names', () => {
    const colors = new Set([
      getColorFromBank('readable_compressed'),
      getColorFromBank('readable_rows'),
      getColorFromBank('readable_parts'),
      getColorFromBank('readable_size'),
    ])
    // Should have at least 2 different colors
    expect(colors.size).toBeGreaterThan(1)
  })

  it('should handle empty string', () => {
    const color = getColorFromBank('')
    expect(COLOR_BANK).toContain(color)
  })
})

describe('getShade', () => {
  it('should return 200 for 0%', () => {
    expect(getShade(0)).toBe(200)
  })

  it('should return 700 for 100%', () => {
    expect(getShade(100)).toBe(700)
  })

  it('should return 450 for 50%', () => {
    expect(getShade(50)).toBe(450)
  })

  it('should round to nearest 50', () => {
    // 200 + 0.01 * 500 = 205, /50 = 4.1, round = 4, *50 = 200
    expect(getShade(1)).toBe(200)
    // 200 + 0.33 * 500 = 365, /50 = 7.3, round = 7, *50 = 350
    expect(getShade(33)).toBe(350)
  })

  it('should handle decimal percentages', () => {
    // 200 + 0.255 * 500 = 327.5, /50 = 6.55, round = 7, *50 = 350
    expect(getShade(25.5)).toBe(350)
  })

  it('should handle edge cases (no clamping in current impl)', () => {
    // Currently doesn't clamp - negative values go below 200
    expect(getShade(-10)).toBe(150)
    // Values above 100 go above 700
    expect(getShade(150)).toBe(950)
  })
})

describe('getBarStyle', () => {
  it('should return valid CSS properties', () => {
    const style = getBarStyle('mint', 500)
    expect(style).toHaveProperty('backgroundColor')
    expect(style.backgroundColor).toMatch(/^hsl\(/)
  })

  it('should include opacity in output', () => {
    const style = getBarStyle('mint', 500, 0.8)
    expect(style.backgroundColor).toContain('/ 0.8)')
  })

  it('should use default opacity of 0.6 for pastel colors', () => {
    const style = getBarStyle('mint', 500)
    expect(style.backgroundColor).toContain('/ 0.6)')
  })

  it('should handle all color bank colors', () => {
    for (const baseColor of COLOR_BANK) {
      const style = getBarStyle(baseColor, 500)
      expect(style).toHaveProperty('backgroundColor')
      expect(style.backgroundColor).toMatch(/^hsl\(/)
    }
  })

  it('should fallback to soft gray for unknown color', () => {
    const style = getBarStyle('unknown', 500)
    expect(style.backgroundColor).toBe('hsl(220 20% 80% / 0.6)')
  })
})

describe('COLOR_MAP', () => {
  it('should contain all color bank colors', () => {
    for (const color of COLOR_BANK) {
      expect(COLOR_MAP).toHaveProperty(color)
    }
  })

  it('should have valid HSL values for each shade', () => {
    const color = COLOR_MAP['mint']
    expect(color).toBeDefined()

    for (const shade of [200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700]) {
      const shadeKey = shade as keyof typeof color
      const hsl = color[shadeKey]
      expect(hsl).toBeDefined()
      expect(hsl?.h).toBeGreaterThanOrEqual(0)
      expect(hsl?.h).toBeLessThanOrEqual(360)
      expect(hsl?.s).toBeGreaterThanOrEqual(0)
      expect(hsl?.s).toBeLessThanOrEqual(100)
      expect(hsl?.l).toBeGreaterThanOrEqual(0)
      expect(hsl?.l).toBeLessThanOrEqual(100)
    }
  })

  it('should use pastel colors (high lightness, moderate saturation)', () => {
    const mintColor = COLOR_MAP['mint'][500]
    expect(mintColor.l).toBeGreaterThanOrEqual(70) // At least 70% lightness (ultra-pastel)
    expect(mintColor.l).toBeLessThanOrEqual(98) // At most 98% lightness
    expect(mintColor.s).toBeGreaterThanOrEqual(30) // At least 30% saturation (soft)
    expect(mintColor.s).toBeLessThanOrEqual(65) // At most 65% saturation (very soft)
  })
})

describe('integration', () => {
  it('should produce valid styles for typical usage', () => {
    const columnName = 'readable_compressed'
    const percentage = 75

    const baseColor = getColorFromBank(columnName)
    const shade = getShade(percentage)
    const style = getBarStyle(baseColor, shade)

    // Should return valid CSS properties
    expect(style).toHaveProperty('backgroundColor')
    expect(style.backgroundColor).toMatch(/^hsl\(/)
  })

  it('should produce deterministic results', () => {
    const columnName = 'readable_rows'
    const percentage = 50

    const baseColor = getColorFromBank(columnName)
    const shade = getShade(percentage)
    const style1 = getBarStyle(baseColor, shade)
    const style2 = getBarStyle(baseColor, shade)

    expect(style1).toEqual(style2)
  })

  it('should map common percentages to expected shades', () => {
    // Low percentage = light shade
    const lowShade = getShade(10)
    expect(lowShade).toBeGreaterThanOrEqual(200)
    expect(lowShade).toBeLessThan(300)

    // Medium percentage = medium shade
    const midShade = getShade(50)
    expect(midShade).toBeGreaterThanOrEqual(400)
    expect(midShade).toBeLessThan(500)

    // High percentage = dark shade
    const highShade = getShade(90)
    expect(highShade).toBeGreaterThanOrEqual(600)
    expect(highShade).toBeLessThanOrEqual(700)
  })
})
