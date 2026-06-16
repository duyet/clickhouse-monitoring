import { mockFetchData } from './shared-mocks'
import { describe, expect, test } from 'bun:test'

const writtenQueries: Array<{
  query: string
  query_params?: Record<string, unknown>
  hostId: number
}> = []

const { createControlTools } = await import('../control-tools')

describe('createControlTools', () => {
  test('creates kill_query, optimize_table, kill_mutation tools', () => {
    const tools = createControlTools(0) as any
    expect(tools.kill_query).toBeDefined()
    expect(tools.optimize_table).toBeDefined()
    expect(tools.kill_mutation).toBeDefined()
  })

  test('kill_query sends KILL QUERY with queryId', async () => {
    writtenQueries.length = 0
    mockFetchData.mockImplementation(
      async (opts: {
        query: string
        query_params?: Record<string, unknown>
        hostId: number
      }) => {
        writtenQueries.push(opts)
        return { data: { status: 'ok' }, error: null }
      }
    )

    const tools = createControlTools(0) as any
    const result = await tools.kill_query.execute({ queryId: 'abc-123' })

    expect(result).toEqual({ status: 'ok' })
    expect(writtenQueries[0].query).toContain('KILL QUERY')
    expect(writtenQueries[0].query_params).toEqual({ queryId: 'abc-123' })
  })

  test('kill_query uses hostId override', async () => {
    writtenQueries.length = 0
    mockFetchData.mockImplementation(
      async (opts: {
        query: string
        query_params?: Record<string, unknown>
        hostId: number
      }) => {
        writtenQueries.push(opts)
        return { data: { status: 'ok' }, error: null }
      }
    )

    const tools = createControlTools(0) as any
    await tools.kill_query.execute({ queryId: 'q1', hostId: 3 })

    expect(writtenQueries[0].hostId).toBe(3)
  })

  test('optimize_table sends OPTIMIZE TABLE without FINAL', async () => {
    writtenQueries.length = 0
    mockFetchData.mockImplementation(
      async (opts: {
        query: string
        query_params?: Record<string, unknown>
        hostId: number
      }) => {
        writtenQueries.push(opts)
        return { data: { status: 'ok' }, error: null }
      }
    )

    const tools = createControlTools(0) as any
    const result = await tools.optimize_table.execute({
      database: 'my_db',
      table: 'my_table',
    })

    expect(result).toEqual({ status: 'ok' })
    expect(writtenQueries[0].query).toBe('OPTIMIZE TABLE `my_db`.`my_table`')
  })

  test('optimize_table sends OPTIMIZE TABLE with FINAL', async () => {
    writtenQueries.length = 0
    mockFetchData.mockImplementation(
      async (opts: {
        query: string
        query_params?: Record<string, unknown>
        hostId: number
      }) => {
        writtenQueries.push(opts)
        return { data: { status: 'ok' }, error: null }
      }
    )

    const tools = createControlTools(0) as any
    await tools.optimize_table.execute({
      database: 'my_db',
      table: 'my_table',
      final: true,
    })

    expect(writtenQueries[0].query).toBe(
      'OPTIMIZE TABLE `my_db`.`my_table` FINAL'
    )
  })

  test('optimize_table rejects invalid table identifier', async () => {
    const tools = createControlTools(0) as any
    expect(
      tools.optimize_table.execute({
        database: 'db; DROP TABLE',
        table: 't',
      })
    ).rejects.toThrow('Invalid table identifier')
  })

  test('optimize_table rejects invalid database identifier', async () => {
    const tools = createControlTools(0) as any
    expect(
      tools.optimize_table.execute({
        database: 'valid_db',
        table: '123invalid',
      })
    ).rejects.toThrow('Invalid table identifier')
  })

  test('kill_mutation sends KILL MUTATION with params', async () => {
    writtenQueries.length = 0
    mockFetchData.mockImplementation(
      async (opts: {
        query: string
        query_params?: Record<string, unknown>
        hostId: number
      }) => {
        writtenQueries.push(opts)
        return { data: { status: 'ok' }, error: null }
      }
    )

    const tools = createControlTools(0) as any
    const result = await tools.kill_mutation.execute({
      database: 'analytics',
      table: 'events',
      mutationId: 'mutation_001',
    })

    expect(result).toEqual({ status: 'ok' })
    expect(writtenQueries[0].query).toContain('KILL MUTATION')
    expect(writtenQueries[0].query_params).toEqual({
      database: 'analytics',
      table: 'events',
      mutationId: 'mutation_001',
    })
  })

  test('kill_mutation uses default hostId when no override', async () => {
    writtenQueries.length = 0
    mockFetchData.mockImplementation(
      async (opts: {
        query: string
        query_params?: Record<string, unknown>
        hostId: number
      }) => {
        writtenQueries.push(opts)
        return { data: { status: 'ok' }, error: null }
      }
    )

    const tools = createControlTools(5) as any
    await tools.kill_mutation.execute({
      database: 'db',
      table: 'tbl',
      mutationId: 'm1',
    })

    expect(writtenQueries[0].hostId).toBe(5)
  })
})
