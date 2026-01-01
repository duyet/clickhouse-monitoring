'use client'

import { useExplorerState } from '../hooks/use-explorer-state'
import { TableClient } from '@/components/tables/table-client'
import { databaseTableColumnsConfig } from '@/lib/query-config/system/database-table'

export function StructureTab() {
  const { database, table } = useExplorerState()

  if (!database || !table) {
    return null
  }

  return (
    <TableClient
      title="Table Structure"
      description={`Column details for ${database}.${table}`}
      queryConfig={databaseTableColumnsConfig}
      searchParams={{ database, table }}
      enableColumnFilters
    />
  )
}
