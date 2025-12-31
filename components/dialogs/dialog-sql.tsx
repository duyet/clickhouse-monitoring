import { CodeIcon, Maximize2Icon, Minimize2Icon, SparklesIcon } from 'lucide-react'
import { memo, useCallback, useState } from 'react'

import {
  DialogContent,
  type DialogContentProps,
} from '@/components/dialogs/dialog-content'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { dedent } from '@/lib/utils'
import { format } from 'sql-formatter'

interface ShowSQLButtonProps extends Omit<DialogContentProps, 'content'> {
  sql?: string
  /** Enable full-screen mode */
  fullScreen?: boolean
}

const STORAGE_KEY = 'sql-beautify'

/** Get initial beautify state from localStorage */
function getInitialBeautifyState(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/** Save beautify state to localStorage */
function saveBeautifyState(value: boolean) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    // Ignore storage errors
  }
}

/** Format SQL with ClickHouse dialect */
function formatSQL(sql: string): string {
  try {
    return format(sql, {
      language: 'clickhouse',
      keywordCase: 'upper',
      identifierCase: 'preserve',
      tabWidth: 2,
      linesBetweenQueries: 2,
    })
  } catch {
    // If formatting fails, return dedented original
    return dedent(sql)
  }
}

export const DialogSQL = memo(function DialogSQL({
  button,
  title = 'SQL Code',
  description = 'Raw SQL code of this table',
  sql,
  fullScreen = true,
  ...props
}: ShowSQLButtonProps) {
  const [isFullScreen, setIsFullScreen] = useState(fullScreen)
  const [isBeautified, setIsBeautified] = useState(getInitialBeautifyState)

  const handleBeautifyToggle = useCallback((checked: boolean) => {
    setIsBeautified(checked)
    saveBeautifyState(checked)
  }, [])

  if (!sql) {
    return null
  }

  const displaySQL = isBeautified ? formatSQL(sql) : dedent(sql)

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
      content={
        <div className="flex flex-col gap-4">
          {/* Toolbar with beautify toggle */}
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <SparklesIcon className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Beautify SQL</span>
              <Switch
                checked={isBeautified}
                onCheckedChange={handleBeautifyToggle}
                aria-label="Toggle SQL beautification"
              />
            </div>
          </div>

          {/* SQL code display with syntax highlighting */}
          <pre
            className={cn(
              'overflow-auto rounded-lg border border-border/50 bg-slate-950 p-6',
              'font-mono text-sm leading-relaxed text-slate-300',
              'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700',
              isFullScreen
                ? 'max-h-[calc(100vh-14rem)] text-xs sm:text-sm'
                : 'max-h-[60vh] text-xs'
            )}
          >
            <code className="whitespace-pre-wrap break-words">{displaySQL}</code>
          </pre>

          {/* Info footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>ClickHouse SQL Dialect</span>
            <span>{displaySQL.split('\n').length} lines</span>
          </div>
        </div>
      }
      contentClassName={cn(
        'max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw]',
        isFullScreen && '!max-w-[98vw]'
      )}
      {...props}
    />
  )
})

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}
