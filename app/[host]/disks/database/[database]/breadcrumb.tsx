import { ChevronDownIcon, SlashIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

import { ErrorAlert } from '@/components/error-alert'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui'

import { fetchData } from '@/lib/clickhouse-helpers'
import { getScopedLink } from '@/lib/scoped-link'
import { use } from 'react'
import {
  databaseDiskSpaceConfig as queryConfig,
  type DatabaseUsedSpace,
} from '../../config'

interface Props {
  database: string
}

export async function DatabaseListBreadcrumb({ database }: Props) {
  try {
    // Lists cluster names.
    const { data, error } = await fetchData<DatabaseUsedSpace[]>({
      query: queryConfig.sql,
    })

    if (error) {
      return (
        <ErrorAlert
          title="Unable to retrieve the list of databases"
          message={error.message}
          errorType={error.type}
        />
      )
    }

    if (!data || !data.length) {
      return (
        <ErrorAlert
          title="Message"
          message="No database found on system.parts"
        />
      )
    }

    return <Internal database={database} databases={data} />
  } catch (e: any) {
    return (
      <ErrorAlert
        title="Unable to retrieve the list of databases"
        message={`${e}`}
      />
    )
  }
}

export function DatabaseListBreadcrumbSkeleton({ database }: Props) {
  return (
    <Internal
      database={database}
      databases={[
        {
          database,
          used_space: 0,
          readable_used_space: 'loading ...',
        },
        {
          database: 'Loading ...',
          used_space: 0,
          readable_used_space: 'loading ...',
        },
      ]}
    />
  )
}

function Internal({
  database,
  databases,
}: Props & { databases: DatabaseUsedSpace[] }) {
  const readable_used_space = databases.find(
    ({ database: name }) => name === database
  )?.readable_used_space

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={use(getScopedLink('/disks'))}>
            All Disks
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator>
          <SlashIcon />
        </BreadcrumbSeparator>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1">
            Database {database} ({readable_used_space})
            <ChevronDownIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {databases.map(({ database: name, readable_used_space }) => (
              <DropdownMenuItem key={name}>
                <Link
                  href={use(getScopedLink(`/disks/database/${name}`))}
                  className={name === database ? 'font-bold' : ''}
                >
                  {name} ({readable_used_space})
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
