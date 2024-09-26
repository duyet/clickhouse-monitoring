import type { ClickHouseInterval } from '@/types/clickhouse-interval'
import { expect, test } from '@jest/globals'
import { applyInterval, fillStep, nowOrToday } from './clickhouse-query'

describe('applyInterval', () => {
  const testCases: [ClickHouseInterval, string, string | undefined, string][] =
    [
      [
        'toStartOfDay',
        'myColumn',
        'myAlias',
        'toDate(toStartOfDay(myColumn)) AS myAlias',
      ],
      [
        'toStartOfWeek',
        'myColumn',
        undefined,
        'toDate(toStartOfWeek(myColumn)) AS myColumn',
      ],
      [
        'toStartOfMonth',
        'myColumn',
        'myAlias',
        'toDate(toStartOfMonth(myColumn)) AS myAlias',
      ],
      [
        'toStartOfHour',
        'myColumn',
        'myAlias',
        'toStartOfHour(myColumn) AS myAlias',
      ],
      [
        'toStartOfMinute',
        'myColumn',
        'myAlias',
        'toStartOfMinute(myColumn) AS myAlias',
      ],
    ]

  test.each(testCases)(
    'applies %s correctly',
    (interval, column, alias, expected) => {
      const result = applyInterval(interval, column, alias)
      expect(result).toEqual(expected)
    }
  )

  it('should use column name as alias if no alias is provided', () => {
    const result = applyInterval('toStartOfDay', 'myColumn')
    expect(result).toEqual('toDate(toStartOfDay(myColumn)) AS myColumn')
  })
})

describe('fillStep', () => {
  const testCases: [ClickHouseInterval, string][] = [
    ['toStartOfMinute', 'toIntervalMinute(1)'],
    ['toStartOfFiveMinutes', 'toIntervalMinute(5)'],
    ['toStartOfTenMinutes', 'toIntervalMinute(10)'],
    ['toStartOfFifteenMinutes', 'toIntervalMinute(15)'],
    ['toStartOfHour', 'toIntervalHour(1)'],
    ['toStartOfDay', 'toIntervalDay(1)'],
    ['toStartOfWeek', 'toIntervalDay(7)'],
    ['toStartOfMonth', 'toIntervalMonth(1)'],
  ]

  test.each(testCases)(
    'returns correct interval for %s',
    (input: ClickHouseInterval, expected: string) => {
      expect(fillStep(input)).toBe(expected)
    }
  )

  it('returns undefined for invalid interval', () => {
    // @ts-expect-error: Testing with invalid input
    expect(fillStep('invalidInterval')).toBe('')
  })
})

describe('nowOrToday', () => {
  const nowCases: ClickHouseInterval[] = [
    'toStartOfMinute',
    'toStartOfFiveMinutes',
    'toStartOfTenMinutes',
    'toStartOfFifteenMinutes',
    'toStartOfHour',
  ]

  const todayCases: ClickHouseInterval[] = [
    'toStartOfDay',
    'toStartOfWeek',
    'toStartOfMonth',
  ]

  test.each(nowCases)('returns "now()" for %s', (interval) => {
    expect(nowOrToday(interval)).toBe('now()')
  })

  test.each(todayCases)('returns "today()" for %s', (interval) => {
    expect(nowOrToday(interval)).toBe('today()')
  })

  it('returns undefined for invalid interval', () => {
    // @ts-expect-error: Testing with invalid input
    expect(nowOrToday('invalidInterval')).toBe('')
  })
})