import { HistoryQueriesButton } from './history-queries-button'
import { RunningQueriesButton } from './runnning-queries-button'
import { SampleDataButton } from './sample-data-button'
import { ShowDDL } from './show-ddl-button'
import { TableInfo } from './table-info'
import { TableSelector } from './table-selector'
import { TopUsageColumnsButton } from './top-usage-columns-button'

export const Extras = ({
  hostId,
  database,
  table,
}: {
  hostId?: number
  database: string
  table: string
}) => (
  <div className="mb-3 flex flex-row flex-wrap justify-between gap-3">
    <div className="flex flex-row gap-3">
      <TableSelector database={database} table={table} />
    </div>

    <div className="flex flex-row flex-wrap gap-3">
      <ShowDDL database={database} table={table} />
      <TableInfo hostId={hostId} database={database} table={table} />
      <SampleDataButton database={database} table={table} />
      <RunningQueriesButton database={database} table={table} />
      <HistoryQueriesButton database={database} table={table} />
      <TopUsageColumnsButton database={database} table={table} />
    </div>
  </div>
)
