import { ChevronDownIcon, SlashIcon } from '@radix-ui/react-icons'
import Link from 'next/link'
import React from 'react'

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
import { getScopedLink } from '@/lib/scoped-link'

interface Props {
  database: string
}

interface DatabaseCount {
  name: string
  count: number
}

export async function DatabaseBreadcrumbSkeleton({ database }: Props) {
  return (
    <DatabaseBreadcrumb
      current={database}
      databases={[
        { name: database, count: -1 },
        { name: 'Loading ...', count: -1 },
      ]}
    />
  )
}

export async function DatabaseBreadcrumb({
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
          <BreadcrumbLink href={await getScopedLink('/database')}>
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
            {databases.map(async ({ name, count }) => (
              <DropdownMenuItem key={name}>
                <Link
                  href={await getScopedLink(`/database/${name}`)}
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
