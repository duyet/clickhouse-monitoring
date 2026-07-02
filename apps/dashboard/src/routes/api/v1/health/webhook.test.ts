import { __handlePostForTests as handlePost } from './webhook'
import { describe, expect, test } from 'bun:test'

// Injected DNS resolver so tests never hit the network. A public address makes
// hostname targets resolve to a non-internal IP (allowed); tests that must be
// blocked use IP literals (blocked before DNS) or a resolver returning an
// internal address.
const resolvePublic = async () => ['93.184.216.34']
const resolvePrivate = async () => ['10.0.0.5']

function makeRequest(body: unknown): Request {
  return new Request('https://dash.example.com/api/v1/health/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** A fetch stub that records the URL + body it was called with. */
function stubFetch() {
  const calls: { url: string; body: string }[] = []
  const fetchImpl = (async (input: unknown, init?: RequestInit) => {
    calls.push({
      url: String(input),
      body: typeof init?.body === 'string' ? init.body : '',
    })
    return new Response('ok', { status: 200 })
  }) as unknown as typeof fetch
  return { calls, fetchImpl }
}

describe('health webhook proxy — SSRF hardening', () => {
  test('blocks the cloud metadata IP (169.254.169.254)', async () => {
    const { calls, fetchImpl } = stubFetch()
    const res = await handlePost(
      makeRequest({
        url: 'https://169.254.169.254/latest/meta-data/',
        text: 'hi',
      }),
      { resolveHostAddresses: resolvePublic, fetchImpl }
    )

    expect(res.status).toBe(400)
    // The outbound fetch must never run for a blocked target.
    expect(calls).toHaveLength(0)
  })

  test('blocks an RFC1918 host that resolves to a private address', async () => {
    const { calls, fetchImpl } = stubFetch()
    const res = await handlePost(
      makeRequest({ url: 'https://internal.corp.example', text: 'hi' }),
      { resolveHostAddresses: resolvePrivate, fetchImpl }
    )

    expect(res.status).toBe(400)
    expect(calls).toHaveLength(0)
  })

  test('blocks a raw RFC1918 IP literal (10.0.0.1)', async () => {
    const { calls, fetchImpl } = stubFetch()
    const res = await handlePost(
      makeRequest({ url: 'https://10.0.0.1/webhook', text: 'hi' }),
      { resolveHostAddresses: resolvePublic, fetchImpl }
    )

    expect(res.status).toBe(400)
    expect(calls).toHaveLength(0)
  })

  test('allows a normal public HTTPS webhook and wraps text', async () => {
    const { calls, fetchImpl } = stubFetch()
    const res = await handlePost(
      makeRequest({
        url: 'https://hooks.slack.com/services/T000/B000/XXXX',
        text: 'hello world',
      }),
      { resolveHostAddresses: resolvePublic, fetchImpl }
    )

    expect(res.status).toBe(200)
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://hooks.slack.com/services/T000/B000/XXXX')
    // Backward-compatible default wrapper.
    expect(JSON.parse(calls[0].body)).toEqual({
      text: 'hello world',
      content: 'hello world',
    })
  })

  test('rejects non-https URLs', async () => {
    const { calls, fetchImpl } = stubFetch()
    const res = await handlePost(
      makeRequest({ url: 'http://hooks.slack.com/x', text: 'hi' }),
      { resolveHostAddresses: resolvePublic, fetchImpl }
    )

    expect(res.status).toBe(400)
    expect(calls).toHaveLength(0)
  })
})

describe('health webhook proxy — provider verbatim forwarding', () => {
  test('forwards the payload verbatim when a provider hint is present', async () => {
    const { calls, fetchImpl } = stubFetch()
    const payload = { blocks: [{ type: 'section', text: 'custom' }] }
    const res = await handlePost(
      makeRequest({
        url: 'https://hooks.slack.com/services/T000/B000/XXXX',
        provider: 'slack',
        payload,
      }),
      { resolveHostAddresses: resolvePublic, fetchImpl }
    )

    expect(res.status).toBe(200)
    expect(calls).toHaveLength(1)
    // Forwarded verbatim — NOT re-wrapped as { text, content }.
    expect(JSON.parse(calls[0].body)).toEqual(payload)
  })

  test('requires a payload when provider is set', async () => {
    const { calls, fetchImpl } = stubFetch()
    const res = await handlePost(
      makeRequest({
        url: 'https://hooks.slack.com/services/T000/B000/XXXX',
        provider: 'slack',
      }),
      { resolveHostAddresses: resolvePublic, fetchImpl }
    )

    expect(res.status).toBe(400)
    expect(calls).toHaveLength(0)
  })
})
