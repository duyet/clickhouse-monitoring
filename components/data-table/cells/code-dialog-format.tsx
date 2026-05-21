'use client'

import { SizeIcon } from '@radix-ui/react-icons'
import { Check, Copy, ExternalLinkIcon, SparklesIcon } from 'lucide-react'

import dedent from 'dedent'
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { format } from 'sql-formatter'
import { highlightCode } from '@/components/ai-elements/code-block'
import { AppLink as Link } from '@/components/ui/app-link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { buildExplorerQueryUrl } from '@/lib/explorer-url'
import { formatQuery } from '@/lib/format-readable'
import { useHostId } from '@/lib/swr/use-host'
import { cn } from '@/lib/utils'

export interface CodeDialogOptions {
  dialog_title?: string
  dialog_description?: string
  trigger_classname?: string
  max_truncate?: number
  hide_query_comment?: boolean
  json?: boolean
  dialog_classname?: string
  show_explorer_link?: boolean
}

const STORAGE_KEY = 'code-dialog-beautify'
type CodeLanguage = 'sql' | 'json' | 'plaintext'

function getInitialBeautifyState(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function saveBeautifyState(value: boolean) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    /* noop */
  }
}

function looksLikeSql(text: string): boolean {
  const trimmed = text.trim()
  const startsWithSql =
    /^(SELECT|INSERT|CREATE|ALTER|DROP|UPDATE|DELETE|WITH|SHOW|DESCRIBE|EXPLAIN|TRUNCATE|OPTIMIZE|ATTACH|DETACH|BACKUP|RESTORE|SYSTEM|CHECK|GRANT|REVOKE)\b/i
  const hasSelectFrom = /\bSELECT\b[\s\S]+\bFROM\b/i

  return startsWithSql.test(trimmed) || hasSelectFrom.test(trimmed)
}

function looksLikeJson(text: string): boolean {
  const trimmed = text.trim()
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  )
}

