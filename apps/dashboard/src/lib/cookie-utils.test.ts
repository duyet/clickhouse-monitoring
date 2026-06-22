import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import {
  sanitizeCookieValue,
  generateSafeCookieScript,
  setSecureCookie,
} from '@/lib/cookie-utils'

// ---------------------------------------------------------------------------
// sanitizeCookieValue
// ---------------------------------------------------------------------------

describe('sanitizeCookieValue', () => {
  it('returns a plain alphanumeric string unchanged (encodeURIComponent is a no-op)', () => {
    expect(sanitizeCookieValue('hello')).toBe('hello')
  })

  it('encodes semicolons', () => {
    expect(sanitizeCookieValue('a;b')).toBe('a%3Bb')
  })

  it('encodes double-quotes', () => {
    expect(sanitizeCookieValue('"value"')).toBe('%22value%22')
  })

  it('encodes equals signs', () => {
    expect(sanitizeCookieValue('key=val')).toBe('key%3Dval')
  })

  it('encodes spaces', () => {
    expect(sanitizeCookieValue('hello world')).toBe('hello%20world')
  })

  it('encodes newlines (prevents header injection)', () => {
    expect(sanitizeCookieValue('foo\nbar')).toBe('foo%0Abar')
  })

  it('encodes a full XSS attempt string', () => {
    const raw = '<script>alert("xss")</script>'
    const encoded = sanitizeCookieValue(raw)
    // Must not contain raw angle brackets or quotes
    expect(encoded).not.toContain('<')
    expect(encoded).not.toContain('>')
    expect(encoded).not.toContain('"')
    // Must be decodable back to the original
    expect(decodeURIComponent(encoded)).toBe(raw)
  })

  it('converts a number to its string representation and encodes it', () => {
    expect(sanitizeCookieValue(42)).toBe('42')
  })

  it('handles zero', () => {
    expect(sanitizeCookieValue(0)).toBe('0')
  })

  it('handles negative numbers', () => {
    expect(sanitizeCookieValue(-1)).toBe('-1')
  })

  it('handles an empty string', () => {
    expect(sanitizeCookieValue('')).toBe('')
  })

  it('encodes a string with multiple special characters', () => {
    const raw = 'a;b=c "d"'
    const encoded = sanitizeCookieValue(raw)
    expect(decodeURIComponent(encoded)).toBe(raw)
  })
})

// ---------------------------------------------------------------------------
// generateSafeCookieScript
// ---------------------------------------------------------------------------

describe('generateSafeCookieScript', () => {
  it('produces valid JS for a simple name and value', () => {
    const script = generateSafeCookieScript('host', 0)
    expect(script).toBe('document.cookie = "host" + "=" + 0 + "; path=" + "/";')
  })

  it('uses the provided path instead of the default /', () => {
    const script = generateSafeCookieScript('tab', 3, '/dashboard')
    expect(script).toBe(
      'document.cookie = "tab" + "=" + 3 + "; path=" + "/dashboard";'
    )
  })

  it('JSON.stringify-encodes a name that contains double-quotes', () => {
    const script = generateSafeCookieScript('"bad"', 1)
    // JSON.stringify(`"bad"`) → `"\"bad\""`, so the output must include escaped quotes
    expect(script).toContain('\\"bad\\"')
  })

  it('JSON.stringify-encodes a path that contains special chars', () => {
    const script = generateSafeCookieScript('x', 5, '/foo/bar "baz"')
    expect(script).toContain('\\"baz\\"')
  })

  it('throws for a negative integer', () => {
    expect(() => generateSafeCookieScript('host', -1)).toThrow(
      'Invalid cookie value'
    )
  })

  it('throws for a float', () => {
    expect(() => generateSafeCookieScript('host', 1.5)).toThrow(
      'Invalid cookie value'
    )
  })

  it('throws for NaN', () => {
    expect(() => generateSafeCookieScript('host', NaN)).toThrow(
      'Invalid cookie value'
    )
  })

  it('throws for Infinity', () => {
    expect(() => generateSafeCookieScript('host', Infinity)).toThrow(
      'Invalid cookie value'
    )
  })

  it('accepts zero as a valid non-negative integer', () => {
    const script = generateSafeCookieScript('host', 0)
    expect(script).toContain('"=" + 0')
  })

  it('accepts large positive integers', () => {
    const script = generateSafeCookieScript('idx', 9999)
    expect(script).toContain('"=" + 9999')
  })

  it('default path is /', () => {
    const script = generateSafeCookieScript('n', 1)
    expect(script).toContain('+ "/";')
  })
})

