/**
 * Tests for use-actions.ts — Action handlers (killQuery, optimizeTable, querySettings).
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test'

// Mock dependencies
const actualReact = await import('react')

mock.module('react', () => ({
  ...actualReact,
  useCallback: (fn: () => unknown) => fn,
}))

mock.module('../use-host', () => ({
  useHostId: () => 0,
}))

import { useActions } from '../use-actions'
import { mockApiFetch } from './shared-mocks'

describe('useActions', () => {
  beforeEach(() => {
    mockApiFetch.mockImplementation(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: 'OK' }),
    }))
  })

  describe('killQuery', () => {
    it('sends POST to /api/v1/actions with killQuery action', async () => {
      const { killQuery } = useActions()
      const result = await killQuery('query-123')

      expect(result.success).toBe(true)
    })

    it('returns success false on non-ok response', async () => {
      mockApiFetch.mockImplementation(async () => ({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Kill failed' } }),
      }))

      const { killQuery } = useActions()
      const result = await killQuery('query-123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Kill failed')
    })

    it('returns fallback message when error response has no message', async () => {
      mockApiFetch.mockImplementation(async () => ({
        ok: false,
        status: 503,
        json: async () => ({}),
      }))

      const { killQuery } = useActions()
      const result = await killQuery('query-123')

      expect(result.success).toBe(false)
      expect(result.message).toContain('503')
    })

    it('handles JSON parse errors on error response', async () => {
      mockApiFetch.mockImplementation(async () => ({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      }))

      const { killQuery } = useActions()
      const result = await killQuery('query-123')

      expect(result.success).toBe(false)
      expect(result.message).toContain('500')
    })

    it('catches network errors', async () => {
      mockApiFetch.mockImplementation(() => {
        throw new Error('Network error')
      })

      const { killQuery } = useActions()
      const result = await killQuery('query-123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Network error')
    })
  })

  describe('optimizeTable', () => {
    it('sends POST with optimizeTable action', async () => {
      const { optimizeTable } = useActions()
      const result = await optimizeTable('my_table')

      expect(result.success).toBe(true)
    })

    it('returns failure on server error', async () => {
      mockApiFetch.mockImplementation(async () => ({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Table not found' } }),
      }))

      const { optimizeTable } = useActions()
      const result = await optimizeTable('missing_table')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Table not found')
    })
  })

  describe('querySettings', () => {
    it('sends POST with querySettings action', async () => {
      const { querySettings } = useActions()
      const result = await querySettings('query-456')

      expect(result.success).toBe(true)
    })
  })

  describe('executeAction', () => {
    it('is exposed for custom action calls', async () => {
      const { executeAction } = useActions()
      const result = await executeAction({
        action: 'killQuery',
        params: { queryId: 'abc' },
      })

      expect(result.success).toBe(true)
    })

    it('catches exceptions and returns error message', async () => {
      mockApiFetch.mockImplementation(() => {
        throw new Error('Unexpected throw')
      })

      const { executeAction } = useActions()
      const result = await executeAction({
        action: 'killQuery',
        params: { queryId: 'abc' },
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('Unexpected throw')
    })

    it('handles non-Error thrown values', async () => {
      mockApiFetch.mockImplementation(() => {
        throw 'string error' // eslint-disable-line no-throw-literal
      })

      const { executeAction } = useActions()
      const result = await executeAction({
        action: 'killQuery',
        params: {},
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('Unknown error occurred')
    })
  })
})
