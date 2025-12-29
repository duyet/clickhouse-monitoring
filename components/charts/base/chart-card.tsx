import { CodeIcon } from '@radix-ui/react-icons'
import { TableIcon } from 'lucide-react'

import { DialogContent } from '@/components/dialog-content'
import { Button } from '@/components/ui'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui'
import { cn, dedent } from '@/lib/utils'

interface ChartCardProps {
  title?: string | React.ReactNode
  className?: string
  contentClassName?: string
  sql?: string
  data?: any[]
  children: string | React.ReactNode
}

export function ChartCard({
  title,
  sql,
  data,
  className,
  contentClassName,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn('rounded-md', className)}>
      {title ? (
        <CardHeader className="p-3">
          <header className="group flex flex-row items-center justify-between">
            <CardDescription>{title}</CardDescription>
            <CardToolbar sql={sql} data={data} />
          </header>
        </CardHeader>
      ) : null}

      <CardContent className={cn('p-4', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}

function CardToolbar({ sql, data }: Pick<ChartCardProps, 'sql' | 'data'>) {
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
          content={
            <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
          }
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
          content={<pre className="text-sm">{dedent(sql)}</pre>}
          description="SQL Query for this chart"
        />
      )}
    </div>
  )
}