// ---------------------------------------------------------------------------
// setSecureCookie — browser-environment tests
// ---------------------------------------------------------------------------

describe('setSecureCookie', () => {
  let originalDocument: typeof globalThis.document | undefined

  beforeEach(() => {
    // Capture whatever was there before (undefined in non-browser Bun)
    originalDocument = (globalThis as Record<string, unknown>).document as
      | typeof globalThis.document
      | undefined

    // Install a minimal document stub
    const cookieJar: string[] = []
    const docStub = {
      get cookie() {
        return cookieJar.join('; ')
      },
      set cookie(value: string) {
        cookieJar.push(value)
      },
    }
    ;(globalThis as Record<string, unknown>).document = docStub
  })

  afterEach(() => {
    if (originalDocument === undefined) {
      delete (globalThis as Record<string, unknown>).document
    } else {
      ;(globalThis as Record<string, unknown>).document = originalDocument
    }
  })

  it('sets a basic cookie with sanitized value', () => {
    setSecureCookie('host', 0)
    expect(
      (globalThis as Record<string, unknown>).document as { cookie: string }
    ).toBeDefined()
    const cookie = (
      (globalThis as Record<string, unknown>).document as { cookie: string }
    ).cookie
    expect(cookie).toContain('host=0')
  })

  it('sanitizes a string value with special characters', () => {
    setSecureCookie('token', 'a;b=c')
    const cookie = (
      (globalThis as Record<string, unknown>).document as { cookie: string }
    ).cookie
    // The raw semicolon must NOT appear in the cookie string unencoded
    expect(cookie).toContain('token=a%3Bb%3Dc')
  })

  it('appends path when provided', () => {
    setSecureCookie('n', 1, { path: '/app' })
    const cookie = (
      (globalThis as Record<string, unknown>).document as { cookie: string }
    ).cookie
    expect(cookie).toContain('; path=/app')
  })

  it('appends max-age when provided', () => {
    setSecureCookie('n', 1, { maxAge: 3600 })
    const cookie = (
      (globalThis as Record<string, unknown>).document as { cookie: string }
    ).cookie
    expect(cookie).toContain('; max-age=3600')
  })

  it('appends domain when provided', () => {
    setSecureCookie('n', 1, { domain: 'example.com' })
    const cookie = (
      (globalThis as Record<string, unknown>).document as { cookie: string }
    ).cookie
    expect(cookie).toContain('; domain=example.com')
  })

  it('appends secure flag when secure: true', () => {
    setSecureCookie('n', 1, { secure: true })
    const cookie = (
      (globalThis as Record<string, unknown>).document as { cookie: string }
    ).cookie
    expect(cookie).toContain('; secure')
  })

  it('does NOT append secure flag when secure: false', () => {
    setSecureCookie('n', 1, { secure: false })
    const cookie = (
      (globalThis as Record<string, unknown>).document as { cookie: string }
    ).cookie
    expect(cookie).not.toContain('; secure')
  })

  it('appends sameSite when provided', () => {
    setSecureCookie('n', 1, { sameSite: 'Lax' })
    const cookie = (
      (globalThis as Record<string, unknown>).document as { cookie: string }
    ).cookie
    expect(cookie).toContain('; samesite=Lax')
  })

  it('does not append optional attributes when not provided', () => {
    setSecureCookie('minimal', 7)
    const cookie = (
      (globalThis as Record<string, unknown>).document as { cookie: string }
    ).cookie
    expect(cookie).toBe('minimal=7')
  })

  it('does not throw when document is undefined (SSR/server context)', () => {
    delete (globalThis as Record<string, unknown>).document
    // Should return without throwing, just log a warning
    expect(() => setSecureCookie('host', 1)).not.toThrow()
  })
})
