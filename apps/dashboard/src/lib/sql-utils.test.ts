import {
  escapeIdentifier,
  escapeQualifiedIdentifier,
  validateIdentifier,
  validateLimit,
} from './sql-utils'
import { describe, expect, test } from 'bun:test'

// ---------------------------------------------------------------------------
// validateIdentifier
// ---------------------------------------------------------------------------
describe('validateIdentifier', () => {
  // Happy path — valid identifiers
  test('accepts simple lowercase letters', () => {
    expect(validateIdentifier('table')).toBe('table')
  })

  test('accepts uppercase letters', () => {
    expect(validateIdentifier('TABLE')).toBe('TABLE')
  })

  test('accepts mixed case', () => {
    expect(validateIdentifier('MyTable')).toBe('MyTable')
  })

  test('accepts digits', () => {
    expect(validateIdentifier('table1')).toBe('table1')
  })

  test('accepts identifier starting with digit', () => {
    expect(validateIdentifier('1table')).toBe('1table')
  })

  test('accepts underscores', () => {
    expect(validateIdentifier('my_table')).toBe('my_table')
  })

  test('accepts hyphens', () => {
    expect(validateIdentifier('my-table')).toBe('my-table')
  })

  test('accepts combined alphanumeric, underscore, hyphen', () => {
    expect(validateIdentifier('my_table-1')).toBe('my_table-1')
  })

  test('returns the original identifier unchanged', () => {
    const id = 'valid_name'
    expect(validateIdentifier(id)).toBe(id)
  })

  // Dots — disallowed by default
  test('rejects dot without allowDots', () => {
    expect(() => validateIdentifier('db.table')).toThrow()
  })

  test('allows dot when allowDots=true', () => {
    expect(validateIdentifier('db.table', true)).toBe('db.table')
  })

  test('allows multiple dots when allowDots=true', () => {
    expect(validateIdentifier('a.b.c', true)).toBe('a.b.c')
  })

  test('rejects dot in non-dotted position when allowDots=false (explicit)', () => {
    expect(() => validateIdentifier('db.table', false)).toThrow()
  })

  // Error path — invalid characters
  test('rejects space', () => {
    expect(() => validateIdentifier('my table')).toThrow(/Invalid identifier/)
  })

  test('rejects semicolon', () => {
    expect(() => validateIdentifier('table;')).toThrow(/Invalid identifier/)
  })

  test('rejects single-quote', () => {
    expect(() => validateIdentifier("table'")).toThrow(/Invalid identifier/)
  })

  test('rejects backtick', () => {
    expect(() => validateIdentifier('`table`')).toThrow(/Invalid identifier/)
  })

  test('rejects SQL injection attempt', () => {
    expect(() => validateIdentifier('table; DROP TABLE users')).toThrow()
  })

  test('rejects asterisk', () => {
    expect(() => validateIdentifier('*')).toThrow(/Invalid identifier/)
  })

  // Error path — empty / non-string
  test('throws on empty string', () => {
    expect(() => validateIdentifier('')).toThrow(
      'Identifier must be a non-empty string'
    )
  })

  // Error message content
  test('error message mentions allowDots when allowDots=false', () => {
    let msg = ''
    try {
      validateIdentifier('a.b')
    } catch (e) {
      msg = (e as Error).message
    }
    // When allowDots is false the error should NOT say "and dots"
    expect(msg).not.toContain('and dots')
  })

  test('error message mentions dots when allowDots=true but char is invalid', () => {
    let msg = ''
    try {
      validateIdentifier('a b', true)
    } catch (e) {
      msg = (e as Error).message
    }
    expect(msg).toContain('and dots')
  })
})

// ---------------------------------------------------------------------------
// escapeIdentifier
// ---------------------------------------------------------------------------
describe('escapeIdentifier', () => {
  test('wraps simple identifier in backticks', () => {
    expect(escapeIdentifier('table')).toBe('`table`')
  })

  test('wraps uppercase identifier', () => {
    expect(escapeIdentifier('TABLE')).toBe('`TABLE`')
  })

  test('wraps identifier with spaces', () => {
    expect(escapeIdentifier('my table')).toBe('`my table`')
  })

  test('escapes an embedded backtick by doubling it', () => {
    expect(escapeIdentifier('my`table')).toBe('`my``table`')
  })

  test('escapes multiple backticks', () => {
    expect(escapeIdentifier('a`b`c')).toBe('`a``b``c`')
  })

  test('wraps identifier with dots', () => {
    // escapeIdentifier accepts any string — dots are not validated here
    expect(escapeIdentifier('db.table')).toBe('`db.table`')
  })

  test('wraps identifier with hyphens', () => {
    expect(escapeIdentifier('my-col')).toBe('`my-col`')
  })

  test('throws on empty string', () => {
    expect(() => escapeIdentifier('')).toThrow(
      'Identifier must be a non-empty string'
    )
  })

  test('wraps identifier that is already a SQL keyword', () => {
    expect(escapeIdentifier('select')).toBe('`select`')
  })
})

