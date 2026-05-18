import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'

const AGENT_API_TOKEN = 'test-agent-token'
let mockClerkUserId: string | null = null
let GET: (request: Request) => Promise<Response>

mock.module('server-only', () => ({}))
mock.module('@clerk/nextjs/server', () => ({
  auth: async () => ({
    userId: mockClerkUserId,
  }),
}))

beforeAll(async () => {
  process.env.AGENT_API_TOKEN = AGENT_API_TOKEN
  const route = await import('../route')
  GET = route.GET
})

beforeEach(() => {
  process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'none'
  delete process.env.CHM_AUTH_PROVIDER
  delete process.env.CHM_FEATURE_AGENT_ACCESS
  delete process.env.LLM_API_KEY
  delete process.env.LLM_API_BASE
  delete process.env.ANYROUTER_API_KEY
  delete process.env.ANYROUTER_API_BASE
  delete process.env.OPENROUTER_API_KEY
  delete process.env.OPENROUTER_API_BASE
  delete process.env.NVIDIA_API_KEY
  delete process.env.NVIDIA_API_BASE
  mockClerkUserId = null
})

describe('GET /api/v1/agents/config-check', () => {
  function configRequest(headers?: HeadersInit) {
    return new Request('http://localhost:3000/api/v1/agents/config-check', {
      headers,
    })
  }

  test('skips auth when agent access is public and auth provider is disabled', async () => {
    process.env.CHM_FEATURE_AGENT_ACCESS = 'public'

    const response = await GET(
      configRequest({ authorization: `Bearer ${AGENT_API_TOKEN}` })
    )

    expect(response.status).toBe(200)
  })

  test('returns 401 when Clerk auth is enabled and credentials are missing', async () => {
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'clerk'
    process.env.CHM_FEATURE_AGENT_ACCESS = 'authenticated'

    const response = await GET(configRequest())

    expect(response.status).toBe(401)
  })

  test('accepts Bearer token when Clerk auth is enabled', async () => {
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'clerk'
    process.env.CHM_FEATURE_AGENT_ACCESS = 'authenticated'

    const response = await GET(
      configRequest({ authorization: `Bearer ${AGENT_API_TOKEN}` })
    )

    expect(response.status).toBe(200)
  })

  test('accepts Clerk session when Clerk auth is enabled', async () => {
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'clerk'
    process.env.CHM_FEATURE_AGENT_ACCESS = 'authenticated'
    mockClerkUserId = 'user_123'

    const response = await GET(configRequest())

    expect(response.status).toBe(200)
  })

  test('treats ANYROUTER_API_KEY as sufficient provider configuration', async () => {
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'clerk'
    process.env.ANYROUTER_API_KEY = 'sk-ar-test'

    const response = await GET(
      configRequest({ authorization: `Bearer ${AGENT_API_TOKEN}` })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.configured.apiKey).toBe(true)
    expect(body.configured.apiBase).toBe(true)
    expect(body.isFullyConfigured).toBe(true)
    expect(
      body.providers.find(
        (provider: { id: string }) => provider.id === 'anyrouter'
      )
    ).toMatchObject({
      configured: true,
      baseURL: 'https://anyrouter.dev/api/v1',
    })
  })

  test('does not expose custom provider base URLs', async () => {
    process.env.ANYROUTER_API_KEY = 'sk-ar-test'
    process.env.ANYROUTER_API_BASE =
      'https://token:secret@internal.example.test/v1'

    const response = await GET(
      configRequest({ authorization: `Bearer ${AGENT_API_TOKEN}` })
    )
    const body = await response.json()
    const anyrouter = body.providers.find(
      (provider: { id: string }) => provider.id === 'anyrouter'
    )

    expect(response.status).toBe(200)
    expect(JSON.stringify(body)).not.toContain('secret@internal')
    expect(anyrouter).toMatchObject({
      hasBaseURLOverride: true,
      baseURL: 'custom',
    })
  })
})
