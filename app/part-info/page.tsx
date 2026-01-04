'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { DatabaseTableSelector } from '@/components/controls/database-table-selector'
import { TableSkeleton } from '@/components/skeletons'
import { TableClient } from '@/components/tables/table-client'
import { partInfoConfig } from '@/lib/query-config/tables/part-info'
import { useHostId } from '@/lib/swr'

function PartInfoContent() {
  const searchParams = useSearchParams()
  const hostId = useHostId()
  const database = searchParams.get('database')
  const table = searchParams.get('table')

  const explorerUrl =
    database && table
      ? `/explorer?host=${hostId}&database=${database}&table=${table}`
      : null

  return (
    <div className="flex flex-col gap-4">
      {/* Database and Table Selector */}
      <div className="bg-card rounded-lg border p-4 flex items-center justify-between gap-4">
        <DatabaseTableSelector />
        {explorerUrl && (
          <Link
            href={explorerUrl}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
          >
            View in Explorer →
          </Link>
        )}
      </div>

      {/* Table Content */}
      {database && table ? (
        <Suspense fallback={<TableSkeleton />}>
          <TableClient
            title={`Parts: ${database}.${table}`}
            description={partInfoConfig.description}
            queryConfig={partInfoConfig}
            searchParams={{ database, table }}
          />
        </Suspense>
      ) : (
        <div className="bg-card flex h-96 items-center justify-center rounded-lg border">
          <p className="text-muted-foreground text-sm">
            Select a database and table to view part information.
          </p>
        </div>
      )}
    </div>
  )
}

export default function PartInfoPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <PartInfoContent />
    </Suspense>
  )
}
