'use server'

import { fetchData } from '@/lib/clickhouse'
import { ClickHouseSettings } from '@clickhouse/client'

export type ActionError = {
  error: string | null
}

export type Explains = {
  PLAN: ExplainResponse
  PIPELINE: ExplainResponse
  ESTIMATE: ExplainResponse
  SYNTAX: ExplainResponse
  'QUERY TREE': ExplainResponse
  AST: ExplainResponse
}

export type ExplainResponse = {
  explain: string
  sql: string
}

export type ExplainType = keyof Explains

const preprocessQuery = (query: string): string => {
  // Remove "Format {Format}"
  query = query.replace(/FORMAT\s+\w+/i, '')

  // Remove comments
  query = query.replace(/\/\*.*?\*\//g, '')

  return query
}

export async function explainAction(
  prevState: Explains,
  formData: FormData
): Promise<Explains & Partial<ActionError>> {
  let newState = { ...prevState, error: '' }

  const inputQuery = formData.get('query') as string
  if (!inputQuery) return prevState

  const query = preprocessQuery(inputQuery)

  const explainKind = async (
    kind: ExplainType,
    query: string,
    clickhouse_settings: ClickHouseSettings = {}
  ): Promise<ExplainResponse> => {
    const sql = `EXPLAIN ${kind} ${query}`

    const { data, error } = await fetchData<{ explain: string }[]>({
      query: sql,
      clickhouse_settings,
    })

    if (error) {
      if (
        kind == 'QUERY TREE' &&
        error.message.includes('only supported with a new analyzer')
      ) {
        return explainKind(kind, query, { allow_experimental_analyzer: 1 })
      }

      console.error(error)
      return { explain: error.message, sql }
    }

    if (!data || data.length === 0) {
      return { explain: 'Ok.', sql }
    }

    let raw = ''
    for (const row of data) {
      raw += row.explain + '\n'
    }

    return { explain: raw, sql }
  }

  const kinds = Object.keys(prevState).filter(
    (key) => key !== 'error'
  ) as ExplainType[]
  const responses = await Promise.all(
    kinds.map((kind) => explainKind(kind, query))
  )

  return responses.reduce(
    (acc, response, index) => ({ ...acc, [kinds[index]]: response }),
    newState as Explains & Partial<ActionError>
  )
}
