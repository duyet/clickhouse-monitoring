import { CodeIcon } from '@radix-ui/react-icons'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { DialogSQL } from '@/components/dialog-sql'

interface ChartCardProps {
  title?: string | React.ReactNode
  className?: string
  sql?: string
  children: string | React.ReactNode
}

export function ChartCard({ title, className, sql, children }: ChartCardProps) {
  return (
    <Card className={cn('rounded-md', className)}>
      {title ? (
        <CardHeader className="p-2">
          <CardDescription className="group flex flex-row items-center justify-between">
            {title}
            <DialogSQL
              button={
                <Button
                  className="group-hover:border-1 border-0"
                  size="sm"
                  variant="ghost"
                >
                  <CodeIcon className="h-3 w-3" />
                </Button>
              }
              sql={sql}
              description="SQL Query for this chart"
            />
          </CardDescription>
        </CardHeader>
      ) : null}

      <CardContent className="p-2">{children}</CardContent>
    </Card>
  )
}
