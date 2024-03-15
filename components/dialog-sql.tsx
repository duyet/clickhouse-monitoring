import { CodeIcon } from '@radix-ui/react-icons'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { dedent } from '@/lib/utils'

interface ShowSQLButtonProps {
  button?: React.ReactNode
  title?: string
  description?: string
  sql?: string
}

export function DialogSQL({
  button = (
    <Button
      variant="outline"
      className="ml-auto"
      aria-label="Show SQL"
      title="Show SQL for this table"
    >
      <CodeIcon className="size-4" />
    </Button>
  ),
  title = 'SQL Code',
  description = 'Raw SQL code of this table',
  sql,
}: ShowSQLButtonProps) {
  if (!sql) {
    return null
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{button}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="w-fit overflow-auto">
          <pre className="text-sm">{dedent(sql)}</pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
