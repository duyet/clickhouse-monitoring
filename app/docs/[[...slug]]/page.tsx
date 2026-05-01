import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DocsMarkdown } from '@/app/docs/_components/docs-markdown'
import {
  type DocsHeading,
  docsHref,
  docsNav,
  getDocsPage,
  getDocsSlugs,
} from '@/app/docs/_lib/docs'
import { cn } from '@/lib/utils'

type DocsPageProps = {
  params: Promise<{
    slug?: string[]
  }>
}

export function generateStaticParams() {
  return getDocsSlugs().map((slug) => ({
    slug: slug ? slug.split('/') : [],
  }))
}

export async function generateMetadata(props: DocsPageProps) {
  const params = await props.params
  const slug = params.slug?.join('/') ?? ''
  const page = getDocsPage(slug)

  return {
    title: page ? `${page.title} - Docs` : 'Docs',
    description: 'ClickHouse Monitoring documentation',
  }
}

export default async function DocsPage(props: DocsPageProps) {
  const params = await props.params
  const activeSlug = params.slug?.join('/') ?? ''
  const page = getDocsPage(activeSlug)

  if (!page) {
    notFound()
  }

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <DocsMobileNav
        activeSlug={page.slug}
        activeTitle={page.title}
        headings={page.headings}
      />
      <div className="mx-auto flex w-full max-w-7xl gap-8">
        <DocsSidebar activeSlug={page.slug} />
        <main className="min-w-0 flex-1 pb-16">
          <div className="mx-auto max-w-3xl">
            <DocsMarkdown markdown={page.markdown} />
          </div>
        </main>
        <DocsToc headings={page.headings} />
      </div>
    </div>
  )
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
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto border-border border-t px-3 py-3">
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
    <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-64 shrink-0 overflow-y-auto border-border border-r pr-6 lg:block">
      <Link
        href="/docs"
        className="mb-4 block font-semibold text-foreground text-sm"
      >
        ClickHouse Monitoring
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
    <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-56 shrink-0 overflow-y-auto xl:block">
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
