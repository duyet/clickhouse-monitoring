import { ChartCard } from '@/components/chart-card'
import { type ChartProps } from '@/components/charts/chart-props'
import { BarList } from '@/components/tremor/bar-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchData } from '@/lib/clickhouse'

export async function ChartTopTableSize({
  title,
  className,
  ...props
}: ChartProps) {
  const limit = 7
  const topBySizeQuery = fetchData(`
      SELECT 
        (database || '.' || table) as table,
        sum(data_compressed_bytes) as compressed_bytes,
        sum(data_uncompressed_bytes) AS uncompressed_bytes,
        formatReadableSize(compressed_bytes) AS compressed,
        formatReadableSize(uncompressed_bytes) AS uncompressed,
        round(uncompressed_bytes / compressed_bytes, 2) AS compr_rate,
        sum(rows) AS total_rows,
        formatReadableQuantity(sum(rows)) AS readable_total_rows,
        count() AS part_count
    FROM system.parts
    WHERE (active = 1) AND (database != 'system') AND (table LIKE '%')
    GROUP BY 1
    ORDER BY compressed_bytes DESC
    LIMIT ${limit}
  `)

  const topByRowCountQuery = fetchData(`
      SELECT 
        (database || '.' || table) as table,
        sum(data_compressed_bytes) as compressed_bytes,
        sum(data_uncompressed_bytes) AS uncompressed_bytes,
        formatReadableSize(compressed_bytes) AS compressed,
        formatReadableSize(uncompressed_bytes) AS uncompressed,
        round(uncompressed_bytes / compressed_bytes, 2) AS compr_rate,
        sum(rows) AS total_rows,
        formatReadableQuantity(sum(rows)) AS readable_total_rows,
        count() AS part_count
    FROM system.parts
    WHERE (active = 1) AND (database != 'system') AND (table LIKE '%')
    GROUP BY 1
    ORDER BY total_rows DESC
    LIMIT ${limit}
  `)

  const [topBySize, topByRowCount] = await Promise.all([
    topBySizeQuery,
    topByRowCountQuery,
  ])

  const dataTopBySize = topBySize.map((row) => ({
    name: row.table,
    value: row.compressed_bytes,
    compressed: row.compressed,
  }))

  const dataTopByCount = topByRowCount.map((row) => ({
    name: row.table,
    value: row.total_rows,
    readable_total_rows: row.readable_total_rows,
  }))

  return (
    <ChartCard title={title} className={className}>
      <Tabs defaultValue="by-size">
        <TabsList className="mb-5">
          <TabsTrigger value="by-size">Top tables by Size</TabsTrigger>
          <TabsTrigger value="by-count">Top tables by Row Count</TabsTrigger>
        </TabsList>
        <TabsContent value="by-size">
          <BarList
            data={dataTopBySize}
            formatedColumn="compressed"
            {...props}
          />
        </TabsContent>
        <TabsContent value="by-count">
          <BarList
            data={dataTopByCount}
            formatedColumn="readable_total_rows"
            {...props}
          />
        </TabsContent>
      </Tabs>
    </ChartCard>
  )
}

export default ChartTopTableSize
