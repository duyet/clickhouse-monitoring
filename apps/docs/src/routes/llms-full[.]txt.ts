import { createFileRoute } from '@tanstack/react-router'

import { getLLMText, source } from '@/lib/source'

// /llms-full.txt — full content of all documentation pages concatenated for
// AI ingestion.  Each page is wrapped with its title and URL so models can
// distinguish page boundaries.
export const Route = createFileRoute('/llms-full.txt')({
  server: {
    handlers: {
      GET: async () => {
        const pages = source.getPages()
        const texts = await Promise.all(pages.map(getLLMText))
        return new Response(texts.join('\n\n---\n\n'), {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      },
    },
  },
})
