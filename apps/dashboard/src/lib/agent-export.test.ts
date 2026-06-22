import { exportToCsv, rowsToCsv } from './agent-export'
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

// ---------------------------------------------------------------------------
// rowsToCsv
// ---------------------------------------------------------------------------

describe('rowsToCsv', () => {
  test('returns empty string for empty array', () => {
    expect(rowsToCsv([])).toBe('')
  })

  test('single row with simple values', () => {
    const result = rowsToCsv([{ a: 1, b: 'hello' }])
    expect(result).toBe('a,b\n1,hello')
  })

  test('multiple rows', () => {
    const rows = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]
    expect(rowsToCsv(rows)).toBe('name,age\nAlice,30\nBob,25')
  })

  test('wraps values containing commas in quotes', () => {
    const result = rowsToCsv([{ val: 'a,b' }])
    expect(result).toBe('val\n"a,b"')
  })

  test('wraps values containing double-quotes and escapes them', () => {
    const result = rowsToCsv([{ val: 'say "hi"' }])
    expect(result).toBe('val\n"say ""hi"""')
  })

  test('wraps values containing newlines in quotes', () => {
    const result = rowsToCsv([{ val: 'line1\nline2' }])
    expect(result).toBe('val\n"line1\nline2"')
  })

  test('wraps values containing carriage returns in quotes', () => {
    const result = rowsToCsv([{ val: 'line1\rline2' }])
    expect(result).toBe('val\n"line1\rline2"')
  })

  test('handles null values as empty string', () => {
    const result = rowsToCsv([{ a: null as unknown as string }])
    expect(result).toBe('a\n')
  })

  test('handles undefined values as empty string', () => {
    const result = rowsToCsv([{ a: undefined as unknown as string }])
    expect(result).toBe('a\n')
  })

  test('handles numeric zero and false', () => {
    const result = rowsToCsv([{ zero: 0, flag: false }])
    expect(result).toBe('zero,flag\n0,false')
  })

  test('header columns come from first row keys', () => {
    const rows = [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ]
    const lines = rowsToCsv(rows).split('\n')
    expect(lines[0]).toBe('x,y')
  })

  test('wraps header names containing commas in quotes', () => {
    const rows = [{ 'first,name': 'Alice' }]
    const headerLine = rowsToCsv(rows).split('\n')[0]
    expect(headerLine).toBe('"first,name"')
  })

  test('escapes double-quotes in header names', () => {
    const rows = [{ 'col"a': 'v' }]
    const headerLine = rowsToCsv(rows).split('\n')[0]
    expect(headerLine).toBe('"col""a"')
  })

  test('single row, single column', () => {
    expect(rowsToCsv([{ id: 42 }])).toBe('id\n42')
  })

  test('handles multiple special-character values in one row', () => {
    const result = rowsToCsv([{ a: 'x,y', b: 'say "ok"', c: 'plain' }])
    expect(result).toBe('a,b,c\n"x,y","say ""ok""",plain')
  })

  test('value with both comma and quote is correctly escaped', () => {
    const result = rowsToCsv([{ val: '"a,b"' }])
    // contains both " and , → wrapped with internal quotes doubled
    expect(result).toBe('val\n"""a,b"""')
  })

  test('preserves row order', () => {
    const rows = [{ n: 'c' }, { n: 'a' }, { n: 'b' }]
    const lines = rowsToCsv(rows).split('\n')
    expect(lines[1]).toBe('c')
    expect(lines[2]).toBe('a')
    expect(lines[3]).toBe('b')
  })

  test('row with all-empty string values', () => {
    const result = rowsToCsv([{ a: '', b: '' }])
    expect(result).toBe('a,b\n,')
  })
})

// ---------------------------------------------------------------------------
// exportToCsv — DOM-dependent; stub browser APIs
// ---------------------------------------------------------------------------

describe('exportToCsv', () => {
  // Track what the fake link received
  let linkHref = ''
  let linkDownload = ''
  let linkClicked = false
  let appendedLink: HTMLAnchorElement | null = null
  let revokedUrl: string | null = null

  // A fake anchor element
  const fakeLink = {
    set href(v: string) {
      linkHref = v
    },
    get href() {
      return linkHref
    },
    set download(v: string) {
      linkDownload = v
    },
    get download() {
      return linkDownload
    },
    style: { display: '' },
    click() {
      linkClicked = true
    },
  }

  beforeEach(() => {
    linkHref = ''
    linkDownload = ''
    linkClicked = false
    appendedLink = null
    revokedUrl = null

    // Stub global browser APIs used by exportToCsv
    globalThis.Blob = class MockBlob {
      parts: unknown[]
      options: BlobPropertyBag | undefined
      constructor(parts: unknown[], options?: BlobPropertyBag) {
        this.parts = parts
        this.options = options
      }
    } as unknown as typeof Blob

    globalThis.URL = {
      createObjectURL: (_blob: Blob) => 'blob:fake-url',
      revokeObjectURL: (url: string) => {
        revokedUrl = url
      },
    } as unknown as typeof URL

    globalThis.document = {
      createElement: (_tag: string) => fakeLink as unknown as HTMLAnchorElement,
      body: {
        appendChild: (el: HTMLAnchorElement) => {
          appendedLink = el
        },
        removeChild: (_el: HTMLAnchorElement) => {},
      },
    } as unknown as Document

    // Suppress real setTimeout in bun test environment is fine; stub it
    globalThis.setTimeout = ((
      _fn: () => void,
      _ms: number
    ) => {}) as unknown as typeof setTimeout
  })

  afterEach(() => {
    // Clean up globals so they don't leak into other suites
    delete (globalThis as Record<string, unknown>).Blob
    delete (globalThis as Record<string, unknown>).URL
    delete (globalThis as Record<string, unknown>).document
  })

  test('does nothing when rows is empty', () => {
    exportToCsv([])
    expect(linkClicked).toBe(false)
    expect(appendedLink).toBeNull()
  })

  test('triggers a link click when rows are provided', () => {
    exportToCsv([{ a: 1 }])
    expect(linkClicked).toBe(true)
  })

  test('appends link to document body', () => {
    exportToCsv([{ a: 1 }])
    expect(appendedLink).not.toBeNull()
  })

  test('uses provided filename', () => {
    exportToCsv([{ a: 1 }], 'my-export.csv')
    expect(linkDownload).toBe('my-export.csv')
  })

  test('uses default filename with timestamp when none provided', () => {
    exportToCsv([{ a: 1 }])
    expect(linkDownload).toMatch(/^export-\d+\.csv$/)
  })

  test('sets link href to the object URL', () => {
    exportToCsv([{ a: 1 }])
    expect(linkHref).toBe('blob:fake-url')
  })

  test('sets link display to none', () => {
    exportToCsv([{ a: 1 }])
    expect(fakeLink.style.display).toBe('none')
  })
})
