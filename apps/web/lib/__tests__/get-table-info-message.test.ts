import { describe, expect, it } from 'bun:test'
import {
  getTableInfoMessage,
  SYSTEM_TABLE_INFO,
} from '@chm/clickhouse-client/clickhouse-version'

describe('getTableInfoMessage', () => {
  it('returns the catalog description for a known system table', () => {
    const known = Object.keys(SYSTEM_TABLE_INFO)[0]
    expect(known).toBeDefined()

    const message = getTableInfoMessage(known)
    expect(message).toBe(SYSTEM_TABLE_INFO[known].description)
  })

  it('falls back to a generic configuration hint for unknown tables', () => {
    const message = getTableInfoMessage('system.does_not_exist')
    expect(message).toBe(
      'Table system.does_not_exist may require specific configuration.'
    )
  })

  it('echoes the requested name into the fallback message', () => {
    expect(getTableInfoMessage('default.my_audit')).toContain(
      'default.my_audit'
    )
  })

  it('handles an empty input by surfacing the empty name in the fallback', () => {
    // No SYSTEM_TABLE_INFO entry has an empty key, so the fallback path
    // is exercised; verify the message stays well-formed.
    const message = getTableInfoMessage('')
    expect(message).toMatch(/may require specific configuration\.$/)
  })
})
