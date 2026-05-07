'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface MermaidRendererProps {
  readonly chart: string
  readonly className?: string
}

export function MermaidRenderer({ chart, className }: MermaidRendererProps) {
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          fontFamily: 'inherit',
        })
        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`
        const { svg: rendered } = await mermaid.render(id, chart.trim())
        if (!cancelled) setSvg(rendered)
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Render failed')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [chart])

  if (error) {
    return (
      <pre className="overflow-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 font-mono text-xs text-muted-foreground">
        {chart}
      </pre>
    )
  }

  if (!svg) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-muted/30 p-3">
        <div className="h-3 w-3 animate-pulse rounded-full bg-muted-foreground/30" />
        <span className="text-xs text-muted-foreground">
          Rendering diagram...
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'mermaid-container overflow-auto rounded-md border border-border/60 bg-muted/20 p-4 [&>svg]:max-w-full [&>svg]:mx-auto',
        className
      )}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
