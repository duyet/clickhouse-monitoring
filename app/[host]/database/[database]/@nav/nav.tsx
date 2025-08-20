import { Database } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ErrorAlert } from '@/components/error-alert'
import { fetchDataWithHost } from '@/lib/clickhouse-helpers'
import {
  formatErrorMessage,
  formatErrorTitle,
  getErrorDocumentation,
} from '@/lib/error-utils'
import { cn } from '@/lib/utils'

import { cache } from 'react'
import { listDatabases } from '../../queries'
import { DatabaseBreadcrumb } from './breadcrumb'

interface Props {
  host: number
  database: string
  collapsible?: boolean
  isCollapsed?: boolean
}

interface DatabaseCount {
  name: string
  count: number
}

export const getListDatabaseCached = cache(async (hostId: number) => {
  return fetchDataWithHost({
    query: listDatabases,
    hostId,
    clickhouse_settings: {
      use_query_cache: 1,
      query_cache_system_table_handling: 'save',
      query_cache_ttl: 300,
    },
  })
})

export const preload = async (host: number) => {
  void (await getListDatabaseCached(host))
}

export async function Nav({ host, database, collapsible }: Props) {
  preload(host)
  const { data: databases, error } = (await getListDatabaseCached(host)) as {
    data: DatabaseCount[] | null
    error?: any
  }

  if (error) {
    return (
      <ErrorAlert
        title={formatErrorTitle(error)}
        message={formatErrorMessage(error)}
        docs={getErrorDocumentation(error)}
        query={listDatabases}
      />
    )
  }

  if (!databases?.length) {
    return (
      <ErrorAlert
        title="Message"
        message="No database found"
        query={listDatabases}
      />
    )
  }

  // Current database not found in database list
  if (!databases.find((db) => db.name === database)) {
    redirect(`/${host}/database/${databases[0].name}`)
  }

  if (collapsible) {
    return (
      <div>
        <div className="mb-2 block md:hidden">
          <DatabaseBreadcrumb current={database} databases={databases} />
        </div>

        <div className="hidden pb-12 md:block">
          <Sidebar host={host} current={database} databases={databases} />
        </div>
      </div>
    )
  }

  return (
    <div className="mb-2">
      <Sidebar host={host} current={database} databases={databases} />
    </div>
  )
}

function Sidebar({
  current,
  host,
  databases,
}: {
  current: string
  host: number
  databases: DatabaseCount[]
  isCollapsed?: boolean
}) {
  return (
    <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col p-2">
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden">
        {databases.map((db) => (
          <Link
            key={db.name}
            href={`/${host}/database/${db.name}`}
            className={cn(
              'inline-flex h-9 w-full items-center justify-start gap-2 rounded-md text-sm transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'focus-visible:ring-ring focus-visible:ring-1 focus-visible:outline-hidden',
              'disabled:pointer-events-none disabled:opacity-50',
              db.name === current && 'bg-secondary font-bold'
            )}
          >
            <div className="inline-flex w-full items-center justify-start gap-2 p-1">
              <Database className="m-0 h-4 w-4 flex-none p-0" />
              <span
                className={cn(
                  'flex-1 truncate overflow-hidden',
                  db.name === current && 'font-semibold'
                )}
              >
                {db.name}
              </span>
              <Count>{db.count}</Count>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

const Count = ({ children }: { children: React.ReactNode }) => (
  <span
    className={cn(
      'ml-auto overflow-hidden border-transparent',
      'focus:ring-ring inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-hidden',
      'text-primary-foreground hover:bg-primary/80 bg-gray-200'
    )}
  >
    {children}
  </span>
)
