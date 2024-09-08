import { ChevronDownIcon, SlashIcon } from '@radix-ui/react-icons'
import Link from 'next/link'
import React from 'react'

import { ErrorAlert } from '@/components/error-alert'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { fetchData } from '@/lib/clickhouse'
import { getScopedLink, redirectScoped } from '@/lib/scoped-link'
import { listDatabases } from '../queries'

interface Props {
  database: string
}

interface DatabaseCount {
  name: string
  count: number
}

export async function DatabaseBreadcrumb({ database }: Props) {
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
    redirectScoped('/database/' + databases[0].name)
  }

  return <Internal current={database} databases={databases} />
}

export async function DatabaseBreadcrumbSkeleton({ database }: Props) {
  return (
    <Internal
      current={database}
      databases={[
        { name: database, count: -1 },
        { name: 'Loading ...', count: -1 },
      ]}
    />
  )
}

function Internal({
  current,
  databases,
}: {
  current: string
  databases: DatabaseCount[]
}) {
  let currentCount = databases.find((db) => db.name === current)?.count

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={getScopedLink('/database')}>
            Database
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator>
          <SlashIcon />
        </BreadcrumbSeparator>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1">
            {current} (<Count count={currentCount} />)
            <ChevronDownIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {databases.map(({ name, count }) => (
              <DropdownMenuItem key={name}>
                <Link
                  href={getScopedLink(`/database/${name}`)}
                  className={name == current ? 'font-bold' : ''}
                >
                  {name}
                </Link>
                <div className="ml-auto flex pl-2">
                  (<Count count={count} />)
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

const Count = React.memo(({ count }: { count?: number }) => {
  if (count == undefined || count == -1) return 'loading ...'
  if (count == 0) return '0 table'
  if (count == 1) return '1 table'
  return `${count} tables`
})
Count.displayName = 'Count'
