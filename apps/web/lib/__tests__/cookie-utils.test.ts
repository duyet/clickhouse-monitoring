import { generateSafeCookieScript, sanitizeCookieValue } from '../cookie-utils'
import { describe, expect, it } from 'bun:test'

describe('sanitizeCookieValue', () => {
  it('passes through simple alphanumeric values', () => {
    expect(sanitizeCookieValue('abc123')).toBe('abc123')
  })

  it('coerces numbers to strings', () => {
    expect(sanitizeCookieValue(42)).toBe('42')
  })

  it('encodes characters that would break cookie syntax', () => {
    expect(sanitizeCookieValue('a;b')).toBe('a%3Bb')
    expect(sanitizeCookieValue('a=b')).toBe('a%3Db')
    expect(sanitizeCookieValue('a b')).toBe('a%20b')
  })

  it('encodes quotes', () => {
    expect(sanitizeCookieValue('"x"')).toBe('%22x%22')
  })

  it('encodes the empty string to the empty string', () => {
    expect(sanitizeCookieValue('')).toBe('')
  })
})

describe('generateSafeCookieScript', () => {
  it('emits a syntactically safe document.cookie assignment', () => {
    const script = generateSafeCookieScript('host', 1)
    expect(script).toBe('document.cookie = "host" + "=" + 1 + "; path=" + "/";')
  })

  it('JSON-escapes the cookie name to defeat injection attempts', () => {
    // Hostile name should land inside a string literal — its closing quote
    // must be escaped, so the payload cannot terminate the literal.
    const script = generateSafeCookieScript('a"; alert(1); //', 1)
    expect(script).toContain('"a\\"; alert(1); //"')
    // The first sigil after `document.cookie = ` must be the opening quote
    // of the (escaped) cookie name, not anything that could break out.
    expect(script.startsWith('document.cookie = "')).toBe(true)
  })

  it('JSON-escapes the path', () => {
    const script = generateSafeCookieScript('host', 1, '/foo')
    expect(script).toContain('"/foo"')
  })

  it('rejects non-integer numeric values', () => {
    expect(() => generateSafeCookieScript('host', 1.5)).toThrow(/Invalid/)
  })

  it('rejects negative numeric values', () => {
    expect(() => generateSafeCookieScript('host', -1)).toThrow(/Invalid/)
  })
})
