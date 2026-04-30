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

function DocsSidebar({ activeSlug }: { activeSlug: string }) {
  return (
    <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-64 shrink-0 overflow-y-auto border-border border-r pr-6 lg:block">
      <Link
        href="/docs"
        className="mb-4 block font-semibold text-foreground text-sm"
      >
        ClickHouse Monitoring
      </Link>
      <nav className="space-y-6">
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
    </aside>
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
    </aside>
  )
}
