import { createFileRoute, Link } from '@tanstack/react-router'

import { DocsMarkdown } from './-components/docs-markdown'
import { DocsShell } from './-components/docs-shell'
import { docsHref, getDocsPage } from './-lib/docs'

import './docs-theme.css'

export const Route = createFileRoute('/(docs)/docs/$')({
  component: DocsPage,
})

function DocsPage() {
  const { _splat } = Route.useParams()
  const slug = _splat ?? ''
  const page = getDocsPage(slug)

  if (!page) {
    return (
      <div className="docs-vercel-theme flex min-h-dvh flex-col items-center justify-center px-4 text-center">
        <h1 className="font-semibold text-2xl text-[var(--ds-gray-1000)]">
          Page not found
        </h1>
        <p className="mt-2 text-[var(--ds-gray-900)]">
          The documentation page you are looking for does not exist.
        </p>
        <Link
          to="/docs"
          search={(prev) => ({ host: prev.host ?? 0 })}
          className="mt-6 rounded-full bg-[var(--ds-gray-1000)] px-4 py-2 font-medium text-[var(--ds-background-100)] text-sm transition-opacity hover:opacity-90"
        >
          Go to Docs Introduction
        </Link>
      </div>
    )
  }

  return (
    <DocsShell activeSlug={page.slug} headings={page.headings}>
      <DocsMarkdown markdown={page.markdown} />
    </DocsShell>
  )
}
