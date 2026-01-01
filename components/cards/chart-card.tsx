'use client'

import { Check, Code2, Copy, Database, MoreHorizontal } from 'lucide-react'

import type { ChartDataPoint } from '@/types/chart-data'

import { memo, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, dedent } from '@/lib/utils'

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
        'rounded-lg border-border/50 bg-card/50 flex flex-col h-full group gap-2 shadow-none py-2',
        'transition-all duration-200 hover:border-border/80',
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
  const [showSql, setShowSql] = useState(false)
  const [showData, setShowData] = useState(false)

  const dataJson = useMemo(() => {
    return data ? JSON.stringify(data, null, 2) : null
  }, [data])

  const formattedSql = useMemo(() => {
    return sql ? dedent(sql) : null
  }, [sql])

  const [copied, setCopied] = useState(false)

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Don't render if no sql and no data
  if (!sql && !data) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-5 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity rounded-full"
          >
            <MoreHorizontal className="size-3" strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[140px]">
          {sql && (
            <DropdownMenuItem
              onClick={() => setShowSql(true)}
              className="gap-2 text-[13px]"
            >
              <Code2
                className="size-3.5 text-muted-foreground"
                strokeWidth={1.5}
              />
              <span>SQL Query</span>
            </DropdownMenuItem>
          )}
          {data && (
            <DropdownMenuItem
              onClick={() => setShowData(true)}
              className="gap-2 text-[13px]"
            >
              <Database
                className="size-3.5 text-muted-foreground"
                strokeWidth={1.5}
              />
              <span>Raw Data</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showSql} onOpenChange={setShowSql}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader className="flex-row items-center justify-between gap-4 space-y-0">
            <DialogTitle className="text-base font-medium">
              SQL Query
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground"
              onClick={() => formattedSql && handleCopy(formattedSql)}
            >
              {copied ? (
                <Check className="size-3.5" strokeWidth={1.5} />
              ) : (
                <Copy className="size-3.5" strokeWidth={1.5} />
              )}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </DialogHeader>
          <pre className="text-[13px] leading-relaxed font-mono bg-muted/50 p-4 rounded-lg overflow-auto max-h-[60vh] border">
            {formattedSql}
          </pre>
        </DialogContent>
      </Dialog>

      <Dialog open={showData} onOpenChange={setShowData}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader className="flex-row items-center justify-between gap-4 space-y-0">
            <DialogTitle className="text-base font-medium">
              Raw Data
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground"
              onClick={() => dataJson && handleCopy(dataJson)}
            >
              {copied ? (
                <Check className="size-3.5" strokeWidth={1.5} />
              ) : (
                <Copy className="size-3.5" strokeWidth={1.5} />
              )}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </DialogHeader>
          <pre className="text-[13px] leading-relaxed font-mono bg-muted/50 p-4 rounded-lg overflow-auto max-h-[60vh] border">
            {dataJson}
          </pre>
        </DialogContent>
      </Dialog>
    </>
  )
})
