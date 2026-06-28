import {
  getEventEndpoint,
  installTelemetryEventSink,
  uninstallTelemetryEventSink,
} from './event-sink'
import { clearTelemetrySinks, track } from './track'
import { afterEach, describe, expect, mock, test } from 'bun:test'

const PING = 'https://telemetry.chmonitor.dev/v1/ping'
const EVENT = 'https://telemetry.chmonitor.dev/v1/event'
const ON = { CHM_TELEMETRY: 'on', CHM_TELEMETRY_ENDPOINT: PING }

afterEach(() => {
  uninstallTelemetryEventSink()
  clearTelemetrySinks()
})

describe('getEventEndpoint', () => {
  test('derives /v1/event from the default ping endpoint', () => {
    expect(getEventEndpoint({})).toBe(EVENT)
    expect(getEventEndpoint({ CHM_TELEMETRY_ENDPOINT: PING })).toBe(EVENT)
  })

  test('empty endpoint stays empty', () => {
    expect(getEventEndpoint({ CHM_TELEMETRY_ENDPOINT: '' })).toBe('')
  })

  test('custom non-/v1/ping endpoint is returned unchanged', () => {
    expect(
      getEventEndpoint({ CHM_TELEMETRY_ENDPOINT: 'https://x.example/ingest' })
    ).toBe('https://x.example/ingest')
  })
})

describe('installTelemetryEventSink', () => {
  test('POSTs tracked events to the event endpoint when enabled', () => {
    const calls: Array<{ url: string; body: unknown }> = []
    const fetchMock = mock((url: string, init?: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init?.body)) })
      return Promise.resolve(new Response(null, { status: 204 }))
    })
    const original = globalThis.fetch
    globalThis.fetch = fetchMock as unknown as typeof fetch
    try {
      installTelemetryEventSink(ON)
      track('cluster_connected', { ch_flavor: 'oss', num_hosts: 2 }, ON)
    } finally {
      globalThis.fetch = original
    }

    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe(EVENT)
    expect(calls[0].body).toEqual({
      event: 'cluster_connected',
      props: { deploy_target: 'unknown', ch_flavor: 'oss', num_hosts: 2 },
    })
  })

  test('no-op when telemetry is disabled — no sink, no POST', () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response(null, { status: 204 }))
    )
    const original = globalThis.fetch
    globalThis.fetch = fetchMock as unknown as typeof fetch
    try {
      installTelemetryEventSink({ CHM_TELEMETRY: 'off' })
      track('app_loaded', {}, { CHM_TELEMETRY: 'off' })
    } finally {
      globalThis.fetch = original
    }
    expect(fetchMock).toHaveBeenCalledTimes(0)
  })

  test('is idempotent — installing twice registers one sink', () => {
    const calls: number[] = []
    const fetchMock = mock(() => {
      calls.push(1)
      return Promise.resolve(new Response(null, { status: 204 }))
    })
    const original = globalThis.fetch
    globalThis.fetch = fetchMock as unknown as typeof fetch
    try {
      installTelemetryEventSink(ON)
      installTelemetryEventSink(ON)
      track('health_viewed', {}, ON)
    } finally {
      globalThis.fetch = original
    }
    expect(calls).toHaveLength(1)
  })
})
