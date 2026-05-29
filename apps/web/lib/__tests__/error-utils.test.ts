import type { FetchDataError } from '@chm/clickhouse-client'

import {
  formatErrorMessage,
  formatErrorTitle,
  getErrorDocumentation,
  getErrorVariant,
  shouldDisplayError,
} from '../error-utils'
import { describe, expect, it } from 'bun:test'

const make = (overrides: Partial<FetchDataError>): FetchDataError => ({
  type: 'validation_error',
  message: 'boom',
  ...overrides,
})

describe('formatErrorMessage', () => {
  it('table_not_found surfaces the missing table list', () => {
    const message = formatErrorMessage(
      make({
        type: 'table_not_found',
        details: { missingTables: ['system.backup_log', 'system.error_log'] },
      })
    )
    expect(message).toContain('system.backup_log')
    expect(message).toContain('system.error_log')
    expect(message).toContain('clickhouse-monitoring')
  })

  it('table_not_found without details still mentions the generic guide', () => {
    const message = formatErrorMessage(make({ type: 'table_not_found' }))
    expect(message).toContain('Required tables not found.')
    expect(message).toContain('clickhouse-monitoring')
  })

  it('permission_error returns a fixed user-facing message', () => {
    expect(formatErrorMessage(make({ type: 'permission_error' }))).toContain(
      'Permission denied'
    )
  })

  it('network_error returns a connectivity hint', () => {
    expect(formatErrorMessage(make({ type: 'network_error' }))).toContain(
      'Network connection error'
    )
  })

  it('validation_error includes the underlying message', () => {
    expect(
      formatErrorMessage(make({ type: 'validation_error', message: 'bad sql' }))
    ).toContain('bad sql')
  })

  it('default branch falls back to the raw message', () => {
    expect(
      formatErrorMessage(
        make({ type: 'unknown' as FetchDataError['type'], message: 'raw' })
      )
    ).toBe('raw')
  })
})

describe('formatErrorTitle', () => {
  it('maps each known type to its display title', () => {
    expect(formatErrorTitle(make({ type: 'table_not_found' }))).toBe(
      'Table Not Found'
    )
    expect(formatErrorTitle(make({ type: 'permission_error' }))).toBe(
      'Permission Denied'
    )
    expect(formatErrorTitle(make({ type: 'network_error' }))).toBe(
      'Connection Error'
    )
    expect(formatErrorTitle(make({ type: 'validation_error' }))).toBe(
      'Validation Error'
    )
  })

  it('falls back to a generic title for unknown types', () => {
    expect(
      formatErrorTitle(
        make({ type: 'something_new' as FetchDataError['type'] })
      )
    ).toBe('Query Error')
  })
})

describe('shouldDisplayError', () => {
  it('silences table_not_found by default', () => {
    expect(shouldDisplayError(make({ type: 'table_not_found' }))).toBe(false)
  })

  it('lets every other error type through', () => {
    expect(shouldDisplayError(make({ type: 'permission_error' }))).toBe(true)
    expect(shouldDisplayError(make({ type: 'network_error' }))).toBe(true)
    expect(shouldDisplayError(make({ type: 'validation_error' }))).toBe(true)
  })
})

describe('getErrorDocumentation', () => {
  it('returns a backup-specific link when missingTables mentions backup_log', () => {
    expect(
      getErrorDocumentation(
        make({
          type: 'table_not_found',
          details: { missingTables: ['system.backup_log'] },
        })
      )
    ).toContain('backup')
  })

  it('returns an error_log link when missingTables mentions error_log', () => {
    expect(
      getErrorDocumentation(
        make({
          type: 'table_not_found',
          details: { missingTables: ['system.error_log'] },
        })
      )
    ).toContain('error_log')
  })

  it('returns a zookeeper link when missingTables mentions zookeeper', () => {
    expect(
      getErrorDocumentation(
        make({
          type: 'table_not_found',
          details: { missingTables: ['system.zookeeper'] },
        })
      )
    ).toContain('ZooKeeper')
  })

  it('falls back to the general docs link for unknown missing tables', () => {
    expect(
      getErrorDocumentation(
        make({
          type: 'table_not_found',
          details: { missingTables: ['system.something_else'] },
        })
      )
    ).toContain('clickhouse-monitoring')
  })

  it('returns a permission hint for permission_error', () => {
    expect(getErrorDocumentation(make({ type: 'permission_error' }))).toContain(
      'permissions'
    )
  })

  it('returns null for error types without a documentation link', () => {
    expect(getErrorDocumentation(make({ type: 'network_error' }))).toBeNull()
    expect(getErrorDocumentation(make({ type: 'validation_error' }))).toBeNull()
  })
})

describe('getErrorVariant', () => {
  it('maps each type to the expected alert variant', () => {
    expect(getErrorVariant(make({ type: 'table_not_found' }))).toBe('warning')
    expect(getErrorVariant(make({ type: 'permission_error' }))).toBe(
      'destructive'
    )
    expect(getErrorVariant(make({ type: 'network_error' }))).toBe('info')
    expect(getErrorVariant(make({ type: 'validation_error' }))).toBe('warning')
  })

  it('falls back to destructive for unknown types', () => {
    expect(
      getErrorVariant(make({ type: 'unknown' as FetchDataError['type'] }))
    ).toBe('destructive')
  })
})
