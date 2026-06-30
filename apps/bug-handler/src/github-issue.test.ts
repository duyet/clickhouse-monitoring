import type { BugHandlerConfig } from './config'
import type { ParsedEmail } from './parse-email'

import { buildIssue, createGitHubIssue } from './github-issue'
import { describe, expect, it } from 'bun:test'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_CONFIG: BugHandlerConfig = {
  targetAddress: 'bug@chmonitor.dev',
  githubRepo: { owner: 'chmonitor', repo: 'chmonitor' },
  githubToken: 'ghp_testtoken',
  labels: ['bug', 'sentry', 'automated'],
  assignees: ['duyetbot'],
  titlePrefix: '[Sentry] ',
  allowedSenders: [],
  apiBase: 'https://api.github.com',
}

const SENTRY_EMAIL: ParsedEmail = {
  from: 'alerts@sentry.io',
  fromName: 'Sentry Alerts',
  to: ['bug@chmonitor.dev'],
  subject: 'TypeError: Cannot read properties of null in ClickHouseClient',
  text: 'Project: chmonitor-dashboard\nEnvironment: production\nLevel: error\nSee https://chmonitor.sentry.io/issues/4567890/ for details.\nCulprit: fetchData',
  sentry: {
    issueUrl: 'https://chmonitor.sentry.io/issues/4567890/',
    level: 'error',
    project: 'chmonitor-dashboard',
    environment: 'production',
    culprit: 'fetchData',
    shortId: 'CHMONITOR-1A2B',
  },
}

// ─── buildIssue ───────────────────────────────────────────────────────────────

describe('buildIssue — title', () => {
  it('prepends the configured prefix', () => {
    const issue = buildIssue(SENTRY_EMAIL, BASE_CONFIG)
    expect(issue.title).toBe(
      '[Sentry] TypeError: Cannot read properties of null in ClickHouseClient'
    )
  })

  it('truncates title to 256 characters with ellipsis', () => {
    const longSubject = 'A'.repeat(300)
    const email: ParsedEmail = { ...SENTRY_EMAIL, subject: longSubject }
    const issue = buildIssue(email, BASE_CONFIG)
    expect(issue.title.length).toBe(256)
    expect(issue.title.endsWith('…')).toBe(true)
  })

  it('uses fallback subject when subject is empty', () => {
    const email: ParsedEmail = { ...SENTRY_EMAIL, subject: '' }
    const issue = buildIssue(email, BASE_CONFIG)
    expect(issue.title).toContain('Bug report (no subject)')
  })

  it('uses no prefix when titlePrefix is empty string', () => {
    const cfg = { ...BASE_CONFIG, titlePrefix: '' }
    const issue = buildIssue(SENTRY_EMAIL, cfg)
    expect(issue.title.startsWith('TypeError')).toBe(true)
  })
})

describe('buildIssue — body', () => {
  it('includes the Sentry issue URL as a markdown link', () => {
    const issue = buildIssue(SENTRY_EMAIL, BASE_CONFIG)
    expect(issue.body).toContain(
      '[https://chmonitor.sentry.io/issues/4567890/]'
    )
    expect(issue.body).toContain(
      '(https://chmonitor.sentry.io/issues/4567890/)'
    )
  })

  it('includes the from address in the Source table', () => {
    const issue = buildIssue(SENTRY_EMAIL, BASE_CONFIG)
    expect(issue.body).toContain('alerts@sentry.io')
  })

  it('includes environment and level from sentry metadata', () => {
    const issue = buildIssue(SENTRY_EMAIL, BASE_CONFIG)
    expect(issue.body).toContain('production')
    expect(issue.body).toContain('error')
  })

  it('includes the agent checklist section', () => {
    const issue = buildIssue(SENTRY_EMAIL, BASE_CONFIG)
    expect(issue.body).toContain('## For the coding agent')
    expect(issue.body).toContain('failing test')
  })

  it('includes the Sentry link in the agent checklist', () => {
    const issue = buildIssue(SENTRY_EMAIL, BASE_CONFIG)
    expect(issue.body).toContain('https://chmonitor.sentry.io/issues/4567890/')
  })

  it('includes the footer', () => {
    const issue = buildIssue(SENTRY_EMAIL, BASE_CONFIG)
    expect(issue.body).toContain('bug-handler email worker')
  })

  it('includes the email text body in a fenced block', () => {
    const issue = buildIssue(SENTRY_EMAIL, BASE_CONFIG)
    expect(issue.body).toContain('```')
    expect(issue.body).toContain('chmonitor-dashboard')
  })
})

describe('buildIssue — labels and assignees', () => {
  it('passes through configured labels', () => {
    const issue = buildIssue(SENTRY_EMAIL, BASE_CONFIG)
    expect(issue.labels).toEqual(['bug', 'sentry', 'automated'])
  })

  it('passes through configured assignees', () => {
    const issue = buildIssue(SENTRY_EMAIL, BASE_CONFIG)
    expect(issue.assignees).toEqual(['duyetbot'])
  })

  it('passes empty assignees when none configured', () => {
    const cfg = { ...BASE_CONFIG, assignees: [] }
    const issue = buildIssue(SENTRY_EMAIL, cfg)
    expect(issue.assignees).toEqual([])
  })
})

// ─── createGitHubIssue ────────────────────────────────────────────────────────