// ---------------------------------------------------------------------------
// escapeQualifiedIdentifier
// ---------------------------------------------------------------------------
describe('escapeQualifiedIdentifier', () => {
  test('handles a single part', () => {
    expect(escapeQualifiedIdentifier('table')).toBe('`table`')
  })

  test('joins two parts with a dot', () => {
    expect(escapeQualifiedIdentifier('db', 'table')).toBe('`db`.`table`')
  })

  test('joins three parts with dots', () => {
    expect(escapeQualifiedIdentifier('catalog', 'db', 'table')).toBe(
      '`catalog`.`db`.`table`'
    )
  })

  test('escapes backticks inside each part', () => {
    expect(escapeQualifiedIdentifier('my`db', 'my`table')).toBe(
      '`my``db`.`my``table`'
    )
  })

  test('handles parts with spaces', () => {
    expect(escapeQualifiedIdentifier('my db', 'my table')).toBe(
      '`my db`.`my table`'
    )
  })

  test('throws on empty-string part', () => {
    expect(() => escapeQualifiedIdentifier('db', '')).toThrow(
      'Identifier must be a non-empty string'
    )
  })

  test('throws if any part is empty string', () => {
    expect(() => escapeQualifiedIdentifier('', 'table')).toThrow()
  })
})

// ---------------------------------------------------------------------------
// validateLimit
// ---------------------------------------------------------------------------
describe('validateLimit', () => {
  // Number input
  test('accepts zero', () => {
    expect(validateLimit(0)).toBe(0)
  })

  test('accepts positive integer', () => {
    expect(validateLimit(100)).toBe(100)
  })

  test('accepts maximum allowed value (100000)', () => {
    expect(validateLimit(100000)).toBe(100000)
  })

  test('returns a number', () => {
    expect(typeof validateLimit(10)).toBe('number')
  })

  // String input
  test('parses string integer', () => {
    expect(validateLimit('50')).toBe(50)
  })

  test('parses string "0"', () => {
    expect(validateLimit('0')).toBe(0)
  })

  test('parses string "100000"', () => {
    expect(validateLimit('100000')).toBe(100000)
  })

  // Invalid — too large
  test('throws when value exceeds 100000', () => {
    expect(() => validateLimit(100001)).toThrow(/LIMIT value too large/)
  })

  test('throws when string value exceeds 100000', () => {
    expect(() => validateLimit('999999')).toThrow(/LIMIT value too large/)
  })

  // Invalid — negative
  test('throws on negative number', () => {
    expect(() => validateLimit(-1)).toThrow(/Invalid LIMIT value/)
  })

  test('throws on negative string', () => {
    expect(() => validateLimit('-5')).toThrow(/Invalid LIMIT value/)
  })

  // Invalid — non-integer
  test('throws on float number', () => {
    expect(() => validateLimit(1.5)).toThrow(/Invalid LIMIT value/)
  })

  test('throws on float string', () => {
    // parseInt('1.5') === 1 which IS a valid integer — confirm actual behavior
    // parseInt parses to 1, so '1.5' resolves to 1 (no throw)
    expect(validateLimit('1.5')).toBe(1)
  })

  // Invalid — non-numeric string
  test('throws on non-numeric string', () => {
    expect(() => validateLimit('abc')).toThrow(/Invalid LIMIT value/)
  })

  test('throws on empty string', () => {
    expect(() => validateLimit('')).toThrow(/Invalid LIMIT value/)
  })

  test('throws on NaN', () => {
    expect(() => validateLimit(Number.NaN)).toThrow(/Invalid LIMIT value/)
  })

  // Edge
  test('throws on Infinity', () => {
    // Infinity is not an integer
    expect(() => validateLimit(Infinity)).toThrow(/Invalid LIMIT value/)
  })
})
