'use client'

import { loadAlertSettings } from './alert-settings-storage'

export interface HealthAlertEvent {
  checkId: string
  title: string
  severity: 'warning' | 'critical'
  value: number | null
  label: string
  hostId: number
}

const HEALTH_ALERT_EVENT = 'health-alert'

export function emitInAppAlert(alert: HealthAlertEvent): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<HealthAlertEvent>(HEALTH_ALERT_EVENT, { detail: alert })
  )
}

export function subscribeInAppAlerts(
  handler: (alert: HealthAlertEvent) => void
): () => void {
  if (typeof window === 'undefined') return () => {}
  const listener = (event: Event) => {
    const e = event as CustomEvent<HealthAlertEvent>
    handler(e.detail)
  }
  window.addEventListener(HEALTH_ALERT_EVENT, listener)
  return () => window.removeEventListener(HEALTH_ALERT_EVENT, listener)
}

export function fireBrowserNotification(alert: HealthAlertEvent): void {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(`[${alert.severity.toUpperCase()}] ${alert.title}`, {
      body: alert.label,
      tag: `health:${alert.checkId}:${alert.severity}`,
    })
  } catch {
    // Some browsers throw when constructed outside a service worker
  }
}

export async function fireWebhook(alert: HealthAlertEvent): Promise<boolean> {
  const settings = loadAlertSettings()
  if (!settings.webhookEnabled || !settings.webhookUrl) return false
  try {
    const text = `[${alert.severity.toUpperCase()}] ${alert.title} — ${alert.label} (host ${alert.hostId})`
    await fetch(settings.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, content: text }),
    })
    return true
  } catch {
    return false
  }
}

export async function dispatchAlert(alert: HealthAlertEvent): Promise<void> {
  const settings = loadAlertSettings()
  if (settings.minSeverity === 'critical' && alert.severity !== 'critical') {
    return
  }
  emitInAppAlert(alert)
  if (settings.browserNotificationsEnabled) {
    fireBrowserNotification(alert)
  }
  if (settings.webhookEnabled && settings.webhookUrl) {
    await fireWebhook(alert)
  }
}

/** Severity ordering: ok < warning < critical. Returns true if `next` is more severe than `prev`. */
export function isEscalation(
  prev: 'ok' | 'warning' | 'critical' | null,
  next: 'ok' | 'warning' | 'critical'
): boolean {
  const order = { ok: 0, warning: 1, critical: 2 } as const
  return prev === null || order[next] > order[prev]
}
