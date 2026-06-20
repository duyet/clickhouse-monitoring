/**
 * Tests for the AgentState branch of {@link resolveStore}.
 *
 * resolveStore() consults several collaborators before reaching a backend:
 *   1. `featureFlags.conversationDb()` — gated on a Vite env flag + Clerk auth.
 *   2. `process.env.CONVERSATION_STORE_BACKEND` / `AGENTSTATE_API_KEY`.
 *   3. `getPlatformBindings().getD1Database(...)` for the D1 fallback.
 *
 * To isolate the AgentState branch in a unit test we mock:
 *   - `@/lib/feature-flags` so conversationDb() returns true (avoids needing
 *     import.meta.env + Clerk).
 *   - `@chm/platform` so getD1Database() returns undefined (no D1 binding).
 *   - `@agentstate/sdk` with a minimal fake so `new AgentStateStore(...)` works
 *     without a real network client.
 *
 * We then exercise the forced-`agentstate` backend: missing key throws, present
 * key returns an AgentStateStore. Env is set/reset around each test.
 */

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

// ── Mocks (process-global; registered before importing resolve-store). ──
mock.module('@/lib/feature-flags', () => ({
  featureFlags: {
    conversationDb: () => true,
  },
}))

mock.module('@chm/platform', () => ({
  getPlatformBindings: () => ({
    // No D1 binding available — pushes resolution past the D1 branch.
    getD1Database: () => undefined,
  }),
}))

class FakeAgentStateError extends Error {
  code: string
  status: number
  constructor(message: string, code: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

class FakeAgentState {}

mock.module('@agentstate/sdk', () => ({
  AgentState: FakeAgentState,
  AgentStateError: FakeAgentStateError,
}))

const { resolveStore } = await import('./resolve-store')
const { AgentStateStore } = await import('./agentstate-store')
const { ConversationStoreError } = await import('./types')

// ── Env snapshot/restore so tests don't leak state. ──
const ENV_KEYS = [
  'CONVERSATION_STORE_BACKEND',
  'AGENTSTATE_API_KEY',
  'AGENTSTATE_BASE_URL',
  'AGENTSTATE_AI_ENRICH',
  'DATABASE_URL',
] as const

let snapshot: Record<string, string | undefined> = {}

beforeEach(() => {
  snapshot = {}
  for (const key of ENV_KEYS) {
    snapshot[key] = process.env[key]
    delete process.env[key]
  }
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (snapshot[key] === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = snapshot[key]
    }
  }
})

describe('resolveStore — AgentState branch', () => {
  test('forcing agentstate without AGENTSTATE_API_KEY throws VALIDATION_ERROR', async () => {
    process.env.CONVERSATION_STORE_BACKEND = 'agentstate'
    // No AGENTSTATE_API_KEY set.
    await expect(resolveStore()).rejects.toBeInstanceOf(ConversationStoreError)
    await expect(resolveStore()).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    })
  })

  test('forcing agentstate with a key returns an AgentStateStore', async () => {
    process.env.CONVERSATION_STORE_BACKEND = 'agentstate'
    process.env.AGENTSTATE_API_KEY = 'as_live_key'
    const store = await resolveStore()
    expect(store).toBeInstanceOf(AgentStateStore)
  })

  test('an API key alone (no forced backend) returns an AgentStateStore', async () => {
    process.env.AGENTSTATE_API_KEY = 'as_live_key'
    const store = await resolveStore()
    expect(store).toBeInstanceOf(AgentStateStore)
  })

  test('a key present but another backend forced does NOT pick AgentState', async () => {
    process.env.AGENTSTATE_API_KEY = 'as_live_key'
    process.env.CONVERSATION_STORE_BACKEND = 'memory'
    const store = await resolveStore()
    expect(store).not.toBeInstanceOf(AgentStateStore)
  })
})
