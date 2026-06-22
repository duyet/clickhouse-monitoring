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
  // Enabled by default so a fresh install surfaces critical alerts in-app
  // without any configuration. The browser Notification API is only invoked
  // when permission is already 'granted' (see fireBrowserNotification).
  browserNotificationsEnabled: true,
  minSeverity: 'critical',
}

export function loadAlertSettings(): AlertSettings {
  if (typeof window === 'undefined') return DEFAULT_ALERT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_ALERT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<
      Record<keyof AlertSettings, unknown>
    >
    return {
      webhookUrl:
        typeof parsed.webhookUrl === 'string'
          ? parsed.webhookUrl
          : DEFAULT_ALERT_SETTINGS.webhookUrl,
      webhookEnabled:
        typeof parsed.webhookEnabled === 'boolean'
          ? parsed.webhookEnabled
          : DEFAULT_ALERT_SETTINGS.webhookEnabled,
      browserNotificationsEnabled:
        typeof parsed.browserNotificationsEnabled === 'boolean'
          ? parsed.browserNotificationsEnabled
          : DEFAULT_ALERT_SETTINGS.browserNotificationsEnabled,
      minSeverity:
        parsed.minSeverity === 'warning' || parsed.minSeverity === 'critical'
          ? parsed.minSeverity
          : DEFAULT_ALERT_SETTINGS.minSeverity,
    }
  } catch {
    return DEFAULT_ALERT_SETTINGS
  }
}

export function saveAlertSettings(settings: AlertSettings): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    window.dispatchEvent(new CustomEvent('health-alert-settings-changed'))
    return true
  } catch {
    return false
  }
}
