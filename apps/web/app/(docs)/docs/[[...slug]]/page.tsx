import type { Metadata } from 'next'

import { DocsMarkdown } from '../_components/docs-markdown'
import { docsContent } from '../_lib/content.generated'
import {
  type DocsHeading,
  type DocsPage as DocsPageData,
  docsHref,
  docsNav,
  getDocsPage,
} from '../_lib/docs'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type DocsPageProps = {
  params: Promise<{
    slug?: string[]
  }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(docsContent).map((slug) => ({
    slug: slug ? slug.split('/') : [],
  }))
}

export async function generateMetadata({
  params,
}: DocsPageProps): Promise<Metadata> {
  const page = await getPageFromParams(params)

  return {
    title: page ? `${page.title} - Docs` : 'Docs - Page not found',
  }
}

export default async function DocsPage({ params }: DocsPageProps) {
  const page = await getPageFromParams(params)

  if (!page) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The documentation page you are looking for does not exist.
        </p>
        <Link
          href="/docs"
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          Go to Docs Introduction
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-dvh px-4 py-6 lg:px-6 xl:px-8">
      <DocsMobileNav
        activeSlug={page.slug}
        activeTitle={page.title}
        headings={page.headings}
      />
      <div className="mx-auto flex w-full max-w-[96rem] items-start gap-8">
        <DocsSidebar activeSlug={page.slug} />
        <main className="min-w-0 flex-1 pb-16">
          <div className="mx-auto max-w-4xl">
            <DocsMarkdown markdown={page.markdown} />
          </div>
        </main>
        <DocsToc headings={page.headings} />
      </div>
    </div>
  )
}

async function getPageFromParams(
  params: DocsPageProps['params']
): Promise<DocsPageData | null> {
  const { slug } = await params
  const activeSlug = Array.isArray(slug) ? slug.filter(Boolean).join('/') : ''

  return getDocsPage(activeSlug)
}

function DocsMobileNav({
  activeSlug,
  activeTitle,
  headings,
}: {
  activeSlug: string
  activeTitle: string
  headings: DocsHeading[]
}) {
  return (
    <div className="sticky top-14 z-20 mb-6 border-border border-b bg-background/95 pb-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
      <details className="group rounded-md border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 font-medium text-sm [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 truncate">{activeTitle}</span>
          <span className="shrink-0 text-muted-foreground text-xs group-open:hidden">
            Menu
          </span>
          <span className="hidden shrink-0 text-muted-foreground text-xs group-open:inline">
            Close
          </span>
        </summary>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto border-border border-t p-3">
          <DocsNavList activeSlug={activeSlug} compact />
          {headings.length > 0 ? (
            <div className="mt-4 border-border border-t pt-4">
              <div className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                On this page
              </div>
              <DocsTocList headings={headings} />
            </div>
          ) : null}
        </div>
      </details>
    </div>
  )
}

function DocsSidebar({ activeSlug }: { activeSlug: string }) {
  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 overflow-y-auto border-border border-r pr-6 lg:block">
      <Link
        href="/docs"
        className="mb-4 block font-semibold text-foreground text-sm"
      >
        chmonitor
      </Link>
      <DocsNavList activeSlug={activeSlug} />
    </aside>
  )
}

function DocsNavList({
  activeSlug,
  compact = false,
}: {
  activeSlug: string
  compact?: boolean
}) {
  return (
    <nav className={cn('space-y-6', compact && 'space-y-4')}>
      {docsNav.map((section) => (
        <div key={section.title}>
          <div className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {section.title}
          </div>
          <ul className="space-y-1">
            {section.items.map((item) => {
              const isActive = item.slug === activeSlug

              return (
                <li key={item.slug || 'index'}>
                  <Link
                    href={docsHref(item.slug)}
                    className={cn(
                      'block rounded-md px-2 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-accent font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function DocsToc({ headings }: { headings: DocsHeading[] }) {
  if (headings.length === 0) {
    return null
  }

  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-56 shrink-0 overflow-y-auto xl:block">
      <div className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
        On this page
      </div>
      <DocsTocList headings={headings} />
    </aside>
  )
}

function DocsTocList({ headings }: { headings: DocsHeading[] }) {
  return (
    <nav>
      <ul className="space-y-1 border-border border-l">
        {headings.map((heading) => (
          <li key={heading.id}>
            <Link
              href={`#${heading.id}`}
              className={cn(
                'block py-1 text-muted-foreground text-sm hover:text-foreground',
                heading.level === 3 ? 'pl-6' : 'pl-3'
              )}
            >
              {heading.text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
