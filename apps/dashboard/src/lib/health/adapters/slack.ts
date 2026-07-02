/**
 * Slack notification adapter (pure formatter).
 *
 * Builds an Incoming-Webhook payload using Block Kit blocks for the body plus a
 * colour-coded attachment (the classic left-border colour bar) keyed off
 * severity. The result is the JSON body POSTed to a Slack webhook URL; the URL
 * itself comes from caller configuration.
 */

import type { AlertPayload, AlertSeverity, NotificationAdapter } from './types'

/** Severity → attachment colour (hex) and header emoji. */
const SEVERITY_STYLE: Record<AlertSeverity, { color: string; emoji: string }> =
  {
    critical: { color: '#dc2626', emoji: '🔴' },
    warning: { color: '#f59e0b', emoji: '🟠' },
    recovery: { color: '#16a34a', emoji: '🟢' },
  }

interface SlackTextObject {
  type: 'plain_text' | 'mrkdwn'
  text: string
  emoji?: boolean
}

interface SlackBlock {
  type: string
  text?: SlackTextObject
  fields?: SlackTextObject[]
  elements?: SlackTextObject[]
}

interface SlackAttachment {
  color: string
  blocks: SlackBlock[]
}

/** Slack Incoming Webhook body: summary text + colour attachment with blocks. */
export interface SlackWebhookBody {
  text: string
  attachments: SlackAttachment[]
}

function heading(severity: AlertSeverity): string {
  return severity === 'recovery' ? 'RECOVERY' : severity.toUpperCase()
}

function thresholdText(payload: AlertPayload): string {
  const parts: string[] = []
  if (payload.warnThreshold !== undefined && payload.warnThreshold !== null) {
    parts.push(`warn ${payload.warnThreshold}`)
  }
  if (payload.critThreshold !== undefined && payload.critThreshold !== null) {
    parts.push(`crit ${payload.critThreshold}`)
  }
  return parts.length > 0 ? parts.join(' | ') : '—'
}

/**
 * Build the Slack webhook body for a payload.
 */
export function buildSlackBody(payload: AlertPayload): SlackWebhookBody {
  const style = SEVERITY_STYLE[payload.severity]
  const summary = `[${heading(payload.severity)}] ${payload.title} — ${payload.label} (host ${payload.hostLabel})`

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${style.emoji} ${heading(payload.severity)}: ${payload.title}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Host:*\n${payload.hostLabel} (id ${payload.hostId})`,
        },
        { type: 'mrkdwn', text: `*Metric:*\n${payload.metric}` },
        {
          type: 'mrkdwn',
          text: `*Value:*\n${payload.value === null ? 'n/a' : payload.value}`,
        },
        { type: 'mrkdwn', text: `*Thresholds:*\n${thresholdText(payload)}` },
      ],
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Detail:* ${payload.label}` },
    },
  ]

  if (payload.runbookUrls && payload.runbookUrls.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Runbooks:*\n${payload.runbookUrls.map((u) => `• <${u}>`).join('\n')}`,
      },
    })
  }

  blocks.push({
    type: 'context',
    elements: [{ type: 'mrkdwn', text: payload.timestamp }],
  })

  return {
    text: summary,
    attachments: [{ color: style.color, blocks }],
  }
}

/** Slack adapter. `buildBody` returns the Incoming Webhook JSON body. */
export const slackAdapter: NotificationAdapter = {
  id: 'slack',
  detect: (url: string) => /(?:^|\/\/)hooks\.slack\.com\//i.test(url),
  buildBody: (payload: AlertPayload) => buildSlackBody(payload),
}
