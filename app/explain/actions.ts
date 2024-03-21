'use server'

import { fetchData } from '@/lib/clickhouse'

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

export async function explainAction(
  prevState: Explains,
  formData: FormData
): Promise<Explains> {
  const query = formData.get('query') as string
  if (!query) return prevState

  const explainKind = async (
    kind: ExplainType,
    query: string
  ): Promise<ExplainResponse> => {
    const sql = `EXPLAIN ${kind} ${query}`
    try {
      const data = await fetchData(sql, {})
      console.log(data)

      if (data.length === 0) {
        return { explain: 'Ok.', sql }
      }

      let raw = ''
      for (const row of data) {
        raw += row.explain + '\n'
      }

      return { explain: raw, sql }
    } catch (error) {
      console.error(error)
      return { explain: `${error}`, sql }
    }
  }

  const kinds = Object.keys(prevState) as ExplainType[]
  const responses = await Promise.all(
    kinds.map((kind) => explainKind(kind, query))
  )

  return responses.reduce(
    (acc, response, index) => ({ ...acc, [kinds[index]]: response }),
    {} as Explains
  )
}
