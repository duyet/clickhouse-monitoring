import { CalendarCheckIcon, TagIcon } from 'lucide-react'
import { Suspense } from 'react'

import { SingleLineSkeleton } from '@/components/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { fetchData } from '@/lib/clickhouse'
import { cn } from '@/lib/utils'

export async function ClickHouseInfo({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        'min-w-xs content-center rounded-sm shadow-none',
        className
      )}
    >
      <CardContent className="flex flex-col content-center p-2 pt-2">
        <Suspense fallback={<SingleLineSkeleton className="w-full" />}>
          <InfoLine
            query="SELECT version() as val"
            label={
              <div className="inline-flex gap-1">
                <TagIcon className="size-4" />
                version
              </div>
            }
          />
        </Suspense>
        <Suspense fallback={<SingleLineSkeleton className="w-full" />}>
          <InfoLine
            query="SELECT splitByString(' and ', formatReadableTimeDelta(uptime()))[1] as val"
            label={
              <div className="inline-flex gap-1">
                <CalendarCheckIcon className="size-4" />
                uptime
              </div>
            }
          />
        </Suspense>
      </CardContent>
    </Card>
  )
}

async function InfoLine({
  query,
  label,
  className,
}: {
  query: string
  label: string | React.ReactNode
  className?: string
}) {
  const { data } = await fetchData<{ val: string }[]>({ query })

  if (!data || data.length === 0) return null

  return (
    <div
      className={cn(
        'inline-flex items-baseline gap-1 gap-2 p-1 opacity-80 hover:opacity-100',
        className
      )}
    >
      <div className="flex-1 truncate text-xl">{data[0].val}</div>
      <div className="flex-none text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
