import { useExplorerState } from '../hooks/use-explorer-state'
import { useCallback, useMemo } from 'react'
import { SqlConsole } from '@/components/sql-console'
import { useHostId } from '@/lib/swr/use-host'

/**
 * Explorer "Query" tab — a thin adapter around the shared <SqlConsole/>.
 *
 * The previous bespoke implementation force-mounted CodeMirror and hid it with
 * display:none on tab switch, which froze the page (CM ResizeObserver loops on a
 * 0×0 box). SqlConsole keeps the editor always-mounted and visible, with only
 * the result area tabbed — so the freeze cannot recur. The committed query syncs
 * to the explorer URL (?q=) via setCustomQuery, preserving shareable links.
 */
export function QueryTab() {
  const hostId = useHostId()
  const { database, table, customQuery, setCustomQuery, setDefaultDatabase } =
    useExplorerState()

  const initialSql = useMemo(() => {
    if (customQuery) return customQuery
    if (database && table) {
      return `SELECT *\nFROM \`${database}\`.\`${table}\`\nLIMIT 100`
    }
    return 'SELECT * FROM system.tables LIMIT 100'
  }, [customQuery, database, table])

  const onQueryCommitted = useCallback(
    (sql: string) => {
      setCustomQuery(sql)
    },
    [setCustomQuery]
  )

  return (
    <SqlConsole
      // Reset editor/runner when the table context changes — but NOT when only
      // the default database changes (the picker should preserve the query).
      key={`${hostId}:${table ?? ''}`}
      hostId={hostId}
      initialSql={initialSql}
      variant="embedded"
      onQueryCommitted={onQueryCommitted}
      database={database ?? undefined}
      onDatabaseChange={(db) => setDefaultDatabase(db ?? null)}
    />
  )
}
