import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import browserCollections from 'collections/browser'
import { useFumadocsLoader } from 'fumadocs-core/source/client'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page'
import { Suspense } from 'react'
import { useMDXComponents } from '@/components/mdx'
import { SidebarFooter } from '@/components/sidebar-footer'
import { baseOptions } from '@/lib/layout.shared'
import { gitConfig } from '@/lib/shared'
import { getPageImage, slugsToMarkdownPath, source } from '@/lib/source'

export const Route = createFileRoute('/$')({
  component: Page,
  loader: async ({ params }) => {
    // Filter out empty segments so root path ('') maps to index slug ([]).
    const slugs = (params._splat?.split('/') ?? []).filter(Boolean)
    const data = await serverLoader({ data: slugs })
    await clientLoader.preload(data.path)
    return data
  },
})

const serverLoader = createServerFn({ method: 'GET' })
  .validator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs)
    if (!page) throw notFound()
    return {
      path: page.path,
      markdownUrl: slugsToMarkdownPath(page.slugs).url,
      ogImageUrl: getPageImage(page).url,
      pageTree: await source.serializePageTree(source.getPageTree()),
    }
  })

const clientLoader = browserCollections.docs.createClientLoader({
  component(
    { toc, frontmatter, default: MDX },
    { markdownUrl, path }: { markdownUrl: string; path: string }
  ) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <div className="flex flex-row gap-2 items-center border-b -mt-4 pb-6">
          <MarkdownCopyButton markdownUrl={markdownUrl} />
          <ViewOptionsPopover
            markdownUrl={markdownUrl}
            githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/docs/content/${path}`}
          />
        </div>
        <DocsBody>
          <MDX components={useMDXComponents()} />
        </DocsBody>
      </DocsPage>
    )
  },
})

function Page() {
  const { path, pageTree, markdownUrl } = useFumadocsLoader(
    Route.useLoaderData()
  )
  return (
    <DocsLayout
      {...baseOptions()}
      tree={pageTree}
      // Root folders (meta.json `root: true`) render as a sidebar dropdown
      // (Fumadocs Layout Tabs); only the active tab's pages show in the tree.
      tabMode="auto"
      sidebar={{ footer: <SidebarFooter /> }}
    >
      <Suspense>
        {clientLoader.useContent(path, { markdownUrl, path })}
      </Suspense>
    </DocsLayout>
  )
}
