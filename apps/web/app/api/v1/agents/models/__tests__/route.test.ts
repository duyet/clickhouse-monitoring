import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from 'bun:test'
import { getClerkUserId, setMockClerkUserId } from '@/__mocks__/clerk-auth-mock'
import {
  agentAuthFromEnv,
  mockAuthorizeFeatureRequest,
} from '@/app/api/v1/__tests__/feature-permissions-mock'

const originalFetch = globalThis.fetch
const AGENT_API_TOKEN = 'test-agent-token'
let GET: (request: Request) => Promise<Response>

mock.module('server-only', () => ({}))

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

  // Use agent auth mock that reads env vars and Clerk auth state
  mockAuthorizeFeatureRequest.mockImplementation(
    agentAuthFromEnv(getClerkUserId, AGENT_API_TOKEN)
  )
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('GET /api/v1/agents/models', () => {
  function modelsRequest(headers?: HeadersInit) {
    return new Request('http://localhost:3000/api/v1/agents/models', {
      headers,
    })
  }

  test('returns 401 when Clerk auth is enabled and credentials are missing', async () => {
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'clerk'
    process.env.CHM_FEATURE_AGENT_ACCESS = 'authenticated'

    const response = await GET(modelsRequest())

    expect(response.status).toBe(401)
  })

  test('accepts Bearer token when Clerk auth is enabled', async () => {
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'clerk'
    process.env.CHM_FEATURE_AGENT_ACCESS = 'authenticated'
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ data: [] }), { status: 200 })

    const response = await GET(
      modelsRequest({ authorization: `Bearer ${AGENT_API_TOKEN}` })
    )

    expect(response.status).toBe(200)
  })

  test('accepts Clerk session when Clerk auth is enabled', async () => {
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'clerk'
    process.env.CHM_FEATURE_AGENT_ACCESS = 'authenticated'
    setMockClerkUserId('user_123')
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ data: [] }), { status: 200 })

    const response = await GET(modelsRequest())

    expect(response.status).toBe(200)
  })

  test('leaves capabilities unknown when OpenRouter omits a curated model', async () => {
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'clerk'
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          data: [
            {
              id: 'openrouter/free',
              name: 'OpenRouter Free',
              context_length: 200000,
              supported_parameters: ['tools', 'tool_choice'],
              architecture: {
                input_modalities: ['text'],
                output_modalities: ['text'],
                modality: 'text->text',
              },
            },
          ],
        }),
        { status: 200 }
      )

    const response = await GET(
      modelsRequest({ authorization: `Bearer ${AGENT_API_TOKEN}` })
    )
    const body = await response.json()
    const omittedModel = body.models.find(
      (model: { id: string }) => model.id === 'openrouter:qwen/qwen3-coder:free'
    )

    expect(omittedModel).toBeDefined()
    expect(omittedModel).not.toHaveProperty('supportsTools')
    expect(omittedModel).not.toHaveProperty('supportsStreaming')
    expect(omittedModel).not.toHaveProperty('supportsVision')
  })
})
