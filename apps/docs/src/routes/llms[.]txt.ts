import { createFileRoute } from '@tanstack/react-router'

import { llms } from 'fumadocs-core/source'
import { source } from '@/lib/source'

// /llms.txt — structured index of all documentation pages for AI crawlers.
// Follows the llms.txt convention: https://llmstxt.org
export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET() {
        return new Response(llms(source).index(), {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      },
    },
  },
})
