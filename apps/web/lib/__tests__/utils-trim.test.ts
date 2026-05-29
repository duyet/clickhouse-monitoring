import { cleanQuotedText, normalizeUrl } from '../utils'
import { describe, expect, it } from 'bun:test'

describe('normalizeUrl', () => {
  it('trims leading and trailing whitespace', () => {
    expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com')
  })

  it('strips a trailing slash', () => {
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com')
  })

  it('strips a trailing question mark', () => {
    expect(normalizeUrl('https://example.com?')).toBe('https://example.com')
  })

  it('leaves a URL with a path unchanged when there is no trailing / or ?', () => {
    expect(normalizeUrl('https://example.com/api/v1')).toBe(
      'https://example.com/api/v1'
    )
  })

  it('only strips ONE trailing character (the regex anchors a single token)', () => {
    // The regex is /(\/|\?)$/ — a single trailing / or ? — so a doubled
    // trailing slash leaves one behind. Document the actual behavior.
    expect(normalizeUrl('https://example.com//')).toBe('https://example.com/')
  })

  it('handles the empty string', () => {
    expect(normalizeUrl('')).toBe('')
  })
})

describe('cleanQuotedText', () => {
  it('strips a single leading and trailing double-quote', () => {
    expect(cleanQuotedText('"hello"')).toBe('hello')
  })

  it('strips only the outermost quotes, not interior ones', () => {
    expect(cleanQuotedText('"say "hi""')).toBe('say "hi"')
  })

  it('leaves unquoted text unchanged', () => {
    expect(cleanQuotedText('plain text')).toBe('plain text')
  })

  it('handles a leading-quote-only string', () => {
    expect(cleanQuotedText('"unbalanced')).toBe('unbalanced')
  })

  it('handles a trailing-quote-only string', () => {
    expect(cleanQuotedText('unbalanced"')).toBe('unbalanced')
  })

  it('returns the empty string for empty input', () => {
    expect(cleanQuotedText('')).toBe('')
  })
})
