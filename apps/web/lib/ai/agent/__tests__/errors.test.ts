import { classifyError, parseAgentError } from '../errors'
import { describe, expect, test } from 'bun:test'

describe('agent error classification', () => {
  test('extracts AnyRouter upstream envelope details', () => {
    const classified = classifyError(
      {
        statusCode: 502,
        responseBody: JSON.stringify({
          error: {
            code: 'upstream_exhausted',
            message: 'Every upstream provider failed',
            metadata: {
              type: 'upstream_error',
              upstream_backend: 'cloudflare',
              upstream_status: 502,
              upstream_message: 'Worker AI backend unavailable',
            },
          },
        }),
        response: {
          headers: new Headers({ 'x-request-id': 'req_anyrouter_123' }),
        },
      },
      { model: 'anyrouter:google/gemma-4-26b-a4b-it', provider: 'anyrouter' }
    )

    expect(classified).toMatchObject({
      type: 'upstream_error',
      provider: 'anyrouter',
      model: 'anyrouter:google/gemma-4-26b-a4b-it',
      code: 'upstream_exhausted',
      upstreamBackend: 'cloudflare',
      upstreamStatus: 502,
      upstreamMessage: 'Worker AI backend unavailable',
      requestId: 'req_anyrouter_123',
    })
  })

  test('keeps upstream payment details on billing errors', () => {
    const classified = classifyError(
      JSON.stringify({
        error: {
          code: 'payment_required',
          message: 'Upstream provider "cloudflare" returned 402',
          metadata: {
            upstream_backend: 'cloudflare',
            upstream_status: 402,
            upstream_message: 'You exceeded your current quota.',
          },
        },
      }),
      { provider: 'anyrouter' }
    )

    expect(classified.type).toBe('billing_error')
    expect(classified.code).toBe('payment_required')
    expect(classified.upstreamMessage).toBe('You exceeded your current quota.')
  })

  test('parses nested AgentError client payloads', () => {
    const error = new Error(
      JSON.stringify({
        error: {
          type: 'upstream_error',
          message: 'Provider unavailable',
          suggestion: 'Retry later',
          timestamp: 123,
        },
      })
    )

    expect(parseAgentError(error)).toMatchObject({
      type: 'upstream_error',
      message: 'Provider unavailable',
    })
  })
})