describe('createGitHubIssue', () => {
  const ISSUE_PAYLOAD = {
    title: '[Sentry] TypeError',
    body: 'body text',
    labels: ['bug'],
    assignees: ['duyetbot'],
  }

  it('POSTs to the correct URL', async () => {
    let capturedUrl = ''
    const mockFetch = async (
      url: string | URL | Request,
      _init?: RequestInit
    ) => {
      capturedUrl = url.toString()
      return new Response(
        JSON.stringify({
          html_url: 'https://github.com/chmonitor/chmonitor/issues/1',
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    await createGitHubIssue(
      ISSUE_PAYLOAD,
      BASE_CONFIG,
      mockFetch as typeof fetch
    )
    expect(capturedUrl).toBe(
      'https://api.github.com/repos/chmonitor/chmonitor/issues'
    )
  })

  it('uses POST method', async () => {
    let capturedMethod = ''
    const mockFetch = async (
      _url: string | URL | Request,
      init?: RequestInit
    ) => {
      capturedMethod = init?.method ?? ''
      return new Response(
        JSON.stringify({
          html_url: 'https://github.com/chmonitor/chmonitor/issues/1',
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    await createGitHubIssue(
      ISSUE_PAYLOAD,
      BASE_CONFIG,
      mockFetch as typeof fetch
    )
    expect(capturedMethod).toBe('POST')
  })

  it('sends correct Authorization, Accept, and User-Agent headers', async () => {
    let capturedHeaders: Record<string, string> = {}
    const mockFetch = async (
      _url: string | URL | Request,
      init?: RequestInit
    ) => {
      capturedHeaders = Object.fromEntries(
        Object.entries((init?.headers as Record<string, string>) ?? {})
      )
      return new Response(
        JSON.stringify({
          html_url: 'https://github.com/chmonitor/chmonitor/issues/1',
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    await createGitHubIssue(
      ISSUE_PAYLOAD,
      BASE_CONFIG,
      mockFetch as typeof fetch
    )
    expect(capturedHeaders.Authorization).toBe('Bearer ghp_testtoken')
    expect(capturedHeaders.Accept).toBe('application/vnd.github+json')
    expect(capturedHeaders['User-Agent']).toBe('chmonitor-bug-handler')
    expect(capturedHeaders['X-GitHub-Api-Version']).toBe('2022-11-28')
  })

  it('includes title, body, labels, and assignees in the JSON body', async () => {
    let capturedBody: Record<string, unknown> = {}
    const mockFetch = async (
      _url: string | URL | Request,
      init?: RequestInit
    ) => {
      capturedBody = JSON.parse(init?.body as string)
      return new Response(
        JSON.stringify({
          html_url: 'https://github.com/chmonitor/chmonitor/issues/1',
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    await createGitHubIssue(
      ISSUE_PAYLOAD,
      BASE_CONFIG,
      mockFetch as typeof fetch
    )
    expect(capturedBody.title).toBe('[Sentry] TypeError')
    expect(capturedBody.body).toBe('body text')
    expect(capturedBody.labels).toEqual(['bug'])
    expect(capturedBody.assignees).toEqual(['duyetbot'])
  })

  it('omits assignees field when assignees array is empty', async () => {
    let capturedBody: Record<string, unknown> = {}
    const mockFetch = async (
      _url: string | URL | Request,
      init?: RequestInit
    ) => {
      capturedBody = JSON.parse(init?.body as string)
      return new Response(
        JSON.stringify({
          html_url: 'https://github.com/chmonitor/chmonitor/issues/1',
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const payload = { ...ISSUE_PAYLOAD, assignees: [] }
    await createGitHubIssue(payload, BASE_CONFIG, mockFetch as typeof fetch)
    expect('assignees' in capturedBody).toBe(false)
  })

  it('returns ok:true with the issue URL on 201', async () => {
    const mockFetch = async () =>
      new Response(
        JSON.stringify({
          html_url: 'https://github.com/chmonitor/chmonitor/issues/42',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      )

    const result = await createGitHubIssue(
      ISSUE_PAYLOAD,
      BASE_CONFIG,
      mockFetch as typeof fetch
    )
    expect(result.ok).toBe(true)
    expect(result.url).toBe('https://github.com/chmonitor/chmonitor/issues/42')
  })

  it('returns ok:false with status and error text on non-2xx', async () => {
    const mockFetch = async () => new Response('Not Found', { status: 404 })

    const result = await createGitHubIssue(
      ISSUE_PAYLOAD,
      BASE_CONFIG,
      mockFetch as typeof fetch
    )
    expect(result.ok).toBe(false)
    expect(result.status).toBe(404)
    expect(result.error).toContain('Not Found')
  })

  it('returns ok:false on 422 validation error', async () => {
    const mockFetch = async () =>
      new Response(JSON.stringify({ message: 'Validation Failed' }), {
        status: 422,
      })

    const result = await createGitHubIssue(
      ISSUE_PAYLOAD,
      BASE_CONFIG,
      mockFetch as typeof fetch
    )
    expect(result.ok).toBe(false)
    expect(result.status).toBe(422)
  })

  it('returns ok:false with status 0 when missing repo or token', async () => {
    const cfg = { ...BASE_CONFIG, githubRepo: null }
    const result = await createGitHubIssue(ISSUE_PAYLOAD, cfg, fetch)
    expect(result.ok).toBe(false)
    expect(result.status).toBe(0)
  })
})
