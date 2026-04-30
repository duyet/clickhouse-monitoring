'use client'

import type { ReactNode } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import {
  rewriteDocsHref,
  rewriteDocsImageSrc,
  slugify,
} from '@/app/docs/_lib/shared'

type DocsMarkdownProps = {
  markdown: string
}

export function DocsMarkdown({ markdown }: DocsMarkdownProps) {
  return (
    <div className="markdown-content docs-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ href, children }) => {
            const resolvedHref = rewriteDocsHref(href)
            const isExternal = resolvedHref?.startsWith('http')

            if (!resolvedHref || isExternal) {
              return (
                <a href={resolvedHref} target="_blank" rel="noreferrer">
                  {children}
                </a>
              )
            }

            return <Link href={resolvedHref}>{children}</Link>
          },
          h1: ({ children }) => (
            <h1 className="scroll-m-20 text-4xl font-bold tracking-normal">
              {children}
            </h1>
          ),
          h2: ({ children }) => {
            const text = nodeText(children)

            return (
              <h2
                id={slugify(text)}
                className="scroll-m-20 border-border border-b pb-2 text-2xl font-semibold tracking-normal"
              >
                {children}
              </h2>
            )
          },
          h3: ({ children }) => {
            const text = nodeText(children)

            return (
              <h3
                id={slugify(text)}
                className="scroll-m-20 text-xl font-semibold tracking-normal"
              >
                {children}
              </h3>
            )
          },
          h4: ({ children }) => (
            <h4 className="text-base font-semibold tracking-normal">
              {children}
            </h4>
          ),
          img: ({ src, alt }) => {
            if (typeof src !== 'string') {
              return null
            }

            return (
              <Image
                src={rewriteDocsImageSrc(src) ?? src}
                alt={alt ?? ''}
                width={1200}
                height={675}
                unoptimized
                className="rounded-lg border bg-card shadow-sm"
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

  return ''
}
