import { rowsToCsv } from '../agent-export'
import { describe, expect, it } from 'bun:test'

describe('rowsToCsv', () => {
  it('returns an empty string for empty input', () => {
    expect(rowsToCsv([])).toBe('')
  })

  it('emits header row followed by data rows in column order', () => {
    const rows = [
      { name: 'alice', age: 30 },
      { name: 'bob', age: 25 },
    ]

    expect(rowsToCsv(rows)).toBe('name,age\nalice,30\nbob,25')
  })

  it('renders null and undefined as empty strings', () => {
    const rows = [{ a: null, b: undefined, c: 1 }]

    expect(rowsToCsv(rows)).toBe('a,b,c\n,,1')
  })

  it('quotes values containing commas', () => {
    const rows = [{ s: 'a,b' }]

    expect(rowsToCsv(rows)).toBe('s\n"a,b"')
  })

  it('quotes values containing newlines and carriage returns', () => {
    const rows = [{ s: 'a\nb' }, { s: 'c\rd' }]

    expect(rowsToCsv(rows)).toBe('s\n"a\nb"\n"c\rd"')
  })

  it('doubles internal quotes and wraps in quotes per RFC 4180', () => {
    const rows = [{ s: 'say "hi"' }]

    expect(rowsToCsv(rows)).toBe('s\n"say ""hi"""')
  })

  it('uses first-row keys as the header for every row', () => {
    // Extra keys on subsequent rows are dropped — the header is fixed.
    const rows = [
      { a: 1, b: 2 },
      { a: 3, b: 4, c: 999 },
    ]

    expect(rowsToCsv(rows)).toBe('a,b\n1,2\n3,4')
  })
})
