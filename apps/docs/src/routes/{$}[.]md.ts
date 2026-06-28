import { createFileRoute, notFound } from '@tanstack/react-router'

import { getLLMText, markdownPathToSlugs, source } from '@/lib/source'

// Raw markdown endpoint: /{slug}.md
// Returns the source markdown for any doc page — useful for LLMs and tooling.
// Example: /getting-started.md  →  raw text of the Getting Started page.
export const Route = createFileRoute('/{$}.md')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slugs = markdownPathToSlugs(params._splat?.split('/') ?? [])
        const page = source.getPage(slugs)
        if (!page) throw notFound()

        return new Response(await getLLMText(page), {
          headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
        })
      },
    },
  },
})
