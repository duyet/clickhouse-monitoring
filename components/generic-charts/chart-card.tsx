'use client'

import { CodeIcon } from '@radix-ui/react-icons'
import { TableIcon } from 'lucide-react'
import { memo, useMemo } from 'react'

import { DialogContent } from '@/components/dialog-content'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { cn, dedent } from '@/lib/utils'

interface ChartCardProps {
  title?: string | React.ReactNode
  className?: string
  contentClassName?: string
  sql?: string
  data?: any[]
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
    <Card className={cn(
      'rounded-lg border-border/50 bg-card/50 backdrop-blur-sm',
      'shadow-[0_1px_2px_0_rgb(0_0_0/0.03)]',
      'transition-all duration-200 hover:border-border/80 hover:shadow-[0_2px_8px_0_rgb(0_0_0/0.04)]',
      className
    )}>
      {title ? (
        <CardHeader className="p-3 pb-1">
          <header className="group flex flex-row items-center justify-between">
            <CardDescription className="text-xs font-medium tracking-wide text-muted-foreground/80 uppercase">
              {title}
            </CardDescription>
            <CardToolbar sql={sql} data={data} />
          </header>
        </CardHeader>
      ) : null}

      <CardContent className={cn('p-3 pt-1', contentClassName)}>
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
    <div className="flex flex-row gap-1">
      {data && (
        <DialogContent
          button={
            <Button
              className="border-0 group-hover:border"
              size="sm"
              variant="ghost"
            >
              <TableIcon className="size-3" />
            </Button>
          }
          content={<pre className="text-sm">{dataJson}</pre>}
          description="Raw Data"
        />
      )}

      {sql && (
        <DialogContent
          button={
            <Button
              className="border-0 group-hover:border"
              size="sm"
              variant="ghost"
            >
              <CodeIcon className="size-3" />
            </Button>
          }
          content={<pre className="text-sm">{formattedSql}</pre>}
          description="SQL Query for this chart"
        />
      )}
    </div>
  )
})
