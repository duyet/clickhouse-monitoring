import {
  getGuidanceForMissingTables,
  getTableGuidance,
  TABLE_GUIDANCE,
} from '../table-guidance'
import { describe, expect, it } from 'bun:test'

describe('getTableGuidance', () => {
  it('returns the catalog entry for a known table', () => {
    const guidance = getTableGuidance('system.query_thread_log')

    expect(guidance).toBeDefined()
    expect(guidance?.description).toContain('thread')
    expect(guidance?.enableInstructions).toContain('log_query_threads')
    expect(guidance?.docsUrl).toContain('query_thread_log')
  })

  it('returns undefined for an unknown table', () => {
    expect(getTableGuidance('system.no_such_table')).toBeUndefined()
  })

  it('covers every entry catalogued in TABLE_GUIDANCE', () => {
    for (const key of Object.keys(TABLE_GUIDANCE)) {
      expect(getTableGuidance(key)).toBe(TABLE_GUIDANCE[key])
    }
  })
})

describe('getGuidanceForMissingTables', () => {
  it('returns the first matching guidance in the input list', () => {
    const guidance = getGuidanceForMissingTables([
      'system.unknown_table',
      'system.session_log',
      'system.error_log',
    ])

    expect(guidance).toBe(TABLE_GUIDANCE['system.session_log'])
  })

  it('returns undefined when no listed table has guidance', () => {
    expect(
      getGuidanceForMissingTables(['system.unknown_a', 'system.unknown_b'])
    ).toBeUndefined()
  })

  it('returns undefined for an empty list', () => {
    expect(getGuidanceForMissingTables([])).toBeUndefined()
  })
})
