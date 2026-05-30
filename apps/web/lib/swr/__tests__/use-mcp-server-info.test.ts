/**
 * Tests for use-mcp-server-info.ts — SWR hook for MCP server info.
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test'

const mockUseSWR = mock(() => ({
  data: undefined,
  isLoading: false,
  error: undefined,
  mutate: mock(() => Promise.resolve()),
}))

mock.module('swr', () => ({
  default: mockUseSWR,
}))

import { mockApiFetch } from './shared-mocks'

mock.module('../config', () => ({
  swrConfig: {
    once: {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  },
}))

// Mock @chm/mcp-server/data types (type-only import, just needs module to exist)
mock.module('@chm/mcp-server/data', () => ({
  McpServerInfo: {},
  McpTool: {},
  McpResource: {},
  McpToolCategory: {},
  McpToolParam: {},
}))

import { type ApiMcpServerInfo, useMcpServerInfo } from '../use-mcp-server-info'

describe('useMcpServerInfo', () => {
  beforeEach(() => {
    mockUseSWR.mockReset()
    mockUseSWR.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
      mutate: mock(() => Promise.resolve()),
    })
  })

  it('calls useSWR with /api/v1/mcp/info key', () => {
    useMcpServerInfo()

    expect(mockUseSWR).toHaveBeenCalledTimes(1)
    const [key] = mockUseSWR.mock.calls[0]
    expect(key).toBe('/api/v1/mcp/info')
  })

  it('returns undefined data initially', () => {
    const result = useMcpServerInfo()
    expect(result.data).toBeUndefined()
    expect(result.isLoading).toBe(false)
  })

  it('returns MCP server info from SWR', () => {
    const serverInfo: ApiMcpServerInfo = {
      name: 'ClickHouse MCP',
      version: '1.0.0',
      description: 'MCP server for ClickHouse monitoring',
      tools: [
        {
          name: 'query',
          description: 'Execute a query',
          category: 'query' as any,
          params: [],
        },
      ],
      resources: [],
    }

    mockUseSWR.mockReturnValue({
      data: serverInfo,
      isLoading: false,
      error: undefined,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useMcpServerInfo()
    expect(result.data).toEqual(serverInfo)
    expect(result.data?.name).toBe('ClickHouse MCP')
    expect(result.data?.tools).toHaveLength(1)
  })

  it('returns loading state', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useMcpServerInfo()
    expect(result.isLoading).toBe(true)
  })

  it('returns error from SWR', () => {
    const error = new Error('MCP unavailable')
    mockUseSWR.mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useMcpServerInfo()
    expect(result.error).toBe(error)
  })

  it('retry function calls mutate', () => {
    const mockMutate = mock(() => Promise.resolve())
    mockUseSWR.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
      mutate: mockMutate,
    })

    const result = useMcpServerInfo()
    result.retry()
    expect(mockMutate).toHaveBeenCalledTimes(1)
  })

  it('configures SWR with long dedupingInterval', () => {
    useMcpServerInfo()

    const [, , options] = mockUseSWR.mock.calls[0]
    expect(options.dedupingInterval).toBe(300_000) // 5 minutes
    expect(options.shouldRetryOnError).toBe(true)
    expect(options.errorRetryCount).toBe(3)
  })

  it('merges swrConfig.once preset', () => {
    useMcpServerInfo()

    const [, , options] = mockUseSWR.mock.calls[0]
    expect(options.revalidateOnFocus).toBe(false)
    expect(options.revalidateOnReconnect).toBe(false)
    expect(options.revalidateIfStale).toBe(false)
  })
})
