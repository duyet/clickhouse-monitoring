import { Database } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ErrorAlert } from '@/components/error-alert'
import { fetchData } from '@/lib/clickhouse'
import { cn } from '@/lib/utils'

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

export async function Nav({ host, database, collapsible }: Props) {
  let databases: DatabaseCount[] = []

  try {
    // List database names and number of tables
    const data = (await fetchData({
      query: listDatabases,
      clickhouse_settings: {
        use_query_cache: 1,
        query_cache_system_table_handling: 'save',
        query_cache_ttl: 300,
      },
    })) satisfies { data: DatabaseCount[] }

    databases = data.data
  } catch (e: any) {
    return (
      <ErrorAlert
        title="Breadcrumb: could not getting list database"
        message={`${e}`}
        query={listDatabases}
      />
    )
  }

  if (!databases.length) {
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
    <div className="">
      <div className="space-y-1">
        {databases.map((db) => (
          <Link
            key={db.name}
            href={`/${host}/database/${db.name}`}
            className={cn(
              'inline-flex h-9 w-full items-center justify-start gap-2 rounded-md text-sm transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              'disabled:pointer-events-none disabled:opacity-50',
              db.name === current && 'bg-secondary'
            )}
          >
            <div className="inline-flex w-full items-center justify-start gap-2 p-2">
              <Database className="m-0 h-4 w-4 flex-none p-0" />
              <span className="flex-1 overflow-hidden truncate">{db.name}</span>
              <span className="ml-auto overflow-hidden">({db.count})</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
