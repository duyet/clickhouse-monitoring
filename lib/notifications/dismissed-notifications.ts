/**
 * Dismissed Notifications Storage
 *
 * Manages localStorage for dismissed notifications.
 * Each notification has a unique key based on type + cluster + count.
 */

const STORAGE_KEY = 'dismissed-notifications'

export interface Notification {
  readonly type: 'readonly-tables'
  readonly cluster: string
  readonly count: number
  readonly severity: 'critical' | 'warning'
  // key is added by the hook
  readonly key?: string
}

/**
 * Generate a unique key for a notification.
 * Key format: {type}:{cluster}:{count}
 * Example: "readonly-tables:my-cluster:5"
 */
export function getNotificationKey(notification: Notification): string {
  return `${notification.type}:${notification.cluster}:${notification.count}`
}

/**
 * Get all dismissed notification keys from localStorage
 */
export function getDismissedNotifications(): Set<string> {
  if (typeof window === 'undefined') return new Set()

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return new Set()
    return new Set(JSON.parse(stored))
  } catch {
    return new Set()
  }
}

/**
 * Check if a notification is dismissed
 */
export function isNotificationDismissed(notification: Notification): boolean {
  const dismissed = getDismissedNotifications()
  return dismissed.has(getNotificationKey(notification))
}

/**
 * Dismiss a notification
 */
export function dismissNotification(notification: Notification): void {
  if (typeof window === 'undefined') return

  const dismissed = getDismissedNotifications()
  dismissed.add(getNotificationKey(notification))

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed]))
  } catch {
    // Silently fail if localStorage is full or disabled
  }
}

/**
 * Dismiss all current notifications
 */
export function dismissAllNotifications(
  notifications: readonly Notification[]
): void {
  if (typeof window === 'undefined') return

  const dismissed = getDismissedNotifications()
  for (const notification of notifications) {
    dismissed.add(getNotificationKey(notification))
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed]))
  } catch {
    // Silently fail if localStorage is full or disabled
  }
}

/**
 * Clear all dismissed notifications (for testing/reset)
 */
export function clearDismissedNotifications(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Silently fail
  }
}

/**
 * Filter out dismissed notifications from a list
 * Generic function that preserves the key property
 */
export function filterActiveNotifications<T extends Notification>(
  notifications: readonly T[]
): T[] {
  const dismissed = getDismissedNotifications()
  return notifications.filter((n) => !dismissed.has(getNotificationKey(n)))
}
