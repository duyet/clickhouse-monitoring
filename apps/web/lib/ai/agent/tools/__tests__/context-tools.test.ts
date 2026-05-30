import { describe, expect, mock, test } from 'bun:test'
import { z } from 'zod/v3'

mock.module('server-only', () => ({}))

let zookeeperAvailable = true

// Mock the direct dependency (`./helpers`) rather than the deep
// `@chm/clickhouse-client`. helpers.readOnlyQuery returns the data array
// directly and throws on error, and mocking it here is immune to the suite-wide
// mock-ordering leak that freezes the clickhouse-client binding.
mock.module('../helpers', () => ({
  hostIdSchema: z.number().int().min(0).optional(),
  resolveHostId: (toolHostId: number | undefined, defaultHostId: number) =>
    toolHostId ?? defaultHostId,
  readOnlyQuery: mock(async ({ query }: { query: string }) => {
    if (query.includes('version()')) {
      return [
        {
          version: '24.3.1',
          uptime_seconds: 12345,
          current_user: 'monitor',
          timezone: 'UTC',
        },
      ]
    }
    if (query.includes('asynchronous_metrics')) {
      return [
        { metric: 'OSMemoryTotal', value: 16000000000 },
        { metric: 'OSMemoryAvailable', value: 8000000000 },
        { metric: 'MemoryTracking', value: 4000000000 },
      ]
    }
    if (query.includes('system.settings') && query.includes('changed = 1')) {
      return [
        { name: 'max_threads', value: '8' },
        { name: 'max_memory_usage', value: '10000000000' },
      ]
    }
    if (query.includes('system.zookeeper')) {
      if (!zookeeperAvailable) {
        throw new Error('Unknown table system.zookeeper')
      }
      return [{ c: 3 }]
    }
    return []
  }),
}))

const { createContextTools } = await import('../context-tools')

type Execute = (input: unknown) => Promise<Record<string, unknown>>

function getExecute(toolCount = 80) {
  const tools = createContextTools(0, { toolCount })
  return (tools.get_context as unknown as { execute: Execute }).execute
}

describe('get_context', () => {
  test('returns a runtime context snapshot', async () => {
    zookeeperAvailable = true
    const result = await getExecute(82)({ hostId: 0 })

    expect(result.type).toBe('agent_context')
    expect(result.hostId).toBe(0)

    const server = result.server as Record<string, unknown>
    expect(server.version).toBe('24.3.1')
    expect(server.currentUser).toBe('monitor')

    const memory = result.memory as Record<string, unknown>
    expect(memory.osTotalBytes).toBe(16000000000)
    expect(memory.trackedBytes).toBe(4000000000)

    const settings = result.settings as Record<string, unknown>
    expect(settings.changedCount).toBe(2)
    expect(settings.notable).toContain('max_threads')
  })

  test('reports keeper as configured when system.zookeeper responds', async () => {
    zookeeperAvailable = true
    const result = await getExecute()({ hostId: 0 })
    expect((result.keeper as Record<string, unknown>).configured).toBe(true)
  })

  test('reports keeper as not configured when system.zookeeper is missing', async () => {
    zookeeperAvailable = false
    const result = await getExecute()({ hostId: 0 })
    expect((result.keeper as Record<string, unknown>).configured).toBe(false)
  })

  test('includes capabilities (tool count, skills, workflows)', async () => {
    zookeeperAvailable = true
    const result = await getExecute(99)({ hostId: 0 })
    const caps = result.capabilities as Record<string, unknown>
    expect(caps.toolCount).toBe(99)
    expect(Array.isArray(caps.skills)).toBe(true)
    expect((caps.skills as string[]).length).toBeGreaterThan(0)
    expect(caps.workflows).toContain('incident-investigation')
  })
})
