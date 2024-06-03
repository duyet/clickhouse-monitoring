import { ChevronDownIcon, SlashIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

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
import { fetchDataWithCache } from '@/lib/clickhouse'

import { listDatabases } from '../queries'

interface Props {
  database: string
}

interface DatabaseCount {
  name: string
  count: number
}

export async function DatabaseBreadcrumb({ database }: Props) {
  // Default
  let databases: { name: string; count: number }[] = [
    { name: database, count: 0 },
  ]

  try {
    // List database names and number of tables
    const { data: databases }: { data: DatabaseCount[] } =
      await fetchDataWithCache()({
        query: listDatabases,
      })

    if (!databases.length) {
      return (
        <ErrorAlert title="Message" message="Empty" query={listDatabases} />
      )
    }

    return <Internal current={database} databases={databases} />
  } catch (e: any) {
    return (
      <ErrorAlert
        title="Breadcrumb: could not getting list database"
        message={`${e}`}
        query={listDatabases}
      />
    )
  }
}

export async function DatabaseBreadcrumbSkeleton({ database }: Props) {
  return (
    <Internal
      current={database}
      databases={[
        { name: database, count: 0 },
        { name: 'Loading ...', count: 0 },
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
          <BreadcrumbLink href="/database">Database</BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator>
          <SlashIcon />
        </BreadcrumbSeparator>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1">
            {current} ({currentCount} {currentCount == 1 ? 'table' : 'tables'})
            <ChevronDownIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {databases.map(({ name, count }) => (
              <DropdownMenuItem key={name}>
                <Link
                  href={`/database/${name}`}
                  className={name == current ? 'font-bold' : ''}
                >
                  {name}
                </Link>
                <div className="ml-auto flex pl-2">({count})</div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
