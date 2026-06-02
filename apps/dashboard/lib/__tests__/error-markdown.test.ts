import type { CardError } from '../card-error-utils'

import { getErrorMarkdown } from '../error-markdown'
import { describe, expect, it } from 'bun:test'

describe('getErrorMarkdown', () => {
  it('renders a minimal error with a timestamp, message, and fix-needed block', () => {
    const md = getErrorMarkdown({ message: 'boom' } as CardError)

    expect(md).toContain('# chmonitor Error')
    expect(md).toContain('**Timestamp**:')
    expect(md).toContain('**Message**:')
    expect(md).toContain('boom')
    expect(md).toContain('## Fix Needed')
  })

  it('includes a Context section only when a title is provided', () => {
    expect(
      getErrorMarkdown({ message: 'boom' } as CardError, 'Top Queries')
    ).toContain('**Chart**: Top Queries')
    expect(getErrorMarkdown({ message: 'boom' } as CardError)).not.toContain(
      '## Context'
    )
  })

  it('surfaces the error type when present', () => {
    const md = getErrorMarkdown({
      message: 'boom',
      type: 'permission_error',
    } as CardError)
    expect(md).toContain('**Type**: permission_error')
  })

  it('renders a SQL fenced block when details.query is present', () => {
    const md = getErrorMarkdown({
      message: 'boom',
      details: { query: 'SELECT 1' },
    } as unknown as CardError)
    expect(md).toContain('### Query')
    expect(md).toContain('```sql\nSELECT 1\n```')
  })

  it('renders the Original Error message and stack for Error instances', () => {
    const original = new Error('inner failure')
    original.stack = 'stack-frame-1\nstack-frame-2'

    const md = getErrorMarkdown({
      message: 'boom',
      details: { originalError: original },
    } as unknown as CardError)

    expect(md).toContain('### Original Error')
    expect(md).toContain('inner failure')
    expect(md).toContain('Stack:')
    expect(md).toContain('stack-frame-1')
  })

  it('stringifies non-Error originalError values', () => {
    const md = getErrorMarkdown({
      message: 'boom',
      details: { originalError: { code: 502 } },
    } as unknown as CardError)
    expect(md).toContain('### Original Error')
    // Object stringifies as [object Object] — assert the block is rendered.
    expect(md).toMatch(/### Original Error[\s\S]*```[\s\S]*```/)
  })

  it('includes HTTP Status and System Info sections when present', () => {
    const md = getErrorMarkdown({
      message: 'boom',
      details: { statusCode: 503, clickHouseVersion: '24.3.1' },
    } as unknown as CardError)
    expect(md).toContain('### HTTP Status')
    expect(md).toContain('**Code**: 503')
    expect(md).toContain('### System Info')
    expect(md).toContain('**ClickHouse Version**: 24.3.1')
  })

  it('skips optional sections when details fields are absent', () => {
    const md = getErrorMarkdown({
      message: 'boom',
      details: {},
    } as unknown as CardError)
    expect(md).not.toContain('### Query')
    expect(md).not.toContain('### Original Error')
    expect(md).not.toContain('### HTTP Status')
    expect(md).not.toContain('### System Info')
  })
})
