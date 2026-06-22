/**
 * Tests for sanitizeClickHouseError
 *
 * Verifies:
 *   - Each bucket maps representative raw messages to the correct constant
 *   - Unknown messages fall back to the generic constant
 *   - No bucket ever echoes any substring of the raw input to the output
 *
 * The no-echo invariant is the security guarantee: even if a ClickHouse error
 * message contains a secret token (hostname, table name, internal path), it
 * must never appear in the sanitized string returned to the client.
 */

import { describe, expect, test } from 'bun:test'
import { SANITIZED_MESSAGES, sanitizeClickHouseError } from '../sanitize-error'

describe('sanitizeClickHouseError — bucket classification', () => {
  test('maps "Table does not exist" to NOT_FOUND', () => {
    expect(
      sanitizeClickHouseError('Table system.secret_table does not exist')
    ).toBe(SANITIZED_MESSAGES.NOT_FOUND)
  })

  test('maps "doesn\'t exist" variant to NOT_FOUND', () => {
    expect(sanitizeClickHouseError("Table system.users doesn't exist")).toBe(
      SANITIZED_MESSAGES.NOT_FOUND
    )
  })

  test('maps "not found" to NOT_FOUND', () => {
    expect(sanitizeClickHouseError('Database not found: internal_db')).toBe(
      SANITIZED_MESSAGES.NOT_FOUND
    )
  })

  test('maps "unknown table" to NOT_FOUND', () => {
    expect(
      sanitizeClickHouseError('Unknown table expression in PREWHERE')
    ).toBe(SANITIZED_MESSAGES.NOT_FOUND)
  })

  test('maps "no such" to NOT_FOUND', () => {
    expect(
      sanitizeClickHouseError('No such file or directory: /data/secret')
    ).toBe(SANITIZED_MESSAGES.NOT_FOUND)
  })

  test('maps "Access denied" to PERMISSION', () => {
    expect(sanitizeClickHouseError('Access denied for user default')).toBe(
      SANITIZED_MESSAGES.PERMISSION
    )
  })

  test('maps "not enough privileges" to PERMISSION', () => {
    expect(
      sanitizeClickHouseError(
        'Not enough privileges. To execute this query, it is necessary to have the grant SELECT'
      )
    ).toBe(SANITIZED_MESSAGES.PERMISSION)
  })

  test('maps "permission denied" to PERMISSION', () => {
    expect(
      sanitizeClickHouseError('Permission denied: cannot read column salary')
    ).toBe(SANITIZED_MESSAGES.PERMISSION)
  })

  test('maps "unauthorized" to PERMISSION', () => {
    expect(
      sanitizeClickHouseError('Unauthorized request to admin endpoint')
    ).toBe(SANITIZED_MESSAGES.PERMISSION)
  })

  test('maps "timeout" to TIMEOUT', () => {
    expect(
      sanitizeClickHouseError('Query execution timeout exceeded: 30s')
    ).toBe(SANITIZED_MESSAGES.TIMEOUT)
  })

  test('maps "timed out" to TIMEOUT', () => {
    expect(
      sanitizeClickHouseError('Connection timed out to 10.0.0.5:8123')
    ).toBe(SANITIZED_MESSAGES.TIMEOUT)
  })

  test('maps "etimedout" to TIMEOUT', () => {
    expect(sanitizeClickHouseError('ETIMEDOUT connecting to host')).toBe(
      SANITIZED_MESSAGES.TIMEOUT
    )
  })

  test('maps "syntax" to SYNTAX', () => {
    expect(
      sanitizeClickHouseError('Syntax error: unexpected token WHERE')
    ).toBe(SANITIZED_MESSAGES.SYNTAX)
  })

  test('maps "cannot parse" to SYNTAX', () => {
    expect(
      sanitizeClickHouseError('Cannot parse expression: invalid column ref')
    ).toBe(SANITIZED_MESSAGES.SYNTAX)
  })

  test('maps "parse error" to SYNTAX', () => {
    expect(sanitizeClickHouseError('Parse error at position 42')).toBe(
      SANITIZED_MESSAGES.SYNTAX
    )
  })

  test('maps unknown message to GENERIC fallback', () => {
    expect(
      sanitizeClickHouseError(
        'Some internal ClickHouse error we have never seen'
      )
    ).toBe(SANITIZED_MESSAGES.GENERIC)
  })

  test('empty string maps to GENERIC', () => {
    expect(sanitizeClickHouseError('')).toBe(SANITIZED_MESSAGES.GENERIC)
  })
})

describe('sanitizeClickHouseError — no-echo guarantee', () => {
  const SECRETS = [
    'system.secret_table',
    'internal_db',
    'salary',
    '10.0.0.5:8123',
    'sk-abc123secrettoken',
  ]

  const rawMessages: Array<{ raw: string; secret: string }> = [
    {
      raw: 'Table system.secret_table does not exist',
      secret: 'system.secret_table',
    },
    {
      raw: 'Permission denied: cannot read column salary from internal_db',
      secret: 'salary',
    },
    {
      raw: 'Connection timed out to 10.0.0.5:8123',
      secret: '10.0.0.5',
    },
    {
      raw: 'Unknown error: token sk-abc123secrettoken rejected',
      secret: 'sk-abc123secrettoken',
    },
  ]

  for (const { raw, secret } of rawMessages) {
    test(`output does not contain "${secret}" from raw error`, () => {
      const out = sanitizeClickHouseError(raw)
      expect(out).not.toContain(secret)
    })
  }

  test('no sanitized message contains any secret token', () => {
    for (const secret of SECRETS) {
      for (const msg of Object.values(SANITIZED_MESSAGES)) {
        expect(msg).not.toContain(secret)
      }
    }
  })
})

describe('sanitizeClickHouseError — case insensitivity', () => {
  test('matches uppercase "DOES NOT EXIST"', () => {
    expect(sanitizeClickHouseError('DOES NOT EXIST')).toBe(
      SANITIZED_MESSAGES.NOT_FOUND
    )
  })

  test('matches mixed case "Access Denied"', () => {
    expect(sanitizeClickHouseError('Access Denied')).toBe(
      SANITIZED_MESSAGES.PERMISSION
    )
  })

  test('matches uppercase "TIMEOUT"', () => {
    expect(sanitizeClickHouseError('TIMEOUT waiting for lock')).toBe(
      SANITIZED_MESSAGES.TIMEOUT
    )
  })
})
