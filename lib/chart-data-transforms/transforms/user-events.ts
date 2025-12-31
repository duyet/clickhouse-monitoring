/**
 * User event count transformation utilities.
 *
 * These functions transform raw query event data into structured formats
 * suitable for stacked bar charts showing user activity over time.
 */

import type { UserEventCountsTransformed } from '../types'

/**
 * Transforms an array of user event counts into a structured format for stacked bar charts.
 *
 * This function performs a single-pass transformation that:
 * 1. Collects all unique users (sorted alphabetically for consistent coloring)
 * 2. Creates a nested record structure (time -> user -> count)
 * 3. Generates flattened chart data compatible with charting libraries
 *
 * @template T - The event_time field name (default: "event_time")
 * @param data - Array of items with event_time, user, and count fields
 * @param timeField - Custom time field name (defaults to "event_time")
 * @returns Transformed data with nested structure, sorted users, and chart-ready data
 *
 * @example
 * ```ts
 * const input = [
 *   { event_time: '2024-01-01', user: 'alice', count: 5 },
 *   { event_time: '2024-01-01', user: 'bob', count: 3 },
 *   { event_time: '2024-01-02', user: 'alice', count: 7 },
 * ]
 *
 * const result = transformUserEventCounts(input)
 * // result.data = { '2024-01-01': { alice: 5, bob: 3 }, '2024-01-02': { alice: 7 } }
 * // result.users = ['alice', 'bob']
 * // result.chartData = [{ event_time: '2024-01-01', alice: 5, bob: 3 }, ...]
 * ```
 */
export function transformUserEventCounts<
  T extends string = 'event_time',
>(
  data: readonly Record<string, unknown>[],
  timeField: T = 'event_time' as T
): UserEventCountsTransformed<T> {
  const userSet = new Set<string>()
  const nestedData = data.reduce<Record<string, Record<string, number>>>(
    (acc, item) => {
      const event_time = String(item.event_time ?? '')
      const user = String(item.user ?? '')
      const count = Number(item.count ?? 0)

      userSet.add(user)

      if (acc[event_time] === undefined) {
        acc[event_time] = {}
      }

      acc[event_time][user] = count
      return acc
    },
    {}
  )

  const users = Array.from(userSet).sort()

  const chartData = Object.entries(nestedData).map(([time, userCounts]) => {
    const entry: Record<string, number | string> = { [timeField]: time }
    Object.entries(userCounts).forEach(([user, count]) => {
      entry[user] = count
    })
    return entry as Record<T, string> & Record<string, number>
  })

  return {
    data: nestedData as Record<T, Record<string, number>>,
    users,
    chartData,
  }
}
