import {
  mimeToStream,
  PLAIN_EMAIL_MIME,
  SENTRY_ALERT_MIME,
} from './__fixtures__/sentry-alert'
import { extractSentryMeta, parseEmail } from './parse-email'
import { describe, expect, it } from 'bun:test'

describe('parseEmail — multipart Sentry alert', () => {
  it('extracts the from address', async () => {
    const result = await parseEmail(SENTRY_ALERT_MIME)
    expect(result.from).toBe('alerts@sentry.io')
  })

  it('extracts the from display name', async () => {
    const result = await parseEmail(SENTRY_ALERT_MIME)
    expect(result.fromName).toBe('Sentry Alerts')
  })

  it('extracts the to address', async () => {
    const result = await parseEmail(SENTRY_ALERT_MIME)
    expect(result.to).toContain('bug@chmonitor.dev')
  })

  it('extracts the subject', async () => {
    const result = await parseEmail(SENTRY_ALERT_MIME)
    expect(result.subject).toContain('TypeError')
    expect(result.subject).toContain('ClickHouseClient')
  })

  it('includes text body content', async () => {
    const result = await parseEmail(SENTRY_ALERT_MIME)
    expect(result.text).toContain('chmonitor.sentry.io/issues/4567890/')
    expect(result.text).toContain('TypeError')
  })

  it('includes the html body', async () => {
    const result = await parseEmail(SENTRY_ALERT_MIME)
    expect(result.html).toContain('View on Sentry')
  })

  it('extracts the Sentry issue URL', async () => {
    const result = await parseEmail(SENTRY_ALERT_MIME)
    expect(result.sentry?.issueUrl).toBe(
      'https://chmonitor.sentry.io/issues/4567890/'
    )
  })

  it('extracts the error level', async () => {
    const result = await parseEmail(SENTRY_ALERT_MIME)
    expect(result.sentry?.level).toBe('error')
  })

  it('extracts the project', async () => {
    const result = await parseEmail(SENTRY_ALERT_MIME)
    expect(result.sentry?.project).toBe('chmonitor-dashboard')
  })

  it('extracts the environment', async () => {
    const result = await parseEmail(SENTRY_ALERT_MIME)
    expect(result.sentry?.environment).toBe('production')
  })

  it('extracts the culprit', async () => {
    const result = await parseEmail(SENTRY_ALERT_MIME)
    expect(result.sentry?.culprit).toContain('fetchData')
  })

  it('works when fed as a ReadableStream', async () => {
    const stream = mimeToStream(SENTRY_ALERT_MIME)
    const result = await parseEmail(stream)
    expect(result.from).toBe('alerts@sentry.io')
    expect(result.sentry?.issueUrl).toBe(
      'https://chmonitor.sentry.io/issues/4567890/'
    )
  })

  it('works when fed as an ArrayBuffer', async () => {
    const buf = new TextEncoder().encode(SENTRY_ALERT_MIME).buffer
    const result = await parseEmail(buf)
    expect(result.from).toBe('alerts@sentry.io')
  })
})

describe('parseEmail — plain-text email (no Sentry)', () => {
  it('extracts from, to, subject and text', async () => {
    const result = await parseEmail(PLAIN_EMAIL_MIME)
    expect(result.from).toBe('john@example.com')
    expect(result.fromName).toBe('John Doe')
    expect(result.to).toContain('bug@chmonitor.dev')
    expect(result.subject).toBe('Something looks broken on the dashboard')
    expect(result.text).toContain('stale data')
  })

  it('has no sentry metadata', async () => {
    const result = await parseEmail(PLAIN_EMAIL_MIME)
    expect(result.sentry).toBeUndefined()
  })

  it('has no html body', async () => {
    const result = await parseEmail(PLAIN_EMAIL_MIME)
    expect(result.html).toBeUndefined()
  })
})

describe('extractSentryMeta', () => {
  it('returns undefined for unrelated text', () => {
    const meta = extractSentryMeta('Hello world', 'Nothing here.')
    expect(meta).toBeUndefined()
  })

  it('extracts a sentry.io URL from the text', () => {
    const meta = extractSentryMeta(
      'Alert',
      'See https://myorg.sentry.io/issues/99999/ for details.'
    )
    expect(meta?.issueUrl).toBe('https://myorg.sentry.io/issues/99999/')
  })

  it('detects fatal level from subject', () => {
    const meta = extractSentryMeta('[Sentry] Fatal: OOM in worker', '')
    expect(meta?.level).toBe('fatal')
  })

  it('detects warning level from a structured Level: label in the body', () => {
    const meta = extractSentryMeta(
      'Alert',
      'https://org.sentry.io/issues/1/\nLevel: warning\ndisk usage high'
    )
    expect(meta?.level).toBe('warning')
  })

  it('never throws on malformed input', () => {
    // Should not throw even with unusual strings
    expect(() => extractSentryMeta('\x00\x01\x02', '\xFF\xFE')).not.toThrow()
  })
})
