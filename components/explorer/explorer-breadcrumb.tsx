'use client'

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
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/explorer?host=${hostId}`}>
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
                  >
                    {database}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{database}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}

        {table && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{table}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
