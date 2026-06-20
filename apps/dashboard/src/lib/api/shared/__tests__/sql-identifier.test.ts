import { quoteTableIdentifier } from '../sql-identifier'
import { describe, expect, it } from 'bun:test'

describe('quoteTableIdentifier', () => {
  it('quotes a bare table name', () => {
    expect(quoteTableIdentifier('events')).toBe('`events`')
  })

  it('quotes a database.table identifier per component', () => {
    expect(quoteTableIdentifier('analytics.events')).toBe(
      '`analytics`.`events`'
    )
  })

  it('normalizes an already-backtick-quoted identifier (no double-wrapping)', () => {
    expect(quoteTableIdentifier('`events`')).toBe('`events`')
    expect(quoteTableIdentifier('`analytics`.`events`')).toBe(
      '`analytics`.`events`'
    )
  })

  it('tolerates whitespace around the dot separator', () => {
    expect(quoteTableIdentifier('analytics. events')).toBe(
      '`analytics`.`events`'
    )
  })

  it('escapes internal backticks so a quoted name cannot break out of the identifier', () => {
    // A stray-backtick payload stays a single, safely-escaped identifier
    // rather than executable SQL.
    expect(quoteTableIdentifier('`a` DROP TABLE x`')).toBe('`a`` DROP TABLE x`')
  })
})
