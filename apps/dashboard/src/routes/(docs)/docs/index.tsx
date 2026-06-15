import { createFileRoute } from '@tanstack/react-router'

import { DocsMarkdown } from './-components/docs-markdown'
import { DocsShell } from './-components/docs-shell'
import { getDocsPage } from './-lib/docs'

import './docs-theme.css'

export const Route = createFileRoute('/(docs)/docs/')({
  component: DocsIndexPage,
})

function DocsIndexPage() {
  const page = getDocsPage('')

  if (!page) {
    return (
      <div className="docs-theme flex min-h-dvh flex-col items-center justify-center px-4 text-center">
        <h1 className="font-semibold text-2xl text-[var(--ds-gray-1000)]">
          Page not found
        </h1>
        <p className="mt-2 text-[var(--ds-gray-900)]">
          The documentation introduction page could not be loaded.
        </p>
      </div>
    )
  }

  return (
    <DocsShell
      activeSlug={page.slug}
      activeTitle={page.title}
      headings={page.headings}
    >
      <DocsMarkdown markdown={page.markdown} />
    </DocsShell>
  )
}
