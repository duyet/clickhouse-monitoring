import { CalendarCheckIcon, TagIcon, UserIcon } from 'lucide-react'
import { Suspense } from 'react'

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
  title,
  description,
  version,
  hostName,
  uptime,
  currentUser,
  className,
  contentClassName,
}: {
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
    <Card
      className={cn(
        'min-w-xs content-center rounded-sm shadow-none',
        className
      )}
    >
      {title || description ? (
        <CardHeader>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      ) : null}

      <CardContent
        className={cn(
          'flex flex-col content-center gap-2 p-2 pt-2',
          contentClassName
        )}
      >
        {hostName && (
          <Suspense fallback={<SingleLineSkeleton className="w-full" />}>
            <InfoLine
              query="SELECT hostName() as val"
              label={
                <div className="inline-flex gap-1">
                  <TagIcon className="size-4" />
                  hostName()
                </div>
              }
            />
          </Suspense>
        )}
        {currentUser && (
          <Suspense fallback={<SingleLineSkeleton className="w-full" />}>
            <InfoLine
              query="SELECT currentUser() as val"
              label={
                <div className="inline-flex gap-1">
                  <UserIcon className="size-4" />
                  currentUser()
                </div>
              }
            />
          </Suspense>
        )}
        {version && (
          <Suspense fallback={<SingleLineSkeleton className="w-full" />}>
            <InfoLine
              query="SELECT version() as val"
              label={
                <div className="inline-flex gap-1">
                  <TagIcon className="size-4" />
                  version()
                </div>
              }
            />
          </Suspense>
        )}
        {uptime && (
          <Suspense fallback={<SingleLineSkeleton className="w-full" />}>
            <InfoLine
              query="SELECT splitByString(' and ', formatReadableTimeDelta(uptime()))[1] as val"
              label={
                <div className="inline-flex gap-1">
                  <CalendarCheckIcon className="size-4" />
                  uptime()
                </div>
              }
            />
          </Suspense>
        )}
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
        'flex flex-col items-baseline justify-between gap-1 opacity-80 hover:opacity-100 sm:flex-row sm:items-center sm:gap-4',
        className
      )}
    >
      <div className="truncate text-xl">{data[0].val}</div>
      <hr className="flex-auto grow border-dotted" />
      <div className="flex-none text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
