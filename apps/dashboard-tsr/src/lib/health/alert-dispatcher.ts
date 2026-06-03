import { loadAlertSettings } from './alert-settings-storage'

export interface HealthAlertEvent {
  checkId: string
  title: string
  severity: 'warning' | 'critical'
  value: number | null
  label: string
  hostId: number
  /** Monotonic id used to keep dismissed notifications from suppressing later incidents */
  incidentId?: string
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

export async function fireWebhook(
  alert: HealthAlertEvent,
  webhookUrl?: string
): Promise<boolean> {
  let url = webhookUrl
  if (!url) {
    const settings = loadAlertSettings()
    if (!settings.webhookEnabled || !settings.webhookUrl) return false
    url = settings.webhookUrl
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const text = `[${alert.severity.toUpperCase()}] ${alert.title} — ${alert.label} (host ${alert.hostId})`
    const res = await fetch('/api/v1/health/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, text }),
      signal: controller.signal,
    })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}
export async function dispatchAlert(alert: HealthAlertEvent): Promise<void> {
  try {
    const settings = loadAlertSettings()
    if (settings.minSeverity === 'critical' && alert.severity !== 'critical') {
      return
    }
    const withIncident: HealthAlertEvent = {
      ...alert,
      incidentId: alert.incidentId ?? String(Date.now()),
    }
    emitInAppAlert(withIncident)
    if (settings.browserNotificationsEnabled) {
      fireBrowserNotification(withIncident)
    }
    if (settings.webhookEnabled && settings.webhookUrl) {
      await fireWebhook(withIncident)
    }
  } catch (err) {
    console.error('[health] dispatchAlert failed', err)
  }
}

/** Severity ordering: ok < warning < critical. Returns true if `next` is more severe than `prev`. */
export function isEscalation(
  prev: 'ok' | 'warning' | 'critical' | null,
  next: 'ok' | 'warning' | 'critical'
): boolean {
  const order = { ok: 0, warning: 1, critical: 2 } as const
  if (prev === null) {
    // Alert on initial poll if the status is already unhealthy
    return next !== 'ok'
  }
  return order[next] > order[prev]
}
