'use client'

import { Database, Server, Table as TableIcon } from 'lucide-react'

import { useExplorerState } from './hooks/use-explorer-state'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface ExplorerBreadcrumbProps {
  hostName?: string
}

export function ExplorerBreadcrumb({ hostName }: ExplorerBreadcrumbProps) {
  const { hostId, database, table } = useExplorerState()

  return (
    <Breadcrumb data-role="explorer-breadcrumb">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              href={`/explorer?host=${hostId}`}
              className="flex items-center gap-1.5"
            >
              <Server className="size-3.5" />
              {hostName || `Host ${hostId}`}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {database && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {table ? (
                <BreadcrumbLink asChild>
                  <Link
                    href={`/explorer?host=${hostId}&database=${encodeURIComponent(database)}`}
                    className="flex items-center gap-1.5"
                  >
                    <Database className="size-3.5" />
                    {database}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="flex items-center gap-1.5">
                  <Database className="size-3.5" />
                  {database}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}

        {table && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1.5">
                <TableIcon className="size-3.5" />
                {table}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
