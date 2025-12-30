'use server'

import { fetchData } from '@/lib/clickhouse'
import { ErrorLogger } from '@/lib/error-logger'
import { getHostIdCookie } from '@/lib/scoped-link'
import type { Row, RowData } from '@tanstack/react-table'
import type { ActionResponse } from './types'

export async function killQuery<TValue>(
  queryId: TValue,
  _formData: FormData
): Promise<ActionResponse> {
  const hostId = await getHostIdCookie()
  const { error } = await fetchData({
    query: `KILL QUERY WHERE query_id = {queryId: String}`,
    query_params: { queryId },
    hostId,
  })

  if (error) {
    ErrorLogger.logError(error, { action: 'killQuery', queryId: String(queryId) })
    return {
      action: 'toast',
      message: `Failed to kill query ${queryId}: ${error.message}`,
    }
  }

  return {
    action: 'toast',
    message: `Killed query ${queryId}`,
  }
}

export async function explainQuery<TData extends RowData>(
  row: Row<TData>,
  _formData: FormData
): Promise<ActionResponse> {
  return {
    action: 'redirect',
    message: `/explain?query=${encodeURIComponent(row.getValue('query') || '')}`,
  }
}

export async function optimizeTable<TValue>(
  table: TValue,
  _formData: FormData
): Promise<ActionResponse> {
  const hostId = await getHostIdCookie()
  const { error } = await fetchData({
    query: `OPTIMIZE TABLE {table: String}`,
    query_params: { table },
    hostId,
  })

  if (error) {
    ErrorLogger.logError(error, { action: 'optimizeTable', table: String(table) })
    return {
      action: 'toast',
      message: `Failed to optimize table ${table}: ${error.message}`,
    }
  }

  return {
    action: 'toast',
    message: `Running query optimize table ${table}`,
  }
}

export async function querySettings<TValue>(
  queryId: TValue,
  _formData: FormData
): Promise<ActionResponse> {
  const hostId = await getHostIdCookie()
  const { data, error } = await fetchData<{ Settings: string }[]>({
    query: `SELECT Settings FROM system.processes WHERE query_id = {queryId: String}`,
    query_params: { queryId },
    hostId,
  })

  if (error) {
    ErrorLogger.logError(error, { action: 'querySettings', queryId: String(queryId) })
    return {
      action: 'toast',
      message: `Failed to get query settings ${queryId}: ${error.message}`,
    }
  }

  return {
    action: 'toast',
    message: JSON.stringify(data),
  }
}
