'use client'

/**
 * useFollowUps Hook
 *
 * On-demand fetch of AI-generated follow-up question suggestions for a
 * conversation. Follow-ups are only produced by the AgentState backend; for any
 * other backend the endpoint returns 501, which this hook treats as "not
 * supported" (empty list, no error) rather than a failure.
 */

import type { ApiResponse } from '@/lib/api/types'

import { useCallback, useState } from 'react'
import { apiFetch } from '@/lib/swr/api-fetch'

interface FollowUpsData {
  questions: string[]
}

export interface UseFollowUpsResult {
  questions: string[]
  /** Trigger a fetch on demand. Resolves to the fetched questions. */
  fetchFollowUps: () => Promise<string[]>
  isLoading: boolean
  error: Error | null
}

/**
 * Returns follow-up suggestions for `conversationId`, fetched on demand via
 * {@link UseFollowUpsResult.fetchFollowUps}.
 *
 * @param conversationId - Server-side conversation id, or `null`/`undefined`
 *   when no conversation is active (fetching is then a no-op).
 */
export function useFollowUps(
  conversationId: string | null | undefined
): UseFollowUpsResult {
  const [questions, setQuestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchFollowUps = useCallback(async (): Promise<string[]> => {
    if (!conversationId) return []

    setIsLoading(true)
    setError(null)

    try {
      const response = await apiFetch(
        `/api/v1/conversations/${encodeURIComponent(conversationId)}/follow-ups`
      )

      // 501 = backend does not support follow-ups. Treat as "not supported":
      // clear questions, surface no error so we never toast.
      if (response.status === 501) {
        setQuestions([])
        return []
      }

      if (!response.ok) {
        throw new Error('Failed to fetch follow-up suggestions')
      }

      const json = (await response.json()) as ApiResponse<FollowUpsData>
      if (!json.success || !json.data) {
        throw new Error('Malformed follow-up suggestions response')
      }

      const next = Array.isArray(json.data.questions) ? json.data.questions : []
      setQuestions(next)
      return next
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)))
      setQuestions([])
      return []
    } finally {
      setIsLoading(false)
    }
  }, [conversationId])

  return { questions, fetchFollowUps, isLoading, error }
}
