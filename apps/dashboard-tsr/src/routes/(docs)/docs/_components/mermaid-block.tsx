import { useEffect, useRef, useState } from 'react'

let mermaidIdCounter = 0

/**
 * Client-only Mermaid renderer for docs fenced ```mermaid blocks.
 *
 * Docs pages are server-prerendered, so `mermaid` (which touches `document`)
 * must not be imported at module scope. We dynamically import it inside an
 * effect and render the SVG after hydration. Until then — and if rendering
 * fails — the raw diagram source is shown in a <pre> as a graceful fallback.
 */
export function MermaidBlock({ chart }: { chart: string }) {
  const [svg, setSvg] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const idRef = useRef(`docs-mermaid-${mermaidIdCounter++}`)

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default
        const isDark =
          typeof document !== 'undefined' &&
          document.documentElement.classList.contains('dark')

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'strict',
        })

        const { svg: rendered } = await mermaid.render(
          idRef.current,
          chart.trim()
        )
        if (!cancelled) setSvg(rendered)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }

    void render()
    return () => {
      cancelled = true
    }
  }, [chart])

  if (svg && !failed) {
    return (
      <div
        className="my-4 flex justify-center overflow-x-auto rounded-lg border bg-muted/30 p-4"
        // Mermaid output is generated from trusted docs source with
        // securityLevel: 'strict', which sanitizes the SVG.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    )
  }

  return (
    <pre className="my-4 overflow-x-auto rounded-lg border bg-muted p-4 text-sm">
      <code>{chart.trim()}</code>
    </pre>
  )
}
