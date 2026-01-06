import type { ApiResponseMetadata } from '@/lib/api/types'

import { memo } from 'react'
import { DialogSQL } from '@/components/dialogs/dialog-sql'
import { withQueryParams } from '@/lib/clickhouse-query'

interface ShowSQLButtonProps {
  sql?: string
  queryParams?: Record<string, string | number | boolean | undefined>
  /** Query execution metadata */
  metadata?: Partial<ApiResponseMetadata>
}

export const ShowSQLButton = memo(function ShowSQLButton({
  sql,
  queryParams,
  metadata,
}: ShowSQLButtonProps) {
  if (!sql) {
    return null
  }

  const formattedSql = withQueryParams(sql, queryParams)

  return <DialogSQL sql={formattedSql} metadata={metadata} />
})
