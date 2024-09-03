import { ArrowLeftIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { AlternativeTables } from './alternative-tables'
import { RunningQueriesButton } from './runnning-queries-button'
import { SampleDataButton } from './sample-data-button'
import { ShowDDL } from './show-ddl-button'
import { TableInfo } from './table-info'

export const Extras = ({
  database,
  table,
}: {
  database: string
  table: string
}) => (
  <div className="mb-3 flex flex-row justify-between gap-3">
    <div className="flex flex-row gap-3">
      <Link href={`/database/${database}`}>
        <Button
          variant="outline"
          size="sm"
          className="flex flex-row gap-2 text-muted-foreground"
        >
          <ArrowLeftIcon className="size-3" />
          Back to {database}
        </Button>
      </Link>
      <AlternativeTables database={database} table={table} />
    </div>

    <div className="flex flex-row gap-3">
      <ShowDDL database={database} table={table} />
      <TableInfo database={database} table={table} />
      <SampleDataButton database={database} table={table} />
      <RunningQueriesButton database={database} table={table} />
    </div>
  </div>
)