function detectLanguage(value: string, forceJson?: boolean): CodeLanguage {
  if (forceJson) return 'json'
  if (looksLikeSql(value)) return 'sql'
  if (looksLikeJson(value)) return 'json'
  return 'plaintext'
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatSQL(sql: string): string {
  try {
    return format(sql, {
      language: 'sql',
      keywordCase: 'upper',
      identifierCase: 'preserve',
      tabWidth: 2,
      linesBetweenQueries: 2,
    })
  } catch {
    return dedent(sql)
  }
}

function ExplorerLink({ query }: { query: string }) {
  const hostId = useHostId()
  const href = buildExplorerQueryUrl(query, hostId)
  return (
    <Button variant="ghost" size="icon" className="size-7" asChild>
      <Link href={href} title="Open in Explorer">
        <ExternalLinkIcon className="size-3.5" />
      </Link>
    </Button>
  )
}

interface CodeDialogFormatProps {
  value: string
  options?: CodeDialogOptions
}

const CODE_TRUNCATE_LENGTH = 50

export const CodeDialogFormat = memo(function CodeDialogFormat({
  value,
  options,
}: CodeDialogFormatProps): React.ReactNode {
  const truncate_length = options?.max_truncate || CODE_TRUNCATE_LENGTH
  const beautifyId = useId()
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [open, setOpen] = useState(false)
  const [isBeautified, setIsBeautified] = useState(false)
  const [copied, setCopied] = useState(false)

  const language = useMemo(
    () => detectLanguage(value, options?.json),
    [value, options?.json]
  )
  const dialogTitle =
    options?.dialog_title ??
    (language === 'json'
      ? 'JSON content'
      : language === 'sql'
        ? 'SQL code'
        : 'Code content')
  const dialogDescription =
    options?.dialog_description ||
    'Code content dialog with syntax highlighting and copy controls'
  const languageLabel =
    language === 'sql'
      ? 'ClickHouse SQL'
      : language === 'json'
        ? 'JSON'
        : 'Plain text'

  const formatted = useMemo(() => {
    return formatQuery({
      query: value,
      comment_remove: options?.hide_query_comment,
      truncate: truncate_length,
    })
  }, [value, options?.hide_query_comment, truncate_length])

  const content = useMemo(() => {
    if (!open) return ''

    let result = value

    if (language === 'json') {
      try {
        const json = JSON.parse(value)
        result = JSON.stringify(json, null, 2)
      } catch {}
      return result
    }

    if (isBeautified && language === 'sql') {
      return formatSQL(result)
    }

    return result
  }, [open, value, isBeautified, language])
  const lineCount = contentLineCount(content)

  const highlightedHtml = useMemo(() => {
    if (!(open && content)) return ''
    try {
      return highlightCode(content, language, false)
    } catch {
      return `<pre class="m-0 bg-background! p-4 text-foreground! text-sm"><code class="font-mono text-sm">${escapeHtml(dedent(content))}</code></pre>`
    }
  }, [open, content, language])

  const clearCopyTimer = useCallback(() => {
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current)
      copyTimerRef.current = null
    }
  }, [])

  useEffect(() => clearCopyTimer, [clearCopyTimer])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)
      clearCopyTimer()
      if (nextOpen) {
        setCopied(false)
        setIsBeautified(getInitialBeautifyState())
      }
    },
    [clearCopyTimer]
  )

  const handleBeautifyToggle = useCallback((checked: boolean) => {
    setIsBeautified(checked)
    saveBeautifyState(checked)
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        return
      }
      await navigator.clipboard.writeText(content)
      setCopied(true)
      clearCopyTimer()
      copyTimerRef.current = setTimeout(() => {
        setCopied(false)
        copyTimerRef.current = null
      }, 2000)
    } catch {
      /* noop */
    }
  }, [clearCopyTimer, content])

  if (formatted.length < truncate_length) {
    return (
      <code className="whitespace-nowrap font-mono text-xs">{formatted}</code>
    )
  }

  if (!formatted.endsWith('...')) {
    return (
      <code className="whitespace-nowrap font-mono text-xs">{formatted}</code>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            'group/cell h-auto max-w-full justify-start gap-1.5 p-0 text-left font-normal hover:bg-transparent',
            options?.trigger_classname
          )}
        >
          <code className="min-w-0 truncate font-mono text-xs text-muted-foreground transition-colors group-hover/cell:text-foreground truncated">
            {formatted}
          </code>
          <SizeIcon className="shrink-0 text-muted-foreground/60 transition-colors group-hover/cell:text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          'w-[min(95vw,1100px)] min-w-0 max-w-none p-4 sm:p-6',
          options?.dialog_classname
        )}
      >
        <DialogHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <DialogTitle className="truncate text-base">
                {dialogTitle}
              </DialogTitle>
              {(options?.show_explorer_link ||
                options?.dialog_title === 'Running Query') && (
                <ExplorerLink query={value} />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {language === 'sql' && (
                <Label
                  htmlFor={beautifyId}
                  className="gap-1.5 text-xs text-muted-foreground"
                >
                  <SparklesIcon data-icon="inline-start" />
                  <span className="text-xs text-muted-foreground">
                    Beautify
                  </span>
                  <Switch
                    id={beautifyId}
                    checked={isBeautified}
                    onCheckedChange={handleBeautifyToggle}
                    aria-label="Toggle SQL beautification"
                    className="scale-75"
                  />
                </Label>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check data-icon="inline-start" />
                ) : (
                  <Copy data-icon="inline-start" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
          <DialogDescription
            className={cn(!options?.dialog_description && 'sr-only')}
          >
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="relative group/code">
          <ScrollArea className="h-[min(70vh,720px)] rounded-md border bg-muted/40">
            <div
              className="[&_code]:break-words [&_pre]:whitespace-pre-wrap [&_.hljs-keyword]:text-purple-600 [&_.hljs-string]:text-green-700 [&_.hljs-number]:text-blue-600 [&_.hljs-comment]:text-gray-500 [&_.hljs-built_in]:text-cyan-700 [&_.hljs-title]:text-blue-700 [&_.hljs-attr]:text-orange-600 [&_.hljs-literal]:text-blue-600 dark:[&_.hljs-keyword]:text-purple-400 dark:[&_.hljs-string]:text-green-400 dark:[&_.hljs-number]:text-blue-400 dark:[&_.hljs-comment]:text-gray-400 dark:[&_.hljs-built_in]:text-cyan-400 dark:[&_.hljs-title]:text-blue-400 dark:[&_.hljs-attr]:text-orange-400 dark:[&_.hljs-literal]:text-blue-400"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </ScrollArea>

          <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
            <Badge
              variant="secondary"
              className="bg-background/80 font-mono text-[10px]"
            >
              {language === 'plaintext' ? 'TEXT' : language.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5">
          <span className="font-medium">{languageLabel}</span>
          <span className="tabular-nums">{lineCount} lines</span>
        </div>
      </DialogContent>
    </Dialog>
  )
})

function contentLineCount(content: string): number {
  return content ? content.split('\n').length : 0
}
