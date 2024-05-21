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

import { config, type Row } from '../config'

interface ClusterListProps {
  params: {
    cluster: string
  }
  children: React.ReactNode
}

export const revalidate = 600

export default async function ClusterTabListLayout({
  params: { cluster },
  children,
}: ClusterListProps) {
  let clusters: Row[] = []

  try {
    // Lists cluster names.
    clusters = await fetchDataWithCache()<Row[]>({ query: config.sql })

    if (!clusters.length) {
      return (
        <ErrorAlert
          title="Message"
          message="No cluster found on system.clusters"
        />
      )
    }
  } catch (e: any) {
    return (
      <ErrorAlert title="Unable to retrieve the list of clusters" message={`${e}`} />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/clusters">Clusters</BreadcrumbLink>
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
                    href={`/clusters/${name}/replicas-status`}
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

      {children}
    </div>
  )
}

