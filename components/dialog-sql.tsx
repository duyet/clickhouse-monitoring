import { CodeIcon } from '@radix-ui/react-icons'
import { memo } from 'react'

import {
  DialogContent,
  type DialogContentProps,
} from '@/components/dialog-content'
import { Button } from '@/components/ui/button'
import { dedent } from '@/lib/utils'

interface ShowSQLButtonProps extends Omit<DialogContentProps, 'content'> {
  sql?: string
}

export const DialogSQL = memo(function DialogSQL({
  button,
  title = 'SQL Code',
  description = 'Raw SQL code of this table',
  sql,
  ...props
}: ShowSQLButtonProps) {
  if (!sql) {
    return null
  }

  return (
    <DialogContent
      button={
        button ? (
          button
        ) : (
          <Button
            variant="outline"
            className="ml-auto"
            aria-label="Show SQL"
            title="Show SQL for this table"
          >
            <CodeIcon className="size-4" />
          </Button>
        )
      }
      title={title}
      description={description}
      content={<pre className="text-sm text-wrap">{dedent(sql)}</pre>}
      {...props}
    />
  )
})
