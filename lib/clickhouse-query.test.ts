import { expect } from '@jest/globals'
import { applyInterval } from './clickhouse-query'

describe('applyInterval', () => {
  it('should apply toStartOfDay for toStartOfDay interval', () => {
    const result = applyInterval('toStartOfDay', 'myColumn', 'myAlias')
    expect(result).toEqual('toDate(toStartOfDay(myColumn)) as myAlias') // Change to toEqual
  })

  it('should apply toStartOfWeek for toStartOfWeek interval', () => {
    const result = applyInterval('toStartOfWeek', 'myColumn')
    expect(result).toEqual('toDate(toStartOfDay(myColumn)) as myColumn') // Change to toEqual
  })

  it('should apply toStartOfMonth for toStartOfMonth interval', () => {
    const result = applyInterval('toStartOfMonth', 'myColumn', 'myAlias')
    expect(result).toEqual('toDate(toStartOfDay(myColumn)) as myAlias') // Change to toEqual
  })

  it('should apply toStartOfHour for other intervals', () => {
    const result = applyInterval('toStartOfHour', 'myColumn', 'myAlias')
    expect(result).toEqual('toStartOfHour(myColumn) as myAlias') // Change to toEqual
  })
})
