'use client'

import { Check, Copy } from 'lucide-react'

import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  text: string
  className?: string
  label?: string
}

export function CopyButton({ text, className, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])

  if (label) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn('gap-1.5', className)}
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? 'Copied!' : label}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('h-7 px-2', className)}
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}

interface CodeBlockProps {
  children: string
  copyText?: string
  language?: string
  className?: string
}

export function CodeBlock({ children, copyText, className }: CodeBlockProps) {
  return (
    <div className={cn('relative group', className)}>
      <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto leading-relaxed">
        <code>{children}</code>
      </pre>
      <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={copyText ?? children} />
      </div>
    </div>
  )
}
