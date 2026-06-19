// Raw-markdown sibling of every docs page: /authentication/trusted-header ->
// /authentication/trusted-header.md serves the source markdown as text/markdown.
// Lets readers (and LLMs / agents) grab the plain source, and backs the
// "Copy page" / "Open as Markdown" actions in the page header (PageTitle.astro).
//
// Static output, so paths are prerendered via getStaticPaths alongside the HTML
// pages Starlight emits from the docs collection.

import type { APIRoute, GetStaticPaths } from 'astro'

import { getCollection } from 'astro:content'

export const getStaticPaths: GetStaticPaths = async () => {
  const entries = await getCollection('docs')
  return entries.map((entry) => ({
    // Root index (id "") is exposed at /index.md.
    params: { slug: entry.id || 'index' },
    props: { entry },
  }))
}

export const GET: APIRoute = ({ props }) => {
  const { entry } = props as {
    entry: Awaited<ReturnType<typeof getCollection>>[number]
  }

  // sync-docs removes the body's h1 (Starlight renders the title); restore a
  // clean top-level heading from the frontmatter title for the raw file.
  const body = (entry.body ?? '').trimStart()
  const markdown = `# ${entry.data.title}\n\n${body}\n`

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
