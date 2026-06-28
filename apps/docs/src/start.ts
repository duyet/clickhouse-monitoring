import { redirect } from '@tanstack/react-router'
import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from '@tanstack/react-start'

import { slugsToMarkdownPath } from './lib/source'
import { isMarkdownPreferred } from 'fumadocs-core/negotiation'

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
})

// LLM negotiation middleware: if a request to a doc page includes
// `Accept: text/markdown`, redirect to the raw .md endpoint.
const llmMiddleware = createMiddleware().server(({ next, request }) => {
  const url = new URL(request.url)
  const path = url.pathname

  // Skip API, OG, and asset routes.
  if (
    path.startsWith('/api/') ||
    path.startsWith('/og/') ||
    path.endsWith('.md') ||
    path.includes('.')
  ) {
    return next()
  }

  if (isMarkdownPreferred(request)) {
    const slugs = path.split('/').filter(Boolean)
    const { url: mdUrl } = slugsToMarkdownPath(slugs)
    throw redirect(new URL(mdUrl, request.url))
  }

  return next()
})

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, llmMiddleware],
}))
