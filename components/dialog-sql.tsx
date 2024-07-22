import { CodeIcon } from '@radix-ui/react-icons'

import { DialogContent } from '@/components/dialog-content'
import { Button } from '@/components/ui/button'
import { dedent } from '@/lib/utils'

interface ShowSQLButtonProps {
  button?: React.ReactNode
  title?: string
  description?: string
  sql?: string
}

export function DialogSQL({
  button,
  title = 'SQL Code',
  description = 'Raw SQL code of this table',
  sql,
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
      content={<pre className="text-sm">{dedent(sql)}</pre>}
    />
  )
}
