/**
 * Settings Diff API Endpoint
 * GET /api/v1/settings-diff
 *
 * Returns a cross-host diff of system.settings and system.merge_tree_settings.
 * For each setting name, reports per-host values and flags:
 *   - hasDiff: values differ across hosts
 *   - changedFromDefault: at least one host has changed=1
 */

import { createFileRoute } from '@tanstack/react-router'

import { env } from 'cloudflare:workers'
import { fetchData } from '@chm/clickhouse-client'
import { bridgeClickHouseEnv } from '@/lib/api/server-env'
import { getClickHouseConfigsFromEnv } from '@/lib/api/clickhouse-config'

const SETTINGS_QUERY = `
  SELECT name, value, changed, description, default AS defaultValue
  FROM system.settings
  ORDER BY name
`

const MERGE_TREE_QUERY = `
  SELECT name, value, changed, description, default AS defaultValue
  FROM system.merge_tree_settings
  ORDER BY name
`

type SettingRow = {
  name: string
  value: string
  changed: number
  description: string
  defaultValue: string
}

type DiffRow = {
  name: string
  table: 'settings' | 'merge_tree_settings'
  values: Record<
    number,
    { value: string; changed: number; defaultValue: string }
  >
  hasDiff: boolean
  changedFromDefault: boolean
}

export const Route = createFileRoute('/api/v1/settings-diff')({
  server: {
    handlers: {
      GET: async () => {
        bridgeClickHouseEnv(env as Record<string, string | undefined>)

        const configs = getClickHouseConfigsFromEnv(
          env as Record<string, string | undefined>
        )

        if (configs.length === 0) {
          return Response.json(
            { success: false, error: 'No ClickHouse hosts configured' },
            { status: 503 }
          )
        }

        // Fan out: for each host × each table, fire one query. That's 2×N promises.
        type FetchTask = {
          hostId: number
          table: 'settings' | 'merge_tree_settings'
          query: string
        }

        const tasks: FetchTask[] = configs.flatMap((cfg) => [
          { hostId: cfg.id, table: 'settings', query: SETTINGS_QUERY },
          {
            hostId: cfg.id,
            table: 'merge_tree_settings',
            query: MERGE_TREE_QUERY,
          },
        ])

        const results = await Promise.allSettled(
          tasks.map((t) =>
            fetchData<SettingRow[]>({
              query: t.query,
              hostId: t.hostId,
              format: 'JSONEachRow',
            }).then((r) => ({ ...t, result: r }))
          )
        )

        // Merge into a map keyed by `${table}::${name}`
        // For each key, collect per-host value/changed/defaultValue
        const diffMap = new Map<string, DiffRow>()

        for (const outcome of results) {
          if (outcome.status === 'rejected') continue
          const { hostId, table, result } = outcome.value
          if (result.error || !result.data) continue

          for (const row of result.data) {
            const key = `${table}::${row.name}`
            if (!diffMap.has(key)) {
              diffMap.set(key, {
                name: row.name,
                table,
                values: {},
                hasDiff: false,
                changedFromDefault: false,
              })
            }
            const entry = diffMap.get(key)!
            entry.values[hostId] = {
              value: row.value,
              changed: row.changed,
              defaultValue: row.defaultValue,
            }
          }
        }

        // Compute hasDiff and changedFromDefault for each entry
        const rows: DiffRow[] = []
        for (const entry of diffMap.values()) {
          const hostValues = Object.values(entry.values)
          const uniqueValues = new Set(hostValues.map((v) => v.value))
          entry.hasDiff = uniqueValues.size > 1
          entry.changedFromDefault = hostValues.some((v) => v.changed === 1)
          rows.push(entry)
        }

        // Sort: diffs first, then alphabetically by table then name
        rows.sort((a, b) => {
          if (a.hasDiff !== b.hasDiff) return a.hasDiff ? -1 : 1
          if (a.table !== b.table) return a.table.localeCompare(b.table)
          return a.name.localeCompare(b.name)
        })

        const hosts = configs.map((c) => ({
          id: c.id,
          name: c.customName ?? c.host,
        }))

        return Response.json({ success: true, hosts, rows })
      },
    },
  },
})
