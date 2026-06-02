import {
  generateSafeCookieScript,
  sanitizeCookieValue,
  setSecureCookie,
} from '../cookie-utils'
import { afterEach, describe, expect, it } from 'bun:test'

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

  it('uses default path when not specified', () => {
    const script = generateSafeCookieScript('host', 0)
    expect(script).toContain('"/"')
  })
})

describe('setSecureCookie', () => {
  const originalDocument = globalThis.document

  afterEach(() => {
    // Restore document if we changed it
    if (originalDocument !== undefined) {
      Object.defineProperty(globalThis, 'document', {
        value: originalDocument,
        writable: true,
        configurable: true,
      })
    } else {
      // Clean up if we added it
      delete (globalThis as Record<string, unknown>).document
    }
  })

  it('sets a basic cookie with name=value', () => {
    let cookieSet = ''
    Object.defineProperty(globalThis, 'document', {
      value: {
        set cookie(val: string) {
          cookieSet = val
        },
      },
      writable: true,
      configurable: true,
    })

    setSecureCookie('test', 'value')
    expect(cookieSet).toBe('test=value')
  })

  it('sanitizes the cookie value', () => {
    let cookieSet = ''
    Object.defineProperty(globalThis, 'document', {
      value: {
        set cookie(val: string) {
          cookieSet = val
        },
      },
      writable: true,
      configurable: true,
    })

    setSecureCookie('test', 'a;b')
    expect(cookieSet).toBe('test=a%3Bb')
  })

  it('sets path option', () => {
    let cookieSet = ''
    Object.defineProperty(globalThis, 'document', {
      value: {
        set cookie(val: string) {
          cookieSet = val
        },
      },
      writable: true,
      configurable: true,
    })

    setSecureCookie('test', 'value', { path: '/app' })
    expect(cookieSet).toBe('test=value; path=/app')
  })

  it('sets maxAge option', () => {
    let cookieSet = ''
    Object.defineProperty(globalThis, 'document', {
      value: {
        set cookie(val: string) {
          cookieSet = val
        },
      },
      writable: true,
      configurable: true,
    })

    setSecureCookie('test', 'value', { maxAge: 3600 })
    expect(cookieSet).toBe('test=value; max-age=3600')
  })

  it('sets domain option', () => {
    let cookieSet = ''
    Object.defineProperty(globalThis, 'document', {
      value: {
        set cookie(val: string) {
          cookieSet = val
        },
      },
      writable: true,
      configurable: true,
    })

    setSecureCookie('test', 'value', { domain: '.example.com' })
    expect(cookieSet).toBe('test=value; domain=.example.com')
  })

  it('sets secure flag', () => {
    let cookieSet = ''
    Object.defineProperty(globalThis, 'document', {
      value: {
        set cookie(val: string) {
          cookieSet = val
        },
      },
      writable: true,
      configurable: true,
    })

    setSecureCookie('test', 'value', { secure: true })
    expect(cookieSet).toBe('test=value; secure')
  })

  it('sets sameSite option', () => {
    let cookieSet = ''
    Object.defineProperty(globalThis, 'document', {
      value: {
        set cookie(val: string) {
          cookieSet = val
        },
      },
      writable: true,
      configurable: true,
    })

    setSecureCookie('test', 'value', { sameSite: 'Strict' })
    expect(cookieSet).toBe('test=value; samesite=Strict')
  })

  it('sets all options together', () => {
    let cookieSet = ''
    Object.defineProperty(globalThis, 'document', {
      value: {
        set cookie(val: string) {
          cookieSet = val
        },
      },
      writable: true,
      configurable: true,
    })

    setSecureCookie('test', 'value', {
      path: '/',
      maxAge: 86400,
      domain: '.example.com',
      secure: true,
      sameSite: 'Lax',
    })
    expect(cookieSet).toContain('test=value')
    expect(cookieSet).toContain('path=/')
    expect(cookieSet).toContain('max-age=86400')
    expect(cookieSet).toContain('domain=.example.com')
    expect(cookieSet).toContain('secure')
    expect(cookieSet).toContain('samesite=Lax')
  })

  it('accepts numeric values', () => {
    let cookieSet = ''
    Object.defineProperty(globalThis, 'document', {
      value: {
        set cookie(val: string) {
          cookieSet = val
        },
      },
      writable: true,
      configurable: true,
    })

    setSecureCookie('host', 0)
    expect(cookieSet).toBe('host=0')
  })

  it('does nothing when document is undefined (SSR)', () => {
    // Remove document to simulate server-side
    delete (globalThis as Record<string, unknown>).document
    // Should not throw
    setSecureCookie('test', 'value')
  })
})
