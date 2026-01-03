'use client'

import { useCallback } from 'react'

import { useHostId } from './use-host'

type ActionType = 'killQuery' | 'optimizeTable' | 'querySettings'

interface ActionResult {
  success: boolean
  message: string
  data?: unknown
}

interface ActionRequest {
  action: ActionType
  params: Record<string, unknown>
}

interface ErrorResponse {
  error?: { message?: string }
}

export function useActions() {
  const hostId = useHostId()

  const executeAction = useCallback(
    async (request: ActionRequest): Promise<ActionResult> => {
      try {
        const response = await fetch(`/api/v1/actions?hostId=${hostId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          const errorData = (await response
            .json()
            .catch(() => ({}))) as ErrorResponse
          return {
            success: false,
            message:
              errorData?.error?.message ||
              `Action failed with status ${response.status}`,
          }
        }

        return await response.json()
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        }
      }
    },
    [hostId]
  )

  const killQuery = useCallback(
    async (queryId: string): Promise<ActionResult> => {
      return executeAction({
        action: 'killQuery',
        params: { queryId },
      })
    },
    [executeAction]
  )

  const optimizeTable = useCallback(
    async (table: string): Promise<ActionResult> => {
      return executeAction({
        action: 'optimizeTable',
        params: { table },
      })
    },
    [executeAction]
  )

  const querySettings = useCallback(
    async (queryId: string): Promise<ActionResult> => {
      return executeAction({
        action: 'querySettings',
        params: { queryId },
      })
    },
    [executeAction]
  )

  return {
    killQuery,
    optimizeTable,
    querySettings,
    executeAction,
  }
}
