import { getSuggestedPrompts, STARTER_PROMPTS } from '../suggested-prompts'
import { describe, expect, test } from 'bun:test'

describe('suggested prompts', () => {
  test('returns three prompts by default', () => {
    expect(getSuggestedPrompts()).toHaveLength(3)
  })

  test('handles empty messages and explicit limits', () => {
    expect(getSuggestedPrompts({ messages: [] })).toHaveLength(3)
    expect(getSuggestedPrompts({ limit: 0 })).toEqual([])
    expect(getSuggestedPrompts({ limit: 999 })).toHaveLength(
      STARTER_PROMPTS.length
    )
  })

  test('prioritizes prompts from conversation context deterministically', () => {
    const prompts = getSuggestedPrompts({
      messages: [
        {
          id: 'user-1',
          role: 'user',
          parts: [
            {
              type: 'text',
              text: 'The merge queue has stuck mutations and slow parts.',
            },
          ],
        },
      ],
      limit: 2,
    })

    expect(prompts[0].text.toLowerCase()).toContain('merge')
  })

  test('scores matching tags above lower scoring prompts', () => {
    const prompts = getSuggestedPrompts({
      messages: [
        {
          id: 'user-1',
          role: 'user',
          parts: [
            {
              type: 'text',
              text: 'Find slow query performance regressions.',
            },
          ],
        },
      ],
      limit: 2,
    })

    expect(prompts[0].text).toBe(
      'What are the slowest queries from the past 24 hours?'
    )
  })

  test('boosts prompts when the conversation contains a category name', () => {
    const prompts = getSuggestedPrompts({
      messages: [
        {
          id: 'user-1',
          role: 'user',
          parts: [
            {
              type: 'text',
              text: 'Replication looks suspicious.',
            },
          ],
        },
      ],
      limit: 1,
    })

    expect(prompts[0].category).toBe('Replication')
  })

  test('keeps deterministic ordering for the same input', () => {
    const input = {
      messages: [
        {
          id: 'user-1',
          role: 'user',
          parts: [{ type: 'text', text: 'storage disk table usage' }],
        },
      ],
      limit: 4,
    } as const

    expect(getSuggestedPrompts(input)).toEqual(getSuggestedPrompts(input))
  })

  test('treats malformed message parts as empty context', () => {
    const prompts = getSuggestedPrompts({
      messages: [
        {
          id: 'user-1',
          role: 'user',
          parts: undefined,
        } as never,
      ],
      limit: 1,
    })

    expect(prompts[0]).toBe(STARTER_PROMPTS[0])
  })
})
