import { describe, expect, mock, test } from 'bun:test'

mock.module('server-only', () => ({}))

const queryStore: Record<string, unknown[]> = {}

mock.module('@chm/clickhouse-client', () => ({
  fetchData: async ({ query }: { query: string }) => {
    if (query.includes('system.processes'))
      return { data: queryStore['processes'] ?? [], error: null }
    if (query.includes('system.session_log'))
      return { data: queryStore['sessions'] ?? [], error: null }
    if (query.includes('system.users'))
      return { data: queryStore['users'] ?? [], error: null }
    if (query.includes('system.roles'))
      return { data: queryStore['roles'] ?? [], error: null }
    return { data: [], error: null }
  },
}))

mock.module('@chm/sql-builder', () => ({
  validateSqlQuery: () => {},
}))

const { createSecurityTools } = await import('../security-tools')

describe('createSecurityTools', () => {
  test('creates all security tools', () => {
    const tools = createSecurityTools(0)
    expect(tools.get_active_sessions).toBeDefined()
    expect(tools.get_login_attempts).toBeDefined()
    expect(tools.get_users_and_roles).toBeDefined()
  })

  test('get_active_sessions returns process data', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore['processes'] = [
      { query_id: 'q1', user: 'admin', elapsed: 5.2, read_rows: 1000 },
    ]

    const tools = createSecurityTools(0)
    const result = await tools.get_active_sessions.execute({})

    expect(result).toEqual([
      { query_id: 'q1', user: 'admin', elapsed: 5.2, read_rows: 1000 },
    ])
  })

  test('get_active_sessions returns empty array', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])

    const tools = createSecurityTools(0)
    const result = await tools.get_active_sessions.execute({})

    expect(result).toEqual([])
  })

  test('get_login_attempts queries session_log with defaults', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore['sessions'] = [
      { user: 'default', client_hostname: 'localhost', auth_type: 'password' },
    ]

    const tools = createSecurityTools(0)
    const result = await tools.get_login_attempts.execute({})

    expect(result).toHaveLength(1)
    expect(result[0].user).toBe('default')
  })

  test('get_login_attempts respects custom limit and lastHours', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore['sessions'] = [{ user: 'bob' }]

    const tools = createSecurityTools(0)
    const result = await tools.get_login_attempts.execute({
      limit: 10,
      lastHours: 48,
    })

    expect(result).toHaveLength(1)
  })

  test('get_users_and_roles returns both users and roles', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore['users'] = [{ name: 'default', storage: 'users.xml' }]
    queryStore['roles'] = [{ name: 'admin', storage: 'local directory' }]

    const tools = createSecurityTools(0)
    const result = await tools.get_users_and_roles.execute({})

    expect(result.users).toEqual([{ name: 'default', storage: 'users.xml' }])
    expect(result.roles).toEqual([
      { name: 'admin', storage: 'local directory' },
    ])
  })

  test('get_users_and_roles returns empty when no data', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])

    const tools = createSecurityTools(0)
    const result = await tools.get_users_and_roles.execute({})

    expect(result.users).toEqual([])
    expect(result.roles).toEqual([])
  })

  test('tools resolve hostId override', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    const tools = createSecurityTools(0)

    const result = await tools.get_active_sessions.execute({ hostId: 2 })
    expect(Array.isArray(result)).toBe(true)
  })
})
