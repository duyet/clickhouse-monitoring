import { mockFetchData } from './shared-mocks'
import { describe, expect, test } from 'bun:test'

let zookeeperAvailable = true

// Use the shared `mockFetchData` (which mocks `@chm/clickhouse-client`) instead
// of mocking `../helpers` directly. The real `helpers.readOnlyQuery` unwraps
// `{ data, error }` and throws on error, so routing here mirrors ClickHouse.
// This keeps the suite-global mock single-sourced and avoids contamination.
function setupContextMock() {
  mockFetchData.mockImplementation(async ({ query }: { query: string }) => {
    if (query.includes('version()')) {
      return {
        data: [
          {
            version: '24.3.1',
            uptime_seconds: 12345,
            current_user: 'monitor',
            timezone: 'UTC',
          },
        ],
        error: null,
      }
    }
    if (query.includes('asynchronous_metrics')) {
      return {
        data: [
          { metric: 'OSMemoryTotal', value: 16000000000 },
          { metric: 'OSMemoryAvailable', value: 8000000000 },
          { metric: 'MemoryTracking', value: 4000000000 },
        ],
        error: null,
      }
    }
    if (query.includes('system.settings') && query.includes('changed = 1')) {
      return {
        data: [
          { name: 'max_threads', value: '8' },
          { name: 'max_memory_usage', value: '10000000000' },
        ],
        error: null,
      }
    }
    if (query.includes('system.zookeeper')) {
      if (!zookeeperAvailable) {
        return {
          data: null,
          error: { message: 'Unknown table system.zookeeper' },
        }
      }
      return { data: [{ c: 3 }], error: null }
    }
    return { data: [], error: null }
  })
}

const { createContextTools } = await import('../context-tools')

type Execute = (input: unknown) => Promise<Record<string, unknown>>

function getExecute(toolCount = 80) {
  const tools = createContextTools(0, { toolCount }) as any
  return (tools.get_context as unknown as { execute: Execute }).execute
}

describe('get_context', () => {
  test('returns a runtime context snapshot', async () => {
    zookeeperAvailable = true
    setupContextMock()
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
    setupContextMock()
    const result = await getExecute()({ hostId: 0 })
    expect((result.keeper as Record<string, unknown>).configured).toBe(true)
  })

  test('reports keeper as not configured when system.zookeeper is missing', async () => {
    zookeeperAvailable = false
    setupContextMock()
    const result = await getExecute()({ hostId: 0 })
    expect((result.keeper as Record<string, unknown>).configured).toBe(false)
  })

  test('includes capabilities (tool count, skills, workflows)', async () => {
    zookeeperAvailable = true
    setupContextMock()
    const result = await getExecute(99)({ hostId: 0 })
    const caps = result.capabilities as Record<string, unknown>
    expect(caps.toolCount).toBe(99)
    expect(Array.isArray(caps.skills)).toBe(true)
    expect((caps.skills as string[]).length).toBeGreaterThan(0)
    expect(caps.workflows).toContain('incident-investigation')
  })
})
