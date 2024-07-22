import { DialogSQL } from '@/components/dialog-sql'

interface ShowSQLButtonProps {
  sql?: string
}

export function ShowSQLButton({ sql }: ShowSQLButtonProps) {
  if (!sql) {
    return null
  }

  return <DialogSQL sql={sql} />
}
