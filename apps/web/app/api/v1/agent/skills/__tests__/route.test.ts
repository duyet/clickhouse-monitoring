import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'
import { setMockClerkUserId } from '@/__mocks__/clerk-auth-mock'

const AGENT_API_TOKEN = 'test-agent-token'
let GET: (request: Request) => Promise<Response>

mock.module('@/lib/ai/agent/skills/dynamic-loader', () => ({
  getAllSkills: () => [
    {
      name: 'test-skill',
      description: 'Test skill',
      source: 'builtin',
    },
  ],
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
  setMockClerkUserId(null)
})

describe('GET /api/v1/agent/skills', () => {
  function skillsRequest(headers?: HeadersInit) {
    return new Request('http://localhost:3000/api/v1/agent/skills', {
      headers,
    })
  }

  test('skips auth when agent access is public and auth provider is disabled', async () => {
    process.env.CHM_FEATURE_AGENT_ACCESS = 'public'

    const response = await GET(skillsRequest())

    expect(response.status).toBe(200)
  })

  test('returns 401 when Clerk auth is enabled and credentials are missing', async () => {
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'clerk'
    process.env.CHM_FEATURE_AGENT_ACCESS = 'authenticated'

    const response = await GET(skillsRequest())

    expect(response.status).toBe(401)
  })

  test('accepts Bearer token when Clerk auth is enabled', async () => {
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'clerk'
    process.env.CHM_FEATURE_AGENT_ACCESS = 'authenticated'

    const response = await GET(
      skillsRequest({ authorization: `Bearer ${AGENT_API_TOKEN}` })
    )

    expect(response.status).toBe(200)
  })

  test('accepts Clerk session when Clerk auth is enabled', async () => {
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'clerk'
    process.env.CHM_FEATURE_AGENT_ACCESS = 'authenticated'
    setMockClerkUserId('user_123')

    const response = await GET(skillsRequest())

    expect(response.status).toBe(200)
  })
})
