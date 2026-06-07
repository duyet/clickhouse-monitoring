import type { AlertSettings } from './alert-settings-storage'

import { DEFAULT_ALERT_SETTINGS } from './alert-settings-storage'

/**
 * Server-side alert configuration sourced from environment variables.
 *
 * The client persists {@link AlertSettings} in localStorage (tab-scoped); the
 * autonomous cron sweep cannot read that, so it reads the same shape from env:
 *
 *   - CHM_HEALTH_WEBHOOK_URL / HEALTH_ALERT_WEBHOOK_URL → webhookUrl
 *   - CHM_HEALTH_MIN_SEVERITY / HEALTH_ALERT_MIN_SEVERITY → minSeverity
 *   - Enabled when a webhook URL is present (or legacy HEALTH_ALERT_ENABLED='true')
 *
 * Browser notifications never apply server-side, so it is always disabled.
 */
export function getServerAlertConfig(): AlertSettings {
  const webhookUrl =
    (
      process.env.CHM_HEALTH_WEBHOOK_URL ?? process.env.HEALTH_ALERT_WEBHOOK_URL
    )?.trim() || ''
  const legacyEnabled = process.env.HEALTH_ALERT_ENABLED
  const enabled =
    legacyEnabled !== undefined ? legacyEnabled === 'true' : Boolean(webhookUrl)
  const minSeverityEnv = (
    process.env.CHM_HEALTH_MIN_SEVERITY ?? process.env.HEALTH_ALERT_MIN_SEVERITY
  )?.trim()
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
