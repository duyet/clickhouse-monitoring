import { CodeIcon } from '@radix-ui/react-icons'

import { DialogSQL } from '@/components/dialog-sql'
import { Button } from '@/components/ui/button'

interface ShowSQLButtonProps {
  sql?: string
}

export function ShowSQLButton({ sql }: ShowSQLButtonProps) {
  if (!sql) {
    return null
  }

  return (
    <DialogSQL
      button={
        <Button
          variant="outline"
          className="ml-auto"
          aria-label="Show SQL"
          title="Show SQL for this table"
        >
          <CodeIcon className="size-4" />
        </Button>
      }
      sql={sql}
    />
  )
}
