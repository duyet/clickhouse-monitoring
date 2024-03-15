import Link from 'next/link'
import { ChevronDownIcon, SlashIcon } from '@radix-ui/react-icons'

import { fetchDataWithCache } from '@/lib/clickhouse'
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
import { ErrorAlert } from '@/components/error-alert'

import { listDatabases } from '../queries'

interface TableListProps {
  params: {
    database: string
  }
  children: React.ReactNode
}

export const revalidate = 600

export default async function TableListPage({
  params: { database },
  children,
}: TableListProps) {
  let databases: { name: string; count: number }[] = []
  try {
    // List database names and number of tables
    databases = await fetchDataWithCache()(listDatabases)

    if (!databases.length) {
      return <ErrorAlert title="Message" message="Empty" />
    }
  } catch (e: any) {
    return (
      <ErrorAlert title="Could not getting list database" message={`${e}`} />
    )
  }

  let currentCount = databases.find((db) => db.name === database)?.count

  return (
    <div className="flex flex-col gap-5">
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
              {database} ({currentCount}{' '}
              {currentCount == 1 ? 'table' : 'tables'})
              <ChevronDownIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {databases.map(({ name, count }) => (
                <DropdownMenuItem key={name}>
                  <Link
                    href={`/database/${name}`}
                    className={name == database ? 'font-bold' : ''}
                  >
                    {name} ({count})
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbList>
      </Breadcrumb>

      {children}
    </div>
  )
}
