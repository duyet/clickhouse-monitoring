import { fetchData } from '@/lib/clickhouse'

export const getDefaultDatabase = async (host: string) => {
  const databases = await getDatabases(host)
  return databases?.[0] || ''
}

export const getDefaultTable = async (host: string, database: string) => {
  const tables = await getTables(host, database)
  return tables?.[0] || ''
}

export const getDatabases = async (host: string): Promise<string[]> => {
  const items = await getDatabaseTables(host)
  return items
    .map((item) => item.database)
    .reduce((acc, curr) => {
      if (!acc.includes(curr)) {
        acc.push(curr)
      }
      return acc
    }, [] as string[])
}

export const getTables = async (
  host: string,
  database: string
): Promise<string[]> => {
  const items = await getDatabaseTables(host)
  return items
    .filter((item) => item.database === database)
    .map((item) => item.table)
}

export const getDatabaseTables = async (host: string) => {
  const { data } = await fetchData<{ database: string; table: string }[]>({
    query:
      "SELECT DISTINCT database, table FROM system.parts WHERE active AND lower(database) NOT IN ('system', 'information_schema')",
    query_params: {},
    clickhouse_settings: {
      use_query_cache: 1,
    },
    hostId: host,
  })

  return (
    data?.map((table: { database: string; table: string }) => ({
      database: table.database,
      table: table.table,
    })) || []
  )
}
