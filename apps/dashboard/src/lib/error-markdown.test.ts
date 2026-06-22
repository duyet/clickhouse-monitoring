import type { CardError } from './card-error-utils'

import { getErrorMarkdown } from './error-markdown'
import { describe, expect, it } from 'bun:test'

// Helper: build a plain Error as CardError
function makeError(message: string): CardError {
  return new Error(message)
}

// Helper: build an error-like object with optional extra fields
function makeApiError(
  message: string,
  opts?: {
    type?: string
    details?: {
      query?: string
      originalError?: Error | unknown
      statusCode?: number
      clickHouseVersion?: string
    }
  }
): CardError {
  return Object.assign(new Error(message), opts)
}

describe('getErrorMarkdown', () => {
  describe('always-present sections', () => {
    it('starts with the chmonitor Error heading', () => {
      const md = getErrorMarkdown(makeError('something went wrong'))
      expect(md).toContain('# chmonitor Error')
    })

    it('includes a Timestamp line with an ISO date', () => {
      const md = getErrorMarkdown(makeError('oops'))
      expect(md).toMatch(/\*\*Timestamp\*\*: \d{4}-\d{2}-\d{2}T/)
    })

    it('includes the Error section with the message', () => {
      const md = getErrorMarkdown(makeError('query failed'))
      expect(md).toContain('## Error')
      expect(md).toContain('query failed')
    })

    it('wraps the error message in a code block', () => {
      const md = getErrorMarkdown(makeError('boom'))
      // message appears between ``` fences
      expect(md).toContain('```\nboom\n```')
    })

    it('always ends with the Fix Needed section', () => {
      const md = getErrorMarkdown(makeError('x'))
      expect(md).toContain('## Fix Needed')
      expect(md).toContain('Root cause explanation')
      expect(md).toContain('Specific fix steps')
      expect(md).toContain('Preventive measures')
    })
  })

  describe('title / context section', () => {
    it('does NOT include a Context section when title is omitted', () => {
      const md = getErrorMarkdown(makeError('err'))
      expect(md).not.toContain('## Context')
      expect(md).not.toContain('**Chart**:')
    })

    it('includes the Context section when title is provided', () => {
      const md = getErrorMarkdown(makeError('err'), 'Top Queries Chart')
      expect(md).toContain('## Context')
      expect(md).toContain('**Chart**: Top Queries Chart')
    })

    it('context section appears before the Error section', () => {
      const md = getErrorMarkdown(makeError('err'), 'My Chart')
      const contextIdx = md.indexOf('## Context')
      const errorIdx = md.indexOf('## Error')
      expect(contextIdx).toBeLessThan(errorIdx)
    })
  })

  describe('type field', () => {
    it('includes the Type field when error has a type property', () => {
      const err = makeApiError('access denied', { type: 'permission_error' })
      const md = getErrorMarkdown(err)
      expect(md).toContain('**Type**: permission_error')
    })

    it('does NOT include a Type line when the error has no type', () => {
      const md = getErrorMarkdown(makeError('plain error'))
      expect(md).not.toContain('**Type**:')
    })
  })

  describe('details.query', () => {
    it('includes a Query section when details.query is present', () => {
      const err = makeApiError('query error', {
        details: { query: 'SELECT * FROM system.processes' },
      })
      const md = getErrorMarkdown(err)
      expect(md).toContain('### Query')
      expect(md).toContain('```sql\nSELECT * FROM system.processes\n```')
    })

    it('does NOT include a Query section when details.query is absent', () => {
      const err = makeApiError('err', { details: {} })
      const md = getErrorMarkdown(err)
      expect(md).not.toContain('### Query')
    })
  })

  describe('details.originalError', () => {
    it('includes an Original Error section when details.originalError is an Error', () => {
      const original = new Error('root cause')
      const err = makeApiError('wrapping error', {
        details: { originalError: original },
      })
      const md = getErrorMarkdown(err)
      expect(md).toContain('### Original Error')
      expect(md).toContain('root cause')
    })

    it('includes the stack when the originalError has a stack', () => {
      const original = new Error('root cause')
      // Ensure there is a stack
      if (!original.stack) {
        original.stack = 'Error: root cause\n    at test:1:1'
      }
      const err = makeApiError('wrapping error', {
        details: { originalError: original },
      })
      const md = getErrorMarkdown(err)
      expect(md).toContain('Stack:')
    })

    it('stringifies non-Error originalError values', () => {
      const err = makeApiError('wrapping error', {
        details: { originalError: 'string cause' },
      })
      const md = getErrorMarkdown(err)
      expect(md).toContain('### Original Error')
      expect(md).toContain('string cause')
    })

    it('does NOT include an Original Error section when details.originalError is absent', () => {
      const err = makeApiError('err', { details: {} })
      const md = getErrorMarkdown(err)
      expect(md).not.toContain('### Original Error')
    })
  })

  describe('details.statusCode', () => {
    it('includes the HTTP Status section when details.statusCode is present', () => {
      const err = makeApiError('http error', {
        details: { statusCode: 503 },
      })
      const md = getErrorMarkdown(err)
      expect(md).toContain('### HTTP Status')
      expect(md).toContain('**Code**: 503')
    })

    it('does NOT include an HTTP Status section when statusCode is absent', () => {
      const err = makeApiError('err', { details: {} })
      const md = getErrorMarkdown(err)
      expect(md).not.toContain('### HTTP Status')
    })
  })

  describe('details.clickHouseVersion', () => {
    it('includes the System Info section when details.clickHouseVersion is present', () => {
      const err = makeApiError('ch error', {
        details: { clickHouseVersion: '24.3.1.1' },
      })
      const md = getErrorMarkdown(err)
      expect(md).toContain('### System Info')
      expect(md).toContain('**ClickHouse Version**: 24.3.1.1')
    })

    it('does NOT include a System Info section when clickHouseVersion is absent', () => {
      const err = makeApiError('err', { details: {} })
      const md = getErrorMarkdown(err)
      expect(md).not.toContain('### System Info')
    })
  })

  describe('combination: full error with all fields', () => {
    it('produces all sections in order', () => {
      const original = new Error('socket hang up')
      const err = makeApiError('ClickHouse unreachable', {
        type: 'network_error',
        details: {
          query: 'SELECT 1',
          originalError: original,
          statusCode: 503,
          clickHouseVersion: '23.8.5.1',
        },
      })
      const md = getErrorMarkdown(err, 'Connection Chart')

      const heading = md.indexOf('# chmonitor Error')
      const timestamp = md.indexOf('**Timestamp**:')
      const context = md.indexOf('## Context')
      const errorSection = md.indexOf('## Error')
      const typeField = md.indexOf('**Type**: network_error')
      const query = md.indexOf('### Query')
      const originalErr = md.indexOf('### Original Error')
      const httpStatus = md.indexOf('### HTTP Status')
      const sysInfo = md.indexOf('### System Info')
      const fixNeeded = md.indexOf('## Fix Needed')

      // All sections exist
      expect(heading).toBeGreaterThanOrEqual(0)
      expect(timestamp).toBeGreaterThan(heading)
      expect(context).toBeGreaterThan(timestamp)
      expect(errorSection).toBeGreaterThan(context)
      expect(typeField).toBeGreaterThan(errorSection)
      expect(query).toBeGreaterThan(typeField)
      expect(originalErr).toBeGreaterThan(query)
      expect(httpStatus).toBeGreaterThan(originalErr)
      expect(sysInfo).toBeGreaterThan(httpStatus)
      expect(fixNeeded).toBeGreaterThan(sysInfo)
    })
  })

  describe('edge cases', () => {
    it('handles an empty message gracefully', () => {
      const err = makeError('')
      const md = getErrorMarkdown(err)
      expect(md).toContain('## Error')
      expect(md).toContain('```\n\n```')
    })

    it('handles details that is not an object (ignored)', () => {
      // Cast to bypass TS; test runtime guard
      const err = makeApiError('oops', {
        details: 'not an object' as unknown as undefined,
      })
      const md = getErrorMarkdown(err)
      // No detail sections should appear
      expect(md).not.toContain('### Query')
      expect(md).not.toContain('### Original Error')
      expect(md).not.toContain('### HTTP Status')
      expect(md).not.toContain('### System Info')
    })

    it('includes title with special characters', () => {
      const md = getErrorMarkdown(makeError('err'), 'CPU & Memory (%) Chart')
      expect(md).toContain('**Chart**: CPU & Memory (%) Chart')
    })
  })
})
