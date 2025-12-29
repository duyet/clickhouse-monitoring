import type { ClickHouseInterval } from '@/types/clickhouse-interval'
import { expect, test } from '@jest/globals'
import {
  applyInterval,
  fillStep,
  nowOrToday,
  withQueryParams,
} from './clickhouse-query'

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

  test.each(
    testCases
  )('applies %s correctly', (interval, column, alias, expected) => {
    const result = applyInterval(interval, column, alias)
    expect(result).toEqual(expected)
  })

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

  test.each(
    testCases
  )('returns correct interval for %s', (input: ClickHouseInterval, expected: string) => {
    expect(fillStep(input)).toBe(expected)
  })

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

describe('withQueryParams', () => {
  it('should return the original query when no params are provided', () => {
    const query = 'SELECT * FROM users'
    const result = withQueryParams(query, {})
    expect(result).toBe(query)
  })

  it('should return the original query when params is undefined', () => {
    const query = 'SELECT * FROM users'
    const result = withQueryParams(query, undefined)
    expect(result).toBe(query)
  })

  it('should add a single parameter to the query', () => {
    const query = 'SELECT * FROM users WHERE id = {id:Int32}'
    const params = { id: 1 }
    const expected =
      'SET param_id=1;\nSELECT * FROM users WHERE id = {id:Int32}'
    const result = withQueryParams(query, params)
    expect(result).toBe(expected)
  })

  it('should add multiple parameters to the query', () => {
    const query =
      'SELECT * FROM users WHERE name = {name:String} AND age > {age:Int32}'
    const params = { name: 'John', age: 30 }
    const expected =
      "SET param_name='John';\nSET param_age=30;\nSELECT * FROM users WHERE name = {name:String} AND age > {age:Int32}"
    const result = withQueryParams(query, params)
    expect(result).toBe(expected)
  })

  it('should handle string and number parameter types', () => {
    const query =
      'SELECT * FROM products WHERE category = {category:String} AND price < {price:Float64}'
    const params = { category: 'electronics', price: 999.99 }
    const expected =
      "SET param_category='electronics';\nSET param_price=999.99;\nSELECT * FROM products WHERE category = {category:String} AND price < {price:Float64}"
    const result = withQueryParams(query, params)
    expect(result).toBe(expected)
  })

  it('should handle empty string parameters', () => {
    const query = 'SELECT * FROM users WHERE name = {name:String}'
    const params = { name: '' }
    const expected =
      "SET param_name='';\nSELECT * FROM users WHERE name = {name:String}"
    const result = withQueryParams(query, params)
    expect(result).toBe(expected)
  })

  it('should handle string parameters with single quotes', () => {
    /**
     * :) SET param_name='O''Brien';\nSELECT {name: String}
     *  ┌─'O\'Brien'─┐
     *  │ O'Brien    │
     *  └────────────┘
     */
    const query = 'SELECT * FROM users WHERE name = {name:String}'
    const params = { name: "O'Brien" }
    const expected =
      "SET param_name='O''Brien';\nSELECT * FROM users WHERE name = {name:String}"
    const result = withQueryParams(query, params)
    expect(result).toBe(expected)
  })
})
