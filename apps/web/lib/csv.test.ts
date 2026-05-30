import { arrayToCsv, slugifyFilename, valueToCsv } from './csv'
import { describe, expect, it } from 'bun:test'

describe('csv', () => {
  describe('valueToCsv', () => {
    it('renders null and undefined as empty strings', () => {
      expect(valueToCsv(null)).toBe('')
      expect(valueToCsv(undefined)).toBe('')
    })

    it('passes through simple values', () => {
      expect(valueToCsv('hello')).toBe('hello')
      expect(valueToCsv(42)).toBe('42')
      expect(valueToCsv(true)).toBe('true')
    })

    it('quotes and escapes values with commas, quotes, or newlines', () => {
      expect(valueToCsv('a,b')).toBe('"a,b"')
      expect(valueToCsv('say "hi"')).toBe('"say ""hi"""')
      expect(valueToCsv('line1\nline2')).toBe('"line1\nline2"')
    })

    it('serializes objects to JSON', () => {
      expect(valueToCsv({ a: 1 })).toBe('"{""a"":1}"')
    })
  })

  describe('arrayToCsv', () => {
    it('returns null for empty input', () => {
      expect(arrayToCsv([])).toBeNull()
    })

    it('builds a header row from union of keys (first-seen order)', () => {
      const csv = arrayToCsv([
        { a: 1, b: 2 },
        { a: 3, c: 4 },
      ])
      expect(csv).toBe('a,b,c\n1,2,\n3,,4')
    })

    it('escapes cell values', () => {
      const csv = arrayToCsv([{ name: 'a,b', note: 'ok' }])
      expect(csv).toBe('name,note\n"a,b",ok')
    })
  })

  describe('slugifyFilename', () => {
    it('slugifies a human-readable label', () => {
      expect(slugifyFilename('Top Tables By Size')).toBe('top-tables-by-size')
    })

    it('falls back when label is empty or unusable', () => {
      expect(slugifyFilename(undefined)).toBe('chart-export')
      expect(slugifyFilename('   ')).toBe('chart-export')
      expect(slugifyFilename('!!!', 'fallback')).toBe('fallback')
    })
  })
})
