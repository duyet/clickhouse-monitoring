import {
  deriveTitleFromUserMessage,
  extractMessageText,
  isUntitledThread,
} from '../conversation-utils'
import { describe, expect, test } from 'bun:test'

describe('extractMessageText', () => {
  test('reads text from AI SDK parts', () => {
    expect(
      extractMessageText({
        role: 'user',
        parts: [
          { type: 'text', text: 'show me' },
          { type: 'text', text: 'slow queries' },
        ],
      })
    ).toBe('show me slow queries')
  })

  test('ignores non-text parts', () => {
    expect(
      extractMessageText({
        role: 'user',
        parts: [{ type: 'step-start' }, { type: 'text', text: 'hello' }],
      })
    ).toBe('hello')
  })

  test('falls back to plain string content', () => {
    expect(extractMessageText({ role: 'user', content: '  hi there  ' })).toBe(
      'hi there'
    )
  })

  test('falls back to array content', () => {
    expect(
      extractMessageText({
        role: 'user',
        content: [{ text: 'a' }, { text: 'b' }],
      })
    ).toBe('a b')
  })

  test('returns empty string for missing message', () => {
    expect(extractMessageText(undefined)).toBe('')
    expect(extractMessageText(null)).toBe('')
  })
})

describe('deriveTitleFromUserMessage', () => {
  test('derives a title from the first user message', () => {
    expect(
      deriveTitleFromUserMessage({
        role: 'user',
        parts: [{ type: 'text', text: 'What are the slowest queries today?' }],
      })
    ).toBe('What are the slowest queries today?')
  })

  test('returns undefined for assistant messages', () => {
    expect(
      deriveTitleFromUserMessage({
        role: 'assistant',
        parts: [{ type: 'text', text: 'Here you go' }],
      })
    ).toBeUndefined()
  })

  test('returns undefined when there is no text', () => {
    expect(
      deriveTitleFromUserMessage({ role: 'user', parts: [] })
    ).toBeUndefined()
    expect(deriveTitleFromUserMessage(undefined)).toBeUndefined()
  })
})

describe('isUntitledThread', () => {
  test('treats missing and placeholder titles as untitled', () => {
    expect(isUntitledThread(undefined)).toBe(true)
    expect(isUntitledThread(null)).toBe(true)
    expect(isUntitledThread('')).toBe(true)
    expect(isUntitledThread('New Conversation')).toBe(true)
    expect(isUntitledThread('New Chat')).toBe(true)
  })

  test('treats a real title as titled', () => {
    expect(isUntitledThread('Slowest queries today')).toBe(false)
  })
})
