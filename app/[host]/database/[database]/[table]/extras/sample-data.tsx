import { ErrorAlert } from '@/components/error-alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { fetchData } from '@/lib/clickhouse-helpers'
import {
  formatErrorMessage,
  formatErrorTitle,
  getErrorDocumentation,
} from '@/lib/error-utils'
import {
  escapeQualifiedIdentifier,
  validateLimit,
} from '@/lib/sql-utils'

interface SampleDataProps {
  database: string
  table: string
  limit?: number
  className?: string
}

export async function SampleData({
  database,
  table,
  limit = 10,
  className,
}: SampleDataProps) {
  // Validate and sanitize inputs to prevent SQL injection
  let sanitizedLimit: number
  try {
    sanitizedLimit = validateLimit(limit)
  } catch (error) {
    return (
      <ErrorAlert
        title="Invalid limit parameter"
        message={error instanceof Error ? error.message : 'Invalid limit value'}
        className="w-full"
      />
    )
  }

  // Escape database and table names to prevent SQL injection
  const qualifiedTable = escapeQualifiedIdentifier(database, table)

  const { data, error } = await fetchData<{ [key: string]: string }[]>({
    query: `SELECT *
     FROM ${qualifiedTable}
     LIMIT ${sanitizedLimit}`,
    query_params: {},
  })

  if (error) {
    // Error logging - will be removed in a later fix
    return (
      <ErrorAlert
        title={formatErrorTitle(error)}
        message={formatErrorMessage(error)}
        docs={getErrorDocumentation(error)}
        className="w-full"
      />
    )
  }

  if (!data?.length) {
    return <span className="text-muted-foreground">No rows</span>
  }

  const headers = Object.keys(data[0])

  return (
    <div className="w-full overflow-auto">
      <Table className={className}>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx}>
              {Object.values(row).map((value) => {
                if (typeof value === 'object') {
                  return (
                    <TableCell key={value}>
                      <pre className="overflow-auto hover:text-clip">
                        <code>{JSON.stringify(value, null, 2)}</code>
                      </pre>
                    </TableCell>
                  )
                }

                return <TableCell key={value}>{value}</TableCell>
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
