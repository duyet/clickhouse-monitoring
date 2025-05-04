import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { DatabaseIcon } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

import { HistoryQueriesButton } from './history-queries-button'
import { RunningQueriesButton } from './runnning-queries-button'
import { SampleDataButton } from './sample-data-button'
import { ShowDDL } from './show-ddl-button'
import { TableInfo } from './table-info'
import { TableSelector } from './table-selector'
import { TopUsageColumnsButton } from './top-usage-columns-button'

export const Extras = ({
  host,
  database,
  table,
}: {
  host: number
  database: string
  table: string
}) => (
  <div className="mb-3 flex flex-row flex-wrap justify-between gap-3">
    <div className="flex flex-row gap-3">
      <Link href={`/${host}/database/${database}`}>
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground flex flex-row gap-2"
        >
          <ArrowLeftIcon className="size-3" />
          Back to{' '}
          <div className="inline-flex items-center gap-1">
            <DatabaseIcon className="size-3" /> {database}
          </div>
        </Button>
      </Link>
      <TableSelector database={database} table={table} />
    </div>

    <div className="flex flex-row flex-wrap gap-3">
      <ShowDDL database={database} table={table} />
      <TableInfo database={database} table={table} />
      <SampleDataButton database={database} table={table} />
      <RunningQueriesButton database={database} table={table} />
      <HistoryQueriesButton database={database} table={table} />
      <TopUsageColumnsButton database={database} table={table} />
    </div>
  </div>
)
