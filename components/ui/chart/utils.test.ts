/**
 * Chart utilities tests
 */

import { describe, expect, it } from 'vitest'
import { getPayloadConfigFromPayload } from './utils'
import type { ChartConfig } from './types'

describe('getPayloadConfigFromPayload', () => {
  const config: ChartConfig = {
    value: { label: 'Value', color: 'hsl(var(--chart-1))' },
    count: { label: 'Count', color: 'hsl(var(--chart-2))' },
  }

  it('returns config for matching key', () => {
    const payload = { name: 'value', value: 100 }
    const result = getPayloadConfigFromPayload(config, payload, 'value')
    expect(result).toEqual(config.value)
  })

  it('returns config for key in payload object', () => {
    const payload = { dataKey: 'count', value: 50 }
    const result = getPayloadConfigFromPayload(config, payload, 'dataKey')
    expect(result).toEqual(config.count)
  })

  it('returns undefined for non-object payload', () => {
    const result = getPayloadConfigFromPayload(config, null, 'value')
    expect(result).toBeUndefined()
  })

  it('returns undefined for missing key', () => {
    const payload = { name: 'unknown' }
    const result = getPayloadConfigFromPayload(config, payload, 'unknown')
    expect(result).toBeUndefined()
  })

  it('handles nested payload.payload structure', () => {
    const payload = {
      name: 'outer',
      payload: { value: 'inner-value' },
    }
    const result = getPayloadConfigFromPayload(config, payload, 'payload')
    expect(result).toBeUndefined() // 'inner-value' not in config
  })
})
