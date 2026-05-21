import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog'
import { SizeIcon } from '@radix-ui/react-icons'
import { Check, Copy, ExternalLinkIcon, SparklesIcon } from 'lucide-react'

import dedent from 'dedent'
import { memo, useCallback, useMemo, useState } from 'react'
import { format } from 'sql-formatter'
import { highlightCode } from '@/components/ai-elements/code-block'
import { AppLink as Link } from '@/components/ui/app-link'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  const sqlKeywords =
    /\b(SELECT|INSERT|CREATE|ALTER|DROP|UPDATE|DELETE|WITH|SHOW|DESCRIBE|EXPLAIN|TRUNCATE|OPTIMIZE|ATTACH|DETACH|BACKUP|RESTORE|SYSTEM|CHECK|GRANT|REVOKE)\b/i
  return sqlKeywords.test(text)
}

function looksLikeJson(text: string): boolean {
  const trimmed = text.trim()
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  )
}

function detectLanguage(value: string, options?: CodeDialogOptions): string {
  if (options?.json) return 'json'
  if (looksLikeSql(value)) return 'sql'
  if (looksLikeJson(value)) return 'json'
  return 'sql'
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
  const [isBeautified, setIsBeautified] = useState(getInitialBeautifyState)
  const [copied, setCopied] = useState(false)

  const language = useMemo(
    () => detectLanguage(value, options),
    [value, options]
  )

  const formatted = useMemo(() => {
    return formatQuery({
      query: value,
      comment_remove: options?.hide_query_comment,
      truncate: truncate_length,
    })
  }, [value, options?.hide_query_comment, truncate_length])

  const content = useMemo(() => {
    let result = value

    if (options?.json) {
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
  }, [value, options?.json, isBeautified, language])

  const highlightedHtml = useMemo(() => {
    if (!content) return ''
    try {
      return highlightCode(content, language, false)
    } catch {
      return `<pre class="m-0 bg-background! p-4 text-foreground! text-sm"><code class="font-mono text-sm">${content}</code></pre>`
    }
  }, [content, language])

  const handleBeautifyToggle = useCallback((checked: boolean) => {
    setIsBeautified(checked)
    saveBeautifyState(checked)
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* noop */
    }
  }, [content])

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
    <Dialog>
      <DialogTrigger asChild>
        <div
          className={cn(
            'flex max-w-fit cursor-pointer flex-row items-center gap-1.5 line-clamp-1 group/cell',
            options?.trigger_classname
          )}
        >
          <code className="font-mono text-xs whitespace-nowrap truncated text-muted-foreground group-hover/cell:text-foreground transition-colors">
            {formatted}
          </code>
          <SizeIcon className="size-3.5 flex-none shrink-0 text-muted-foreground/60 group-hover/cell:text-muted-foreground transition-colors" />
        </div>
      </DialogTrigger>
      <DialogContent
        className={cn(
          'max-w-[95vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-[75vw] min-w-80',
          options?.dialog_classname
        )}
        aria-describedby={options?.dialog_description}
      >
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base">
                {options?.dialog_title}
              </DialogTitle>
              {(options?.show_explorer_link ||
                options?.dialog_title === 'Running Query') && (
                <ExplorerLink query={value} />
              )}
            </div>
            <div className="flex items-center gap-2">
              {language === 'sql' && (
                <div className="flex items-center gap-1.5">
                  <SparklesIcon className="size-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Beautify
                  </span>
                  <Switch
                    checked={isBeautified}
                    onCheckedChange={handleBeautifyToggle}
                    aria-label="Toggle SQL beautification"
                    className="scale-75"
                  />
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 text-xs text-muted-foreground px-2"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="size-3" strokeWidth={1.5} />
                ) : (
                  <Copy className="size-3" strokeWidth={1.5} />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            {options?.dialog_description ||
              'Code content dialog with syntax highlighting'}
          </DialogDescription>
        </DialogHeader>

        <div className="relative group/code">
          <ScrollArea className="max-h-[70vh] rounded-lg border border-border/60 bg-muted/40">
            <div
              className="overflow-auto [&_.hljs-keyword]:text-purple-600 [&_.hljs-string]:text-green-700 [&_.hljs-number]:text-blue-600 [&_.hljs-comment]:text-gray-500 [&_.hljs-built_in]:text-cyan-700 [&_.hljs-title]:text-blue-700 [&_.hljs-attr]:text-orange-600 [&_.hljs-literal]:text-blue-600 dark:[&_.hljs-keyword]:text-purple-400 dark:[&_.hljs-string]:text-green-400 dark:[&_.hljs-number]:text-blue-400 dark:[&_.hljs-comment]:text-gray-400 dark:[&_.hljs-built_in]:text-cyan-400 dark:[&_.hljs-title]:text-blue-400 dark:[&_.hljs-attr]:text-orange-400 dark:[&_.hljs-literal]:text-blue-400"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </ScrollArea>

          <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
            <span className="text-[10px] text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded">
              {language.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5">
          <span className="font-medium">
            {language === 'sql' ? 'ClickHouse SQL' : language.toUpperCase()}
          </span>
          <span className="tabular-nums">
            {content.split('\n').length} lines
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
})
