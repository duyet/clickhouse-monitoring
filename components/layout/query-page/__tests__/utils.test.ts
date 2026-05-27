import { CHARTS_PER_ROW, groupChartsIntoRows } from '../utils'
import { describe, expect, it } from 'bun:test'

describe('groupChartsIntoRows', () => {
  it('returns an empty array for empty input', () => {
    expect(groupChartsIntoRows([])).toEqual([])
  })

  it('groups items into rows of CHARTS_PER_ROW', () => {
    const items = [1, 2, 3, 4]
    const rows = groupChartsIntoRows(items)

    expect(rows).toHaveLength(Math.ceil(items.length / CHARTS_PER_ROW))
    expect(rows[0]).toHaveLength(CHARTS_PER_ROW)
  })

  it('places remaining items in a partial final row', () => {
    const items = [1, 2, 3]
    const rows = groupChartsIntoRows(items)

    // With CHARTS_PER_ROW = 2: [[1,2], [3]]
    expect(rows[rows.length - 1]).toHaveLength(items.length % CHARTS_PER_ROW)
  })

  it('does not mutate the input array', () => {
    const items = [1, 2, 3, 4, 5]
    const before = [...items]

    groupChartsIntoRows(items)

    expect(items).toEqual(before)
  })

  it('preserves item order across rows', () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    const rows = groupChartsIntoRows(items)

    expect(rows.flat()).toEqual(items)
  })

  it('handles a single-item input', () => {
    expect(groupChartsIntoRows(['only'])).toEqual([['only']])
  })
})
