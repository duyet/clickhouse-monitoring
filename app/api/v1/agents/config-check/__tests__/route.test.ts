import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'

const AGENT_API_TOKEN = 'test-agent-token'
let mockClerkUserId: string | null = null
let GET: (request: Request) => Promise<Response>

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
  delete process.env.CHM_FEATURE_AGENT_ACCESS
  mockClerkUserId = null
})

describe('GET /api/v1/agents/config-check', () => {
  function configRequest(headers?: HeadersInit) {
    return new Request('http://localhost:3000/api/v1/agents/config-check', {
      headers,
    })
  }

  test('skips auth when auth provider is disabled', async () => {
    const response = await GET(configRequest())

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
})
