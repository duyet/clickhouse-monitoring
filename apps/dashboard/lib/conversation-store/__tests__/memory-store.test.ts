import { MemoryStore } from '../memory-store'
import { beforeEach, describe, expect, test } from 'bun:test'

describe('MemoryStore contract', () => {
  beforeEach(() => {
    MemoryStore.clearAll()
  })

  test('upserts, lists, gets, and deletes conversations by user', async () => {
    const store = new MemoryStore()
    const now = Date.now()

    await store.upsert({
      id: 'thread-1',
      userId: 'user-1',
      title: 'Thread 1',
      messages: [
        { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'hi' }] },
      ],
      messageCount: 1,
      createdAt: now,
      updatedAt: now,
    })

    expect(await store.list('user-2')).toEqual([])
    expect(await store.list('user-1')).toHaveLength(1)
    expect(await store.get('user-1', 'thread-1')).toMatchObject({
      id: 'thread-1',
      userId: 'user-1',
      messageCount: 1,
    })

    await store.delete('user-1', 'thread-1')
    expect(await store.get('user-1', 'thread-1')).toBeNull()
  })
})
