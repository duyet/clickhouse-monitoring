'use server'

import { fetchData } from '@/lib/clickhouse'
import type { Row, RowData } from '@tanstack/react-table'
import type { ActionResponse } from './types'

export async function killQuery<TValue>(
  queryId: TValue,
  _formData: FormData
): Promise<ActionResponse> {
  console.log('Killing query', queryId)
  const { data, error } = await fetchData({
    query: `KILL QUERY WHERE query_id = '${queryId}'`,
  })

  if (error) {
    console.error('Failed to kill query', queryId, error)
    return {
      action: 'toast',
      message: `Failed to kill query ${queryId}: ${error.message}`,
    }
  }

  console.log('Killed query', queryId, data)
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
    message:
      '/explain?query=' + encodeURIComponent(row.getValue('query') || ''),
  }
}

export async function optimizeTable<TValue>(
  table: TValue,
  _formData: FormData
): Promise<ActionResponse> {
  console.log('Optimize table', table)
  const { data, error } = await fetchData({ query: `OPTIMIZE TABLE ${table}` })

  if (error) {
    console.error('Failed to optimize table', table, error)
    return {
      action: 'toast',
      message: `Failed to optimize table ${table}: ${error.message}`,
    }
  }

  console.log('Optimize table', table, data)
  return {
    action: 'toast',
    message: `Running query optimize table ${table}`,
  }
}

export async function querySettings<TValue>(
  queryId: TValue,
  _formData: FormData
): Promise<ActionResponse> {
  console.log('Getting query SETTINGS', queryId)
  const { data, error } = await fetchData<{ Settings: string }[]>({
    query: `SELECT Settings FROM system.processes WHERE query_id = {queryId: String}`,
    query_params: { queryId },
  })

  if (error) {
    console.error('Failed to get query settings', queryId, error)
    return {
      action: 'toast',
      message: `Failed to get query settings ${queryId}: ${error.message}`,
    }
  }

  console.log('Query SETTINGS', queryId, data)
  return {
    action: 'toast',
    message: JSON.stringify(data),
  }
}
