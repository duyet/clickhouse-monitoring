import { CalendarCheckIcon, TagIcon } from 'lucide-react'
import { Suspense } from 'react'

import { ErrorAlert } from '@/components/error-alert'
import { SingleLineSkeleton } from '@/components/skeleton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { fetchData } from '@/lib/clickhouse'
import { cn } from '@/lib/utils'

export async function ClickHouseInfo({
  hostId,
  title,
  description,
  version,
  hostName,
  uptime,
  currentUser,
  className,
  contentClassName,
}: {
  hostId: number
  title?: string
  description?: string
  version?: boolean
  hostName?: boolean
  uptime?: boolean
  currentUser?: boolean
  className?: string
  contentClassName?: string
}) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm">System Info</CardTitle>
        <CardDescription className="text-xs">ClickHouse</CardDescription>
      </CardHeader>
      <CardContent className={cn('space-y-3 pt-0', contentClassName)}>
        {hostName && (
          <Suspense fallback={<SingleLineSkeleton className="w-full" />}>
            <InfoLine
              hostId={hostId}
              query="SELECT hostName() as val"
              label="Host"
              icon={<TagIcon className="size-4" />}
            />
          </Suspense>
        )}
        {version && (
          <Suspense fallback={<SingleLineSkeleton className="w-full" />}>
            <InfoLine
              hostId={hostId}
              query="SELECT version() as val"
              label="Version"
              icon={<TagIcon className="size-4" />}
            />
          </Suspense>
        )}
        {uptime && (
          <Suspense fallback={<SingleLineSkeleton className="w-full" />}>
            <InfoLine
              hostId={hostId}
              query="SELECT splitByString(' and ', formatReadableTimeDelta(uptime()))[1] as val"
              label="Uptime"
              icon={<CalendarCheckIcon className="size-4" />}
            />
          </Suspense>
        )}
      </CardContent>
    </Card>
  )
}

async function InfoLine({
  hostId,
  query,
  label,
  icon,
  className,
}: {
  hostId: number
  query: string
  label: string
  icon?: React.ReactNode
  className?: string
}) {
  const { data, error } = await fetchData<{ val: string }[]>({ query, hostId })

  if (error) {
    return (
      <ErrorAlert
        title="Configuration error"
        message={error.message}
        errorType={error.type}
        query={query}
        compact={true}
      />
    )
  }

  if (!data || data.length === 0) return null

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-muted-foreground text-sm">{label}</span>
      </div>
      <div className="truncate text-sm font-medium" title={data[0].val}>
        {data[0].val}
      </div>
    </div>
  )
}
