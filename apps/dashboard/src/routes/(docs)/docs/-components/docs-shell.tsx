import { Link } from '@tanstack/react-router'

import type { ReactNode } from 'react'

import { type DocsHeading, docsHref, docsNav } from '../-lib/docs'
import { cn } from '@/lib/utils'

type DocsShellProps = {
  activeSlug: string
  activeTitle: string
  headings: DocsHeading[]
  children: ReactNode
}

export function DocsShell({
  activeSlug,
  activeTitle,
  headings,
  children,
}: DocsShellProps) {
  return (
    <div className="docs-vercel-theme min-h-dvh">
      <div className="docs-shell__header sticky top-14 z-20 mb-0 px-4 py-3 lg:px-6">
        <div className="mx-auto flex w-full max-w-[var(--ds-page-width)] items-center justify-between gap-4">
          <Link
            to="/docs"
            search={(prev) => ({ host: prev.host ?? 0 })}
            className="font-semibold text-[0.9375rem] text-[var(--ds-gray-1000)] tracking-[-0.02em]"
          >
            chmonitor docs
          </Link>
          <a
            href="https://docs.chmonitor.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-[0.8125rem] text-[var(--ds-gray-900)] hover:text-[var(--ds-gray-1000)] sm:inline"
          >
            docs.chmonitor.dev
          </a>
        </div>
      </div>

      <div className="px-4 pb-6 lg:px-6 xl:px-8">
        <DocsMobileNav
          activeSlug={activeSlug}
          activeTitle={activeTitle}
          headings={headings}
        />
        <div className="mx-auto flex w-full max-w-[var(--ds-page-width)] items-start gap-8">
          <DocsSidebar activeSlug={activeSlug} />
          <main className="min-w-0 flex-1 pb-16">
            <div className="mx-auto max-w-[var(--content-max)]">{children}</div>
          </main>
          <DocsToc headings={headings} />
        </div>
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
    <div className="mb-6 border-[var(--ds-gray-300)] border-b pb-3 lg:hidden">
      <details className="group rounded-[var(--geist-radius)] border border-[var(--ds-gray-300)] bg-[var(--ds-background-100)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 font-medium text-sm [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 truncate">{activeTitle}</span>
          <span className="shrink-0 text-[var(--ds-gray-900)] text-xs group-open:hidden">
            Menu
          </span>
          <span className="hidden shrink-0 text-[var(--ds-gray-900)] text-xs group-open:inline">
            Close
          </span>
        </summary>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto border-[var(--ds-gray-300)] border-t p-3">
          <DocsNavList activeSlug={activeSlug} compact />
          {headings.length > 0 ? (
            <div className="mt-4 border-[var(--ds-gray-300)] border-t pt-4">
              <div className="docs-shell__toc-title mb-2">On this page</div>
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
    <aside className="docs-shell__sidebar sticky top-[calc(3.5rem+3.25rem)] hidden h-[calc(100vh-7rem)] w-[var(--sidebar-w)] shrink-0 overflow-y-auto pr-6 lg:block">
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
    <nav className={cn('space-y-5', compact && 'space-y-4')}>
      {docsNav.map((section) => (
        <div key={section.title}>
          <div className="docs-shell__nav-section mb-2 px-2">
            {section.title}
          </div>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const isActive = item.slug === activeSlug
              return (
                <li key={item.slug || 'index'}>
                  <Link
                    to={docsHref(item.slug) as never}
                    data-active={isActive}
                    className="docs-shell__nav-link block px-2 py-1.5 transition-colors"
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
    <aside className="sticky top-[calc(3.5rem+3.25rem)] hidden h-[calc(100vh-7rem)] w-[var(--toc-w)] shrink-0 overflow-y-auto xl:block">
      <div className="docs-shell__toc-title mb-3 px-2">On this page</div>
      <DocsTocList headings={headings} />
    </aside>
  )
}

function DocsTocList({ headings }: { headings: DocsHeading[] }) {
  return (
    <nav>
      <ul className="space-y-0.5">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                'docs-shell__toc-link block py-1',
                heading.level === 3 ? 'pl-6' : 'pl-2'
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
