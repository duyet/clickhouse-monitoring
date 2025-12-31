'use client'

import { CodeIcon } from '@radix-ui/react-icons'
import { TableIcon } from 'lucide-react'
import { memo, useMemo } from 'react'

import { DialogContent } from '@/components/dialogs/dialog-content'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { cn, dedent } from '@/lib/utils'
import type { ChartDataPoint } from '@/types/chart-data'

interface ChartCardProps {
  title?: string | React.ReactNode
  className?: string
  contentClassName?: string
  sql?: string
  data?: ChartDataPoint[]
  children: string | React.ReactNode
}

export const ChartCard = memo(function ChartCard({
  title,
  sql,
  data,
  className,
  contentClassName,
  children,
}: ChartCardProps) {
  return (
    <Card
      className={cn(
        'rounded-lg border-border/50 bg-card/50 flex flex-col h-full group overflow-hidden',
        'transition-all duration-200 hover:border-border/80',
        'shadow-none py-2',
        className
      )}
    >
      {title ? (
        <CardHeader className="px-3 shrink-0">
          <header className="flex flex-row items-center justify-between gap-2">
            <CardDescription className="text-xs font-medium tracking-wide text-muted-foreground/80 uppercase truncate min-w-0 flex-1">
              {title}
            </CardDescription>
            <CardToolbar sql={sql} data={data} />
          </header>
        </CardHeader>
      ) : null}

      <CardContent
        className={cn(
          'p-3 pt-0 flex-1 min-h-0 overflow-hidden',
          contentClassName
        )}
      >
        {children}
      </CardContent>
    </Card>
  )
})

const CardToolbar = memo(function CardToolbar({
  sql,
  data,
}: Pick<ChartCardProps, 'sql' | 'data'>) {
  // Memoize expensive operations
  const dataJson = useMemo(() => {
    return data ? JSON.stringify(data, null, 2) : null
  }, [data])

  const formattedSql = useMemo(() => {
    return sql ? dedent(sql) : null
  }, [sql])

  return (
    <div className="flex flex-row gap-1 shrink-0 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200">
      {data && (
        <DialogContent
          button={
            <Button size="default" variant="ghost" className="sm:size-sm">
              <TableIcon className="size-4 sm:size-3" />
            </Button>
          }
          content={<pre className="text-sm">{dataJson}</pre>}
          description="Raw Data"
        />
      )}

      {sql && (
        <DialogContent
          button={
            <Button size="default" variant="ghost" className="sm:size-sm">
              <CodeIcon className="size-4 sm:size-3" />
            </Button>
          }
          content={<pre className="text-sm">{formattedSql}</pre>}
          description="SQL Query for this chart"
        />
      )}
    </div>
  )
})
