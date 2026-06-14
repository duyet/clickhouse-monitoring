import { createFileRoute } from '@tanstack/react-router'

import { useCallback } from 'react'
import { SqlConsole } from '@/components/sql-console'
import { usePathname, useRouter, useSearchParams } from '@/lib/next-compat'
import { useHostId } from '@/lib/swr'

/** Decode the shareable base64 `q` param into SQL (mirrors the explorer). */
function decodeQ(q: string | null): string {
  if (!q) return ''
  try {
    return decodeURIComponent(atob(q))
  } catch {
    return ''
  }
}

function SqlConsolePage() {
  const hostId = useHostId()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const initialSql =
    decodeQ(searchParams.get('q')) || 'SELECT * FROM system.tables LIMIT 100'

  // Keep the committed query in the URL (?q=) so SQL Console links are shareable.
  const onQueryCommitted = useCallback(
    (sql: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('q', btoa(encodeURIComponent(sql)))
      router.replace(`${pathname}?${params.toString()}`)
    },
    [searchParams, router, pathname]
  )

  return (
    <div className="flex h-[calc(100dvh-6rem)] flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">SQL Console</h1>
          <p className="text-muted-foreground text-sm">
            Run read-only SQL with history, EXPLAIN, query log and scan
            analysis.
          </p>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <SqlConsole
          // Remount the console when the host changes so editor/runner state resets.
          key={hostId}
          hostId={hostId}
          initialSql={initialSql}
          variant="page"
          onQueryCommitted={onQueryCommitted}
        />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/(dashboard)/sql')({
  component: SqlConsolePage,
})
