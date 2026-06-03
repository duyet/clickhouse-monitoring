import { Link } from '@tanstack/react-router'

import type { ReactNode } from 'react'

import { rewriteDocsHref, rewriteDocsImageSrc, slugify } from '../_lib/shared'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type DocsMarkdownProps = {
  markdown: string
}

export function DocsMarkdown({ markdown }: DocsMarkdownProps) {
  const seenHeadingIds = new Map<string, number>()
  const headingId = (children: ReactNode) => {
    const baseId = slugify(nodeText(children))
    const count = seenHeadingIds.get(baseId) ?? 0
    seenHeadingIds.set(baseId, count + 1)
    return count === 0 ? baseId : `${baseId}-${count}`
  }

  return (
    <div className="markdown-content docs-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const resolvedHref = rewriteDocsHref(href)
            const isExternal = resolvedHref?.startsWith('http')

            if (!resolvedHref || isExternal) {
              return (
                <a
                  href={resolvedHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              )
            }

            // Internal link — use TanStack Router Link with `to` for type safety.
            // Cast href as `any` since docs slugs are not registered routes.
            return <Link to={resolvedHref as never}>{children}</Link>
          },
          h1: ({ children }) => (
            <h1
              id={headingId(children)}
              className="scroll-m-20 text-4xl font-bold tracking-normal"
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              id={headingId(children)}
              className="scroll-m-20 border-border border-b pb-2 text-2xl font-semibold tracking-normal"
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              id={headingId(children)}
              className="scroll-m-20 text-xl font-semibold tracking-normal"
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              id={headingId(children)}
              className="scroll-m-20 text-base font-semibold tracking-normal"
            >
              {children}
            </h4>
          ),
          img: ({ src, alt }) => {
            if (typeof src !== 'string') {
              return null
            }

            return (
              <img
                src={rewriteDocsImageSrc(src) ?? src}
                alt={alt ?? ''}
                width={1200}
                height={675}
                className="h-auto w-full rounded-lg"
              />
            )
          },
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-lg border">
              <table className="min-w-full border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-border border-b bg-muted px-3 py-2 text-left font-medium text-sm">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-border border-t px-3 py-2 text-sm">
              {children}
            </td>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}

function nodeText(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children)
  }

  if (Array.isArray(children)) {
    return children.map(nodeText).join('')
  }

  if (
    children &&
    typeof children === 'object' &&
    'props' in children &&
    children.props &&
    typeof children.props === 'object' &&
    'children' in children.props
  ) {
    return nodeText(children.props.children as ReactNode)
  }

  return ''
}
