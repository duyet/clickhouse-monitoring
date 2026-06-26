/**
 * Replication Lag Health Score Tests (#1914)
 */

import { describe, expect, test } from 'bun:test'
import {
  computeReplicaHealthScore,
  getLagStatus,
} from '../replication-lag-health'

describe('getLagStatus', () => {
  test('0s → synced', () => {
    expect(getLagStatus(0)).toBe('synced')
  })

  test('1s → slight lag', () => {
    expect(getLagStatus(1)).toBe('slight lag')
  })

  test('59s → slight lag', () => {
    expect(getLagStatus(59)).toBe('slight lag')
  })

  test('60s → moderate lag', () => {
    expect(getLagStatus(60)).toBe('moderate lag')
  })

  test('299s → moderate lag', () => {
    expect(getLagStatus(299)).toBe('moderate lag')
  })

  test('300s → severe lag', () => {
    expect(getLagStatus(300)).toBe('severe lag')
  })

  test('1000s → severe lag', () => {
    expect(getLagStatus(1000)).toBe('severe lag')
  })
})

describe('computeReplicaHealthScore', () => {
  test('synced with empty queue → 100', () => {
    expect(computeReplicaHealthScore(0, 0, 0)).toBe(100)
  })

  test('slight lag → 75', () => {
    expect(computeReplicaHealthScore(30, 0, 0)).toBe(75)
  })

  test('moderate lag → 50', () => {
    expect(computeReplicaHealthScore(120, 0, 0)).toBe(50)
  })

  test('severe lag → 0', () => {
    expect(computeReplicaHealthScore(300, 0, 0)).toBe(0)
  })

  test('queue penalty: 100 items → -5 from base', () => {
    // synced (100) - floor(100/100)*5 = 100 - 5 = 95
    expect(computeReplicaHealthScore(0, 50, 50)).toBe(95)
  })

  test('queue penalty: 200 items → -10 from base', () => {
    expect(computeReplicaHealthScore(0, 100, 100)).toBe(90)
  })

  test('score never drops below 0', () => {
    // severe lag (0) - big queue penalty → still 0
    expect(computeReplicaHealthScore(300, 10000, 10000)).toBe(0)
  })

  test('score never exceeds 100', () => {
    expect(computeReplicaHealthScore(0, 0, 0)).toBe(100)
  })

  test('slight lag + large queue → penalized', () => {
    // slight lag (75) - floor(500/100)*5 = 75 - 25 = 50
    expect(computeReplicaHealthScore(30, 250, 250)).toBe(50)
  })
})
