import { memo } from 'react'
import { DialogSQL } from '@/components/dialogs/dialog-sql'

interface ShowSQLButtonProps {
  sql?: string
}

export const ShowSQLButton = memo(function ShowSQLButton({
  sql,
}: ShowSQLButtonProps) {
  if (!sql) {
    return null
  }

  return <DialogSQL sql={sql} />
})
