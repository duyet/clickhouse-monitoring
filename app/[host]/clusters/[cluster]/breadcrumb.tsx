import { ChevronDownIcon, SlashIcon } from '@radix-ui/react-icons'
import Link from 'next/link'
import { use } from 'react'

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
import {
  formatErrorMessage,
  formatErrorTitle,
  getErrorDocumentation,
} from '@/lib/error-utils'
import { getScopedLink } from '@/lib/scoped-link'
import { queryConfig, type Row } from '../config'

interface Props {
  cluster: string
}

export async function ClusterListBreadcrumb({ cluster }: Props) {
  // Lists cluster names.
  const { data, error } = await fetchData<Row[]>({ query: queryConfig.sql })

  if (error) {
    return (
      <ErrorAlert
        title={formatErrorTitle(error)}
        message={formatErrorMessage(error)}
        docs={getErrorDocumentation(error)}
      />
    )
  }

  if (!data?.length) {
    return (
      <ErrorAlert
        title="Message"
        message="No cluster found on system.clusters"
      />
    )
  }

  return <Internal cluster={cluster} clusters={data} />
}

export function ClusterListBreadcrumbSkeleton({ cluster }: Props) {
  return (
    <Internal
      cluster={cluster}
      clusters={[
        {
          cluster: cluster,
          replica_count: 0,
          count_replica: '0',
          shard_count: 0,
        },
        {
          cluster: 'Loading ...',
          replica_count: 0,
          count_replica: '0',
          shard_count: 0,
        },
      ]}
    />
  )
}

function Internal({ cluster, clusters }: Props & { clusters: Row[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={use(getScopedLink('/clusters'))}>
            Clusters
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator>
          <SlashIcon />
        </BreadcrumbSeparator>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1">
            {cluster}
            <ChevronDownIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {clusters.map(({ cluster: name, replica_count }) => (
              <DropdownMenuItem key={name}>
                <Link
                  href={use(getScopedLink(`/clusters/${name}/replicas-status`))}
                  className={name == cluster ? 'font-bold' : ''}
                >
                  {name} ({replica_count}{' '}
                  {replica_count > 1 ? 'replicas' : 'replica'})
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
