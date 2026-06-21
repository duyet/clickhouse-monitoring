import type { McpConfigStorage } from './use-mcp-config'

import {
  toMcpServers,
  withAddedServer,
  withRemovedServer,
  withServerEnabled,
} from './use-mcp-config'
import { describe, expect, test } from 'bun:test'

const base = (): McpConfigStorage => ({ disabled: [], customServers: [] })

describe('withServerEnabled', () => {
  test('disabling adds the id to the disabled list', () => {
    const next = withServerEnabled(base(), 'srv', false)
    expect(next.disabled).toEqual(['srv'])
  })

  test('disabling is idempotent (no duplicate ids)', () => {
    const once = withServerEnabled(base(), 'srv', false)
    const twice = withServerEnabled(once, 'srv', false)
    expect(twice.disabled).toEqual(['srv'])
  })

  test('enabling removes the id from the disabled list', () => {
    const disabled: McpConfigStorage = { disabled: ['srv'], customServers: [] }
    const next = withServerEnabled(disabled, 'srv', true)
    expect(next.disabled).toEqual([])
  })

  test('does not mutate the input config', () => {
    const input = base()
    withServerEnabled(input, 'srv', false)
    expect(input.disabled).toEqual([])
  })
})

describe('withAddedServer', () => {
  test('appends a server with a generated id', () => {
    const { config, created } = withAddedServer(base(), {
      name: 'remote',
      endpoint: 'https://example.com/mcp',
    })
    expect(created.id).toBeTruthy()
    expect(created.name).toBe('remote')
    expect(created.endpoint).toBe('https://example.com/mcp')
    expect(config.customServers).toEqual([created])
  })

  test('generates unique ids for successive servers', () => {
    const first = withAddedServer(base(), { name: 'a', endpoint: 'a' })
    const second = withAddedServer(first.config, { name: 'b', endpoint: 'b' })
    expect(second.created.id).not.toBe(first.created.id)
    expect(second.config.customServers).toHaveLength(2)
  })
})

describe('withRemovedServer', () => {
  test('removes the custom server and its toggle override', () => {
    const start: McpConfigStorage = {
      disabled: ['srv', 'other'],
      customServers: [
        { id: 'srv', name: 'a', endpoint: 'a' },
        { id: 'other', name: 'b', endpoint: 'b' },
      ],
    }
    const next = withRemovedServer(start, 'srv')
    expect(next.customServers.map((s) => s.id)).toEqual(['other'])
    expect(next.disabled).toEqual(['other'])
  })
})

describe('toMcpServers', () => {
  test('maps custom servers to McpServer rows with enabled state', () => {
    const servers = toMcpServers(
      [
        { id: 'on', name: 'on', endpoint: 'a' },
        { id: 'off', name: 'off', endpoint: 'b' },
      ],
      (id) => id !== 'off'
    )
    expect(servers).toEqual([
      {
        id: 'on',
        name: 'on',
        endpoint: 'a',
        toolCount: 0,
        builtin: false,
        enabled: true,
        status: 'unconfigured',
      },
      {
        id: 'off',
        name: 'off',
        endpoint: 'b',
        toolCount: 0,
        builtin: false,
        enabled: false,
        status: 'unconfigured',
      },
    ])
  })
})
