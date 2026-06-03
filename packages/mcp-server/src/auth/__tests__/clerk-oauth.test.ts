import { clerkOAuthEnabled, verifyClerkOAuthToken } from '../clerk-oauth'
import { afterEach, describe, expect, it } from 'bun:test'

const originalFetch = globalThis.fetch
const originalSecret = process.env.CLERK_SECRET_KEY

function mockFetch(impl: (url: string, init?: RequestInit) => Response) {
  globalThis.fetch = (async (
    input: string | URL | Request,
    init?: RequestInit
  ) => impl(String(input), init)) as typeof fetch
}

describe('clerk-oauth', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch
    if (originalSecret !== undefined)
      process.env.CLERK_SECRET_KEY = originalSecret
    else delete process.env.CLERK_SECRET_KEY
  })

  describe('clerkOAuthEnabled', () => {
    it('reflects CLERK_SECRET_KEY presence', () => {
      delete process.env.CLERK_SECRET_KEY
      expect(clerkOAuthEnabled()).toBe(false)
      process.env.CLERK_SECRET_KEY = 'sk_test_x'
      expect(clerkOAuthEnabled()).toBe(true)
    })
  })

  describe('verifyClerkOAuthToken', () => {
    it('fails closed when no secret key is configured', async () => {
      delete process.env.CLERK_SECRET_KEY
      const res = await verifyClerkOAuthToken('tok')
      expect(res.valid).toBe(false)
      expect(res.reason).toContain('CLERK_SECRET_KEY')
    })

    it('returns valid + subject/scopes on a 200 from Clerk', async () => {
      process.env.CLERK_SECRET_KEY = 'sk_test_x'
      let sentAuth = ''
      let sentBody = ''
      mockFetch((url, init) => {
        expect(url).toContain('/oauth_applications/access_tokens/verify')
        sentAuth = String(
          (init?.headers as Record<string, string>).Authorization
        )
        sentBody = String(init?.body)
        return Response.json({ subject: 'user_123', scopes: ['email'] })
      })
      const res = await verifyClerkOAuthToken('tok-abc')
      expect(res.valid).toBe(true)
      expect(res.subject).toBe('user_123')
      expect(res.scopes).toEqual(['email'])
      expect(sentAuth).toBe('Bearer sk_test_x')
      expect(sentBody).toContain('tok-abc')
    })

    it('treats a non-2xx (expired/unknown token) as invalid, not an error', async () => {
      process.env.CLERK_SECRET_KEY = 'sk_test_x'
      mockFetch(() => new Response('nope', { status: 404 }))
      const res = await verifyClerkOAuthToken('tok')
      expect(res.valid).toBe(false)
      expect(res.reason).toContain('404')
    })

    it('returns invalid when the fetch itself throws', async () => {
      process.env.CLERK_SECRET_KEY = 'sk_test_x'
      mockFetch(() => {
        throw new Error('network down')
      })
      const res = await verifyClerkOAuthToken('tok')
      expect(res.valid).toBe(false)
      expect(res.reason).toContain('request failed')
    })
  })
})
