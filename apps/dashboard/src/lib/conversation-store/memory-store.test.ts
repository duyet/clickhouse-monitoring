/**
 * Tests for {@link MemoryStore}.
 *
 * MemoryStore is a Map-based store keyed by userId, backed by a module-level
 * singleton. These tests verify: updatedAt-DESC ordering, in-place upsert,
 * get/delete semantics, per-user isolation, and the static reset/count helpers.
 *
 * The module-level `storage` Map persists across tests in bun's shared process,
 * so we MemoryStore.clearAll() before each test to avoid cross-test leakage.
 */

import type { StoredConversation } from './types'

import { MemoryStore } from './memory-store'
import { beforeEach, describe, expect, test } from 'bun:test'

function makeConv(
  overrides: Partial<StoredConversation> &
    Pick<StoredConversation, 'id' | 'userId'>
): StoredConversation {
  return {
    title: 'untitled',
    messageCount: 0,
    createdAt: 1,
    updatedAt: 1,
    messages: [],
    ...overrides,
  }
}

describe('MemoryStore', () => {
  const store = new MemoryStore()

  beforeEach(() => {
    MemoryStore.clearAll()
  })

  test('list returns conversations sorted by updatedAt DESC', async () => {
    await store.upsert(makeConv({ id: 'a', userId: 'u1', updatedAt: 100 }))
    await store.upsert(makeConv({ id: 'b', userId: 'u1', updatedAt: 300 }))
    await store.upsert(makeConv({ id: 'c', userId: 'u1', updatedAt: 200 }))

    const list = await store.list('u1')
    expect(list.map((c) => c.id)).toEqual(['b', 'c', 'a'])
  })

  test('list omits messages (metadata only) and honors limit', async () => {
    await store.upsert(
      makeConv({ id: 'a', userId: 'u1', updatedAt: 100, messageCount: 2 })
    )
    await store.upsert(makeConv({ id: 'b', userId: 'u1', updatedAt: 200 }))

    const list = await store.list('u1', 1)
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe('b')
    expect('messages' in list[0]).toBe(false)
  })

  test('upsert updates an existing conversation in place (no duplicate)', async () => {
    await store.upsert(makeConv({ id: 'a', userId: 'u1', title: 'first' }))
    await store.upsert(
      makeConv({ id: 'a', userId: 'u1', title: 'second', updatedAt: 5 })
    )

    const list = await store.list('u1')
    expect(list).toHaveLength(1)
    expect(list[0].title).toBe('second')
  })

  test('get returns the conversation with messages, or null when unknown', async () => {
    await store.upsert(makeConv({ id: 'a', userId: 'u1' }))
    const found = await store.get('u1', 'a')
    expect(found?.id).toBe('a')
    expect(found?.messages).toEqual([])
    expect(await store.get('u1', 'missing')).toBeNull()
  })

  test('delete removes only the target conversation', async () => {
    await store.upsert(makeConv({ id: 'a', userId: 'u1' }))
    await store.upsert(makeConv({ id: 'b', userId: 'u1' }))

    await store.delete('u1', 'a')
    const list = await store.list('u1')
    expect(list.map((c) => c.id)).toEqual(['b'])
  })

  test('deleteAll clears one user without touching others', async () => {
    await store.upsert(makeConv({ id: 'a', userId: 'u1' }))
    await store.upsert(makeConv({ id: 'b', userId: 'u2' }))

    await store.deleteAll('u1')
    expect(await store.list('u1')).toEqual([])
    expect((await store.list('u2')).map((c) => c.id)).toEqual(['b'])
  })

  test('conversations are isolated per user', async () => {
    await store.upsert(makeConv({ id: 'a', userId: 'u1' }))
    await store.upsert(makeConv({ id: 'a', userId: 'u2' }))

    expect((await store.list('u1')).map((c) => c.id)).toEqual(['a'])
    expect(MemoryStore.getUserIds().sort()).toEqual(['u1', 'u2'])
  })

  test('clearAll resets global state; getGlobalCount reflects totals', async () => {
    await store.upsert(makeConv({ id: 'a', userId: 'u1' }))
    await store.upsert(makeConv({ id: 'b', userId: 'u2' }))
    expect(MemoryStore.getGlobalCount()).toBe(2)

    MemoryStore.clearAll()
    expect(MemoryStore.getGlobalCount()).toBe(0)
  })
})
