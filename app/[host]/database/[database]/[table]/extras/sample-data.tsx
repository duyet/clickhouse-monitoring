import { ErrorAlert } from '@/components/error-alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fetchData } from '@/lib/clickhouse'
import { getHostIdCookie } from '@/lib/scoped-link'

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
  let data: { data: { [key: string]: string }[] } = { data: [] }
  try {
    const hostId = await getHostIdCookie()
    data = await fetchData({
      query: `SELECT *
       FROM ${database}.${table}
       LIMIT ${limit}`,
      query_params: {
        database,
        table,
      },
      hostId,
    })
  } catch (error) {
    console.error(error)

    return (
      <ErrorAlert
        title="Could not getting sample data"
        message={`${error}`}
        className="w-full"
      />
    )
  }

  if (!data.data?.length) {
    return <span className="text-muted-foreground">No rows</span>
  }

  const headers = Object.keys(data.data[0])

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
          {data.data.map((row, idx) => (
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
