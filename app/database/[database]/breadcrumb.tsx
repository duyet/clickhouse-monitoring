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

export async function DatabaseBreadcrumb({ database }: Props) {
  let databases: { name: string; count: number }[] = []
  try {
    // List database names and number of tables
    databases = await fetchDataWithCache()({
      query: listDatabases,
    })

    if (!databases.length) {
      return (
        <ErrorAlert title="Message" message="Empty" query={listDatabases} />
      )
    }
  } catch (e: any) {
    return (
      <ErrorAlert
        title="Breadcrumb: could not getting list database"
        message={`${e}`}
        query={listDatabases}
      />
    )
  }

  let currentCount = databases.find((db) => db.name === database)?.count

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
            {database} ({currentCount} {currentCount == 1 ? 'table' : 'tables'})
            <ChevronDownIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {databases.map(({ name, count }) => (
              <DropdownMenuItem key={name}>
                <Link
                  href={`/database/${name}`}
                  className={name == database ? 'font-bold' : ''}
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
