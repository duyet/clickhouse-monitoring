'use client'

const STORAGE_KEY = 'health-alert-settings'

export interface AlertSettings {
  /** Webhook URL (Slack/Discord-compatible). Empty when disabled. */
  webhookUrl: string
  webhookEnabled: boolean
  browserNotificationsEnabled: boolean
  /** Severity threshold at which alerts fire: 'warning' = both warning+critical, 'critical' = only critical */
  minSeverity: 'warning' | 'critical'
}

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  webhookUrl: '',
  webhookEnabled: false,
  browserNotificationsEnabled: false,
  minSeverity: 'critical',
}

export function loadAlertSettings(): AlertSettings {
  if (typeof window === 'undefined') return DEFAULT_ALERT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_ALERT_SETTINGS
    return { ...DEFAULT_ALERT_SETTINGS, ...JSON.parse(raw) } as AlertSettings
  } catch {
    return DEFAULT_ALERT_SETTINGS
  }
}

export function saveAlertSettings(settings: AlertSettings): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    window.dispatchEvent(new CustomEvent('health-alert-settings-changed'))
  } catch {
    // localStorage may be full or disabled
  }
}
