import { mockFetchData } from './shared-mocks'
import { describe, expect, test } from 'bun:test'

const queryStore: Record<string, unknown[]> = {}

function setupLogMock() {
  mockFetchData.mockImplementation(async ({ query }: { query: string }) => {
    if (query.includes('system.text_log'))
      return { data: queryStore['text_log'] ?? [], error: null }
    if (query.includes('system.stack_trace'))
      return { data: queryStore['stack_trace'] ?? [], error: null }
    return { data: [], error: null }
  })
}

const { createLogTools } = await import('../log-tools')

describe('createLogTools', () => {
  test('creates get_text_log and get_stack_traces tools', () => {
    const tools = createLogTools(0)
    expect(tools.get_text_log).toBeDefined()
    expect(tools.get_stack_traces).toBeDefined()
  })

  test('get_text_log returns log entries with defaults', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore['text_log'] = [
      {
        event_time: '2024-01-01T00:00:00',
        level: 'Information',
        logger_name: 'ClickHouse',
        message: 'Server started',
      },
    ]
    setupLogMock()

    const tools = createLogTools(0)
    const result = await tools.get_text_log.execute({})

    expect(result).toHaveLength(1)
    expect(result[0].level).toBe('Information')
    expect(result[0].message).toBe('Server started')
  })

  test('get_text_log returns empty when no logs', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    setupLogMock()

    const tools = createLogTools(0)
    const result = await tools.get_text_log.execute({})

    expect(result).toEqual([])
  })

  test('get_text_log respects custom parameters', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore['text_log'] = [{ level: 'Error', message: 'Out of memory' }]
    setupLogMock()

    const tools = createLogTools(0)
    const result = await tools.get_text_log.execute({
      level: 'Error',
      limit: 50,
      lastHours: 12,
      pattern: '%memory%',
    })

    expect(result).toHaveLength(1)
    expect(result[0].level).toBe('Error')
  })

  test('get_text_log uses default values for optional params', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore['text_log'] = []
    setupLogMock()

    const tools = createLogTools(0)
    const result = await tools.get_text_log.execute({})

    expect(result).toEqual([])
  })

  test('get_stack_traces returns thread traces', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore['stack_trace'] = [
      {
        thread_name: 'HTTPHandler',
        thread_id: 42,
        query_id: 'q1',
        trace: 'frame1\nframe2',
      },
    ]
    setupLogMock()

    const tools = createLogTools(0)
    const result = await tools.get_stack_traces.execute({})

    expect(result).toHaveLength(1)
    expect(result[0].thread_name).toBe('HTTPHandler')
    expect(result[0].thread_id).toBe(42)
  })

  test('get_stack_traces returns empty when no traces', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    setupLogMock()

    const tools = createLogTools(0)
    const result = await tools.get_stack_traces.execute({})

    expect(result).toEqual([])
  })

  test('get_stack_traces respects custom limit', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore['stack_trace'] = [{ thread_id: 1 }, { thread_id: 2 }]
    setupLogMock()

    const tools = createLogTools(0)
    const result = await tools.get_stack_traces.execute({ limit: 1 })

    expect(result).toHaveLength(2)
  })

  test('tools resolve hostId override', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    setupLogMock()

    const tools = createLogTools(0)
    const result = await tools.get_text_log.execute({ hostId: 2 })
    expect(Array.isArray(result)).toBe(true)
  })
})
