/**
 * useToolConfig Hook
 *
 * Manages enabled/disabled state for individual MCP tools.
 * Persists selections to localStorage so preferences survive page reloads.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'

const TOOL_CONFIG_STORAGE_KEY = 'clickhouse-monitor-tool-config'

type ToolConfigStorage = {
  /** Map of tool name → enabled boolean. Absent means enabled (default). */
  disabled: string[]
}

function readStorage(): ToolConfigStorage {
  if (typeof window === 'undefined') return { disabled: [] }
  try {
    const raw = localStorage.getItem(TOOL_CONFIG_STORAGE_KEY)
    if (!raw) return { disabled: [] }
    const parsed = JSON.parse(raw) as ToolConfigStorage
    return { disabled: Array.isArray(parsed.disabled) ? parsed.disabled : [] }
  } catch {
    return { disabled: [] }
  }
}

function writeStorage(config: ToolConfigStorage): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(TOOL_CONFIG_STORAGE_KEY, JSON.stringify(config))
  } catch {
    // localStorage may be disabled
  }
}

export interface UseToolConfigResult {
  /** Check if a tool is enabled (defaults to true for unknown tools) */
  isToolEnabled: (toolName: string) => boolean
  /** Toggle a tool on/off */
  toggleTool: (toolName: string) => void
  /** Enable a tool */
  enableTool: (toolName: string) => void
  /** Disable a tool */
  disableTool: (toolName: string) => void
  /** Enable all tools */
  enableAll: () => void
  /** Get the list of disabled tool names */
  disabledTools: readonly string[]
  /** Get list of enabled tool names from a given set of all tool names */
  getEnabledTools: (allToolNames: string[]) => string[]
}

/**
 * Hook for managing which MCP tools are active.
 *
 * By default all tools are enabled. Users can disable individual tools
 * from the sidebar; the state persists in localStorage.
 */
export function useToolConfig(): UseToolConfigResult {
  const [disabledTools, setDisabledTools] = useState<string[]>(() => {
    return readStorage().disabled
  })

  // Sync to localStorage whenever the disabled list changes
  useEffect(() => {
    writeStorage({ disabled: disabledTools })
  }, [disabledTools])

  const isToolEnabled = useCallback(
    (toolName: string) => !disabledTools.includes(toolName),
    [disabledTools]
  )

  const toggleTool = useCallback((toolName: string) => {
    setDisabledTools((prev) =>
      prev.includes(toolName)
        ? prev.filter((t) => t !== toolName)
        : [...prev, toolName]
    )
  }, [])

  const enableTool = useCallback((toolName: string) => {
    setDisabledTools((prev) => prev.filter((t) => t !== toolName))
  }, [])

  const disableTool = useCallback((toolName: string) => {
    setDisabledTools((prev) =>
      prev.includes(toolName) ? prev : [...prev, toolName]
    )
  }, [])

  const enableAll = useCallback(() => {
    setDisabledTools([])
  }, [])

  const getEnabledTools = useCallback(
    (allToolNames: string[]) =>
      allToolNames.filter((name) => !disabledTools.includes(name)),
    [disabledTools]
  )

  return {
    isToolEnabled,
    toggleTool,
    enableTool,
    disableTool,
    enableAll,
    disabledTools,
    getEnabledTools,
  }
}
