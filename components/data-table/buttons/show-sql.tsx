'use client'

import { CodeIcon } from '@radix-ui/react-icons'

import { dedent } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ShowSQLButtonProps {
  sql?: string
}

export function ShowSQLButton({ sql }: ShowSQLButtonProps) {
  if (!sql) {
    return null
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-auto" aria-label="Show SQL">
          <CodeIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>SQL Code</DialogTitle>
          <DialogDescription>Raw SQL code of this table</DialogDescription>
        </DialogHeader>
        <div className="w-fit overflow-auto">
          <pre className="text-sm">{dedent(sql)}</pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
