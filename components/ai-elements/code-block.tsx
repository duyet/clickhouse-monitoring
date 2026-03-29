'use client'

import { CheckIcon, CopyIcon } from 'lucide-react'

import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Register only needed languages (keeps bundle small)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('json', json)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('javascript', typescript) // TS grammar covers JS
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('python', python)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('markdown', markdown)

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string
  language: string
  showLineNumbers?: boolean
}

type CodeBlockContextType = {
  code: string
}

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: '',
})

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function highlightCode(
  code: string,
  language: string,
  showLineNumbers = false
): string {
  let highlighted: string
  try {
    const result = hljs.highlight(code, {
      language,
      ignoreIllegals: true,
    })
    highlighted = result.value
  } catch {
    // Fallback for unregistered languages
    highlighted = escapeHtml(code)
  }

  if (showLineNumbers) {
    const lines = highlighted.split('\n')
    highlighted = lines
      .map(
        (line, i) =>
          `<span class="inline-block min-w-10 mr-4 text-right select-none text-muted-foreground">${i + 1}</span>${line}`
      )
      .join('\n')
  }

  return `<pre class="m-0 bg-background! p-4 text-foreground! text-sm"><code class="font-mono text-sm hljs">${highlighted}</code></pre>`
}

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  const [html, setHtml] = useState<string>('')
  const mounted = useRef(false)

  useEffect(() => {
    const result = highlightCode(code, language, showLineNumbers)
    if (!mounted.current) {
      setHtml(result)
      mounted.current = true
    }

    return () => {
      mounted.current = false
    }
  }, [code, language, showLineNumbers])

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div
        className={cn(
          'group relative w-full overflow-hidden rounded-md border bg-background text-foreground',
          className
        )}
        {...props}
      >
        <div className="relative">
          <div
            className="overflow-auto [&_.hljs-keyword]:text-purple-600 [&_.hljs-string]:text-green-700 [&_.hljs-number]:text-blue-600 [&_.hljs-comment]:text-gray-500 [&_.hljs-built_in]:text-cyan-700 [&_.hljs-title]:text-blue-700 [&_.hljs-attr]:text-orange-600 [&_.hljs-literal]:text-blue-600 dark:[&_.hljs-keyword]:text-purple-400 dark:[&_.hljs-string]:text-green-400 dark:[&_.hljs-number]:text-blue-400 dark:[&_.hljs-comment]:text-gray-400 dark:[&_.hljs-built_in]:text-cyan-400 dark:[&_.hljs-title]:text-blue-400 dark:[&_.hljs-attr]:text-orange-400 dark:[&_.hljs-literal]:text-blue-400"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          {children && (
            <div className="absolute top-2 right-2 flex items-center gap-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </CodeBlockContext.Provider>
  )
}

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void
  onError?: (error: Error) => void
  timeout?: number
}

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false)
  const { code } = useContext(CodeBlockContext)

  const copyToClipboard = async () => {
    if (typeof window === 'undefined' || !navigator?.clipboard?.writeText) {
      onError?.(new Error('Clipboard API not available'))
      return
    }

    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      onCopy?.()
      setTimeout(() => setIsCopied(false), timeout)
    } catch (error) {
      onError?.(error as Error)
    }
  }

  const Icon = isCopied ? CheckIcon : CopyIcon

  return (
    <Button
      className={cn('shrink-0', className)}
      onClick={copyToClipboard}
      size="icon"
      variant="ghost"
      {...props}
    >
      {children ?? <Icon size={14} />}
    </Button>
  )
}
