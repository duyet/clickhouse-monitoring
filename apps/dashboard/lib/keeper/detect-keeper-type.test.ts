import { detectKeeperType } from './detect-keeper-type'
import { describe, expect, it } from 'bun:test'

describe('detectKeeperType', () => {
  describe('ClickHouse Keeper', () => {
    it('detects from stable suffix', () => {
      expect(detectKeeperType('v26.1.3.52-stable-abc123')).toBe(
        'clickhouse-keeper'
      )
    })

    it('detects from lts suffix', () => {
      expect(detectKeeperType('24.8.5.115-lts')).toBe('clickhouse-keeper')
    })

    it('detects from testing suffix', () => {
      expect(detectKeeperType('25.3.0.1-testing')).toBe('clickhouse-keeper')
    })

    it('detects from major version >= 18', () => {
      expect(detectKeeperType('26.1.3.52')).toBe('clickhouse-keeper')
    })

    it('detects from major version exactly 18', () => {
      expect(detectKeeperType('18.14.19')).toBe('clickhouse-keeper')
    })

    it('detects when the word "keeper" appears in version', () => {
      expect(detectKeeperType('keeper-1.0')).toBe('clickhouse-keeper')
    })

    it('handles leading "v" prefix', () => {
      expect(detectKeeperType('v25.5.1.1')).toBe('clickhouse-keeper')
    })
  })

  describe('Apache ZooKeeper', () => {
    it('detects 3.x versions', () => {
      expect(detectKeeperType('3.8.4')).toBe('zookeeper')
    })

    it('detects 3.x with patch', () => {
      expect(detectKeeperType('3.6.3')).toBe('zookeeper')
    })
  })

  describe('unknown', () => {
    it('returns unknown for null', () => {
      expect(detectKeeperType(null)).toBe('unknown')
    })

    it('returns unknown for undefined', () => {
      expect(detectKeeperType(undefined)).toBe('unknown')
    })

    it('returns unknown for empty string', () => {
      expect(detectKeeperType('')).toBe('unknown')
    })

    it('returns unknown for unrecognised version', () => {
      expect(detectKeeperType('2.0.1')).toBe('unknown')
    })
  })
})
