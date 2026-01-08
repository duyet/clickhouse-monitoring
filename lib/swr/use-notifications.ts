/**
 * Notifications Hook
 *
 * Fetches notifications/alerts across all clusters via SWR with appropriate caching.
 * Uses a 30-second refresh interval for critical operational metrics.
 *
 * Notifications include:
 * - Readonly tables warnings across all clusters
 * - Future: replication issues, ZooKeeper problems, etc.
 *
 * Features:
 * - Filters out dismissed notifications (stored in localStorage)
 * - Provides dismiss functionality
 */

'use client'

import useSWR from 'swr'

import type { Notification } from '@/lib/notifications/dismissed-notifications'

import { useCallback, useMemo } from 'react'
import {
  dismissNotification as dismissNotificationUtil,
  filterActiveNotifications,
  getNotificationKey,
} from '@/lib/notifications/dismissed-notifications'
import { REFRESH_INTERVAL } from '@/lib/swr/config'

// Extended notification with required key for UI
export interface NotificationWithKey extends Omit<Notification, 'key'> {
  readonly key: string
}

interface NotificationsResult {
  readonly notifications: readonly NotificationWithKey[]
  readonly totalCount: number
  isLoading: boolean
  error?: Error
  /** Mutate function to manually refresh the data */
  refresh: () => void
  /** Dismiss a specific notification */
  dismiss: (notification: NotificationWithKey) => void
  /** Dismiss all current notifications */
  dismissAll: () => void
}

interface NotificationsResponse {
  success: boolean
  data: {
    notifications: readonly Notification[]
    totalCount: number
  }
  error?: { message: string }
}

/**
 * Fetches notifications across all clusters.
 *
 * Features:
 * - 30-second refresh interval (critical operational data)
 * - 15-second deduping to prevent duplicate requests
 * - Revalidates on focus (critical metrics should be fresh)
 * - Filters out dismissed notifications
 * - Returns empty array on error to prevent UI disruption
 *
 * @param hostId - The current host ID
 */
export function useNotifications(hostId: number): NotificationsResult {
  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    `/api/v1/notifications?hostId=${hostId}`,
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error('Failed to fetch notifications')
      }
      return res.json()
    },
    {
      refreshInterval: REFRESH_INTERVAL.MEDIUM_30S,
      dedupingInterval: 15_000, // 15 seconds deduping
      revalidateOnFocus: true, // Revalidate on focus for critical metrics
      revalidateOnReconnect: true, // Revalidate on reconnect
      shouldRetryOnError: true, // Retry on error for critical data
      errorRetryCount: 2, // Limit retries
    }
  )

  // Add unique keys to notifications and filter out dismissed ones
  const notifications = useMemo(() => {
    const rawNotifications = data?.data?.notifications ?? []

    // Add unique keys to each notification
    const withKeys: NotificationWithKey[] = rawNotifications.map((n) => ({
      ...n,
      key: getNotificationKey(n),
    }))

    // Filter out dismissed notifications
    return filterActiveNotifications(withKeys)
  }, [data])

  const totalCount = notifications.length

  // Dismiss a specific notification
  const dismiss = useCallback(
    (notification: NotificationWithKey) => {
      dismissNotificationUtil(notification)
      // Trigger revalidation to update the UI
      mutate()
    },
    [mutate]
  )

  // Dismiss all current notifications
  const dismissAll = useCallback(() => {
    for (const notification of notifications) {
      dismissNotificationUtil(notification)
    }
    // Trigger revalidation to update the UI
    mutate()
  }, [notifications, mutate])

  return {
    notifications,
    totalCount,
    isLoading,
    error,
    refresh: () => mutate(),
    dismiss,
    dismissAll,
  }
}
