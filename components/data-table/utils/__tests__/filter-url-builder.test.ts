import { getFilterToggleHref } from '../filter-url-builder'
import { describe, expect, it } from 'bun:test'

describe('getFilterToggleHref', () => {
  it('sets the key when no value is currently set', () => {
    const params = new URLSearchParams()
    const url = getFilterToggleHref('/queries', params, 'type', 'SELECT', {})

    expect(url).toContain('type=SELECT')
  })

  it('replaces the value when a different value is currently set', () => {
    const params = new URLSearchParams('type=INSERT')
    const url = getFilterToggleHref('/queries', params, 'type', 'SELECT', {})

    expect(url).toContain('type=SELECT')
    expect(url).not.toContain('type=INSERT')
  })

  it('clears the key when the current value matches and no default exists', () => {
    const params = new URLSearchParams('type=SELECT')
    const url = getFilterToggleHref('/queries', params, 'type', 'SELECT', {
      type: '',
    })

    expect(url).not.toContain('type=')
  })

  it('preserves the key with an empty value when a default exists', () => {
    const params = new URLSearchParams('type=SELECT')
    const url = getFilterToggleHref('/queries', params, 'type', 'SELECT', {
      type: 'abc',
    })

    // The empty-value form must remain in the URL so the default does not
    // re-apply on subsequent reads.
    expect(url).toContain('type=')
    expect(url).not.toContain('type=SELECT')
  })

  it('does not mutate the input URLSearchParams', () => {
    const params = new URLSearchParams('type=INSERT')
    const before = params.toString()

    getFilterToggleHref('/queries', params, 'type', 'SELECT', {})

    expect(params.toString()).toBe(before)
  })

  it('preserves other unrelated params', () => {
    const params = new URLSearchParams('type=INSERT&host=1')
    const url = getFilterToggleHref('/queries', params, 'type', 'SELECT', {})

    expect(url).toContain('host=1')
    expect(url).toContain('type=SELECT')
  })
})
