import type { AlertSettings } from './alert-settings-storage'

import { DEFAULT_ALERT_SETTINGS } from './alert-settings-storage'

/**
 * Server-side alert configuration sourced from environment variables.
 *
 * The client persists {@link AlertSettings} in localStorage (tab-scoped); the
 * autonomous cron sweep cannot read that, so it reads the same shape from env:
 *
 *   - HEALTH_ALERT_ENABLED      → webhookEnabled (default false)
 *   - HEALTH_ALERT_WEBHOOK_URL  → webhookUrl     (default '')
 *   - HEALTH_ALERT_MIN_SEVERITY → minSeverity    (default 'warning')
 *
 * Browser notifications never apply server-side, so it is always disabled.
 */
export function getServerAlertConfig(): AlertSettings {
  const webhookUrl = process.env.HEALTH_ALERT_WEBHOOK_URL?.trim() || ''
  const enabled = process.env.HEALTH_ALERT_ENABLED === 'true'
  const minSeverityEnv = process.env.HEALTH_ALERT_MIN_SEVERITY?.trim()
  const minSeverity: AlertSettings['minSeverity'] =
    minSeverityEnv === 'critical' || minSeverityEnv === 'warning'
      ? minSeverityEnv
      : 'warning'

  return {
    ...DEFAULT_ALERT_SETTINGS,
    webhookUrl,
    webhookEnabled: enabled,
    browserNotificationsEnabled: false,
    minSeverity,
  }
}
