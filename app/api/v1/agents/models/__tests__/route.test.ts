import { GET } from '../route'
import { afterEach, describe, expect, test } from 'bun:test'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('GET /api/v1/agents/models', () => {
  test('leaves capabilities unknown when OpenRouter omits a curated model', async () => {
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

    const response = await GET()
    const body = await response.json()
    const omittedModel = body.models.find(
      (model: { id: string }) =>
        model.id === 'arcee-ai/trinity-large-preview:free'
    )

    expect(omittedModel).toBeDefined()
    expect(omittedModel).not.toHaveProperty('supportsTools')
    expect(omittedModel).not.toHaveProperty('supportsStreaming')
    expect(omittedModel).not.toHaveProperty('supportsVision')
  })
})
