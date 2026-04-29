import { getHistoryQuerySearchParams } from './search-params'
import { describe, expect, it } from 'bun:test'

describe('getHistoryQuerySearchParams', () => {
  it('keeps present zero-valued params', () => {
    const searchParams = new URLSearchParams({
      last_hours: '0',
      min_duration_s: '0',
      unknown: 'ignored',
    })

    expect(
      getHistoryQuerySearchParams(searchParams, {
        last_hours: '',
        min_duration_s: '',
      })
    ).toEqual({
      last_hours: '0',
      min_duration_s: '0',
    })
  })

  it('omits params that are not present', () => {
    expect(
      getHistoryQuerySearchParams(new URLSearchParams(), {
        last_hours: '',
      })
    ).toEqual({})
  })

  it('omits empty-string params', () => {
    const searchParams = new URLSearchParams({
      last_hours: '',
    })

    expect(
      getHistoryQuerySearchParams(searchParams, {
        last_hours: '',
      })
    ).toEqual({})
  })
})
