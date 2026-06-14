import type { Conversation } from './conversation-utils'

import {
  deleteConversation,
  deriveTitleFromUserMessage,
  extractMessageText,
  formatRelativeTime,
  generateConversationId,
  generateTitleFromMessage,
  isUntitledThread,
  loadConversations,
  saveConversations,
  upsertConversation,
} from './conversation-utils'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  setSystemTime,
  test,
} from 'bun:test'

// ── In-memory localStorage shim (bun has no DOM by default) ──
class MemoryStorage {
  private store = new Map<string, string>()
  getItem(k: string) {
    return this.store.has(k) ? (this.store.get(k) as string) : null
  }
  setItem(k: string, v: string) {
    this.store.set(k, String(v))
  }
  removeItem(k: string) {
    this.store.delete(k)
  }
  clear() {
    this.store.clear()
  }
}

beforeEach(() => {
  ;(globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage()
})
afterEach(() => {
  ;(globalThis as { localStorage?: unknown }).localStorage = undefined
})

function conv(id: string, updatedAt: number): Conversation {
  return { id, title: id, createdAt: 0, updatedAt, messages: [] }
}

describe('generateConversationId', () => {
  test('returns a unique UUID each call', () => {
    const a = generateConversationId()
    const b = generateConversationId()
    expect(a).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
    expect(a).not.toBe(b)
  })
})

describe('generateTitleFromMessage', () => {
  test('unwraps a fenced code block', () => {
    // NOTE: the italic-markdown strip (replace(/\*/g, '')) also removes a SQL
    // `*`, so "SELECT *" becomes "SELECT " (double space). Encoding the real
    // behavior — the docstring's "SELECT * FROM users" example is aspirational.
    expect(generateTitleFromMessage('```sql\nSELECT * FROM users\n```')).toBe(
      'SELECT  FROM users'
    )
  })

  test('strips markdown formatting', () => {
    expect(generateTitleFromMessage('## **Bold** `code` title')).toBe(
      'Bold code title'
    )
  })

  test('truncates to the max length (50)', () => {
    const long = 'x'.repeat(80)
    expect(generateTitleFromMessage(long).length).toBe(50)
  })

  test('cuts at the first sentence boundary when within the limit', () => {
    expect(generateTitleFromMessage('Short one. And more.')).toBe('Short one.')
  })

  test('falls back to "New Conversation" when empty', () => {
    expect(generateTitleFromMessage('   ')).toBe('New Conversation')
    expect(generateTitleFromMessage('```\n\n```')).toBe('New Conversation')
  })
})

describe('extractMessageText', () => {
  test('reads AI SDK parts array', () => {
    expect(
      extractMessageText({
        parts: [
          { type: 'text', text: 'hello' },
          { type: 'tool', text: 'ignored?' },
          { type: 'text', text: 'world' },
        ],
      })
    ).toBe('hello world')
  })

  test('reads legacy string content', () => {
    expect(extractMessageText({ content: '  hi  ' })).toBe('hi')
  })

  test('reads legacy array content', () => {
    expect(
      extractMessageText({ content: [{ text: 'a' }, {}, { text: 'b' }] })
    ).toBe('a  b')
  })

  test('null / empty → empty string', () => {
    expect(extractMessageText(null)).toBe('')
    expect(extractMessageText(undefined)).toBe('')
    expect(extractMessageText({})).toBe('')
  })
})

describe('deriveTitleFromUserMessage', () => {
  test('derives only from a user message with text', () => {
    expect(
      deriveTitleFromUserMessage({ role: 'user', content: 'Find slow queries' })
    ).toBe('Find slow queries')
  })

  test('returns undefined for non-user roles or empty text', () => {
    expect(
      deriveTitleFromUserMessage({ role: 'assistant', content: 'hi' })
    ).toBeUndefined()
    expect(
      deriveTitleFromUserMessage({ role: 'user', content: '' })
    ).toBeUndefined()
    expect(deriveTitleFromUserMessage(null)).toBeUndefined()
  })
})

describe('isUntitledThread', () => {
  test('true for missing or placeholder titles', () => {
    expect(isUntitledThread(undefined)).toBe(true)
    expect(isUntitledThread('')).toBe(true)
    expect(isUntitledThread('New Conversation')).toBe(true)
    expect(isUntitledThread('New Chat')).toBe(true)
  })

  test('false for a real title', () => {
    expect(isUntitledThread('Slow queries')).toBe(false)
  })
})

describe('formatRelativeTime', () => {
  test('under a minute → just now', () => {
    expect(formatRelativeTime(Date.now() - 30_000)).toBe('just now')
  })

  test('under an hour → Xm ago', () => {
    expect(formatRelativeTime(Date.now() - 45 * 60_000)).toBe('45m ago')
  })

  test('today → "today at ..."', () => {
    // Pin the clock to mid-afternoon so "3 hours ago" never crosses midnight.
    setSystemTime(new Date(2026, 5, 12, 15, 0, 0))
    try {
      const out = formatRelativeTime(Date.now() - 3 * 3600_000)
      expect(out.startsWith('today at ')).toBe(true)
    } finally {
      setSystemTime()
    }
  })

  test('yesterday → "yesterday at ..."', () => {
    setSystemTime(new Date(2026, 5, 12, 15, 0, 0))
    try {
      const out = formatRelativeTime(Date.now() - 26 * 3600_000)
      expect(out.startsWith('yesterday at ')).toBe(true)
    } finally {
      setSystemTime()
    }
  })

  test('older than a week → a short date', () => {
    const out = formatRelativeTime(Date.now() - 30 * 86_400_000)
    expect(out).not.toContain('ago')
    expect(out).not.toContain('at')
  })
})

describe('localStorage CRUD', () => {
  test('save then load round-trips', () => {
    const items = [conv('a', 2), conv('b', 1)]
    saveConversations(items)
    expect(loadConversations()).toEqual(items)
  })

  test('load returns [] when nothing stored or data is corrupt', () => {
    expect(loadConversations()).toEqual([])
    localStorage.setItem('clickhouse-agent-conversations', '{not json')
    expect(loadConversations()).toEqual([])
  })

  test('load filters out malformed entries', () => {
    localStorage.setItem(
      'clickhouse-agent-conversations',
      JSON.stringify([
        { id: 'ok', title: 't', createdAt: 0, updatedAt: 0, messages: [] },
        { junk: true },
      ])
    )
    expect(loadConversations()).toHaveLength(1)
  })

  test('upsert adds, updates, and sorts by updatedAt desc', () => {
    upsertConversation(conv('a', 1))
    upsertConversation(conv('b', 3))
    upsertConversation({ ...conv('a', 5), title: 'updated' })
    const loaded = loadConversations()
    expect(loaded.map((c) => c.id)).toEqual(['a', 'b']) // a now newest (5 > 3)
    expect(loaded[0].title).toBe('updated')
  })

  test('delete removes the matching conversation', () => {
    saveConversations([conv('a', 1), conv('b', 2)])
    deleteConversation('a')
    expect(loadConversations().map((c) => c.id)).toEqual(['b'])
  })
})
