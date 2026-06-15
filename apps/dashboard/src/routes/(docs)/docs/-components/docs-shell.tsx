import { Menu } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import {
  type DocsHeading,
  type DocsNavSection,
  docsHref,
  findActiveDocsSection,
  resolveDocsBreadcrumb,
} from '../-lib/docs'
import { type ReactNode, useState } from 'react'
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
  const [mobilePanel, setMobilePanel] = useState<'menu' | 'toc' | null>(null)
  const toolbarTitle = resolveDocsBreadcrumb(activeSlug, activeTitle)

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
        <div className="mx-auto w-full max-w-[var(--ds-page-width)]">
          <DocsMobileToolbar
            title={toolbarTitle}
            hasToc={headings.length > 0}
            mobilePanel={mobilePanel}
            onMenu={() =>
              setMobilePanel((panel) => (panel === 'menu' ? null : 'menu'))
            }
            onToc={() =>
              setMobilePanel((panel) => (panel === 'toc' ? null : 'toc'))
            }
          />
          {mobilePanel === 'menu' ? (
            <div className="docs-mobile-panel lg:hidden">
              <DocsNavList activeSlug={activeSlug} compact />
            </div>
          ) : null}
          {mobilePanel === 'toc' && headings.length > 0 ? (
            <div className="docs-mobile-panel lg:hidden">
              <div className="docs-shell__toc-title mb-2 px-2">
                On this page
              </div>
              <DocsTocList headings={headings} />
            </div>
          ) : null}
        </div>
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

function DocsMobileToolbar({
  title,
  hasToc,
  mobilePanel,
  onMenu,
  onToc,
}: {
  title: string
  hasToc: boolean
  mobilePanel: 'menu' | 'toc' | null
  onMenu: () => void
  onToc: () => void
}) {
  return (
    <div className="docs-toolbar">
      <button
        type="button"
        className="docs-toolbar__menu"
        aria-expanded={mobilePanel === 'menu'}
        onClick={onMenu}
      >
        <Menu className="size-[18px] shrink-0 opacity-70" aria-hidden />
        <span className="docs-toolbar__title">{title}</span>
      </button>
      {hasToc ? (
        <button
          type="button"
          className="docs-toolbar__toc"
          aria-expanded={mobilePanel === 'toc'}
          onClick={onToc}
        >
          On this page
        </button>
      ) : null}
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
  const section = findActiveDocsSection(activeSlug)

  if (!section) {
    return null
  }

  return (
    <nav className={cn(compact && 'space-y-4')}>
      <DocsNavSectionList section={section} activeSlug={activeSlug} />
    </nav>
  )
}

function DocsNavSectionList({
  section,
  activeSlug,
}: {
  section: DocsNavSection
  activeSlug: string
}) {
  const showHeading = section.items.length > 1

  return (
    <div>
      {showHeading ? (
        <div className="docs-shell__nav-section mb-2 px-2">{section.title}</div>
      ) : null}
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
