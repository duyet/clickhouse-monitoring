// Raw-markdown sibling of every docs page: /authentication/trusted-header ->
// /authentication/trusted-header.md serves the source markdown as text/markdown.
// Lets readers (and LLMs / agents) grab the plain source, and backs the
// "Copy page" / "Open as Markdown" buttons in the page header.
//
// Static output, so paths are prerendered via getStaticPaths alongside the
// HTML pages emitted by [...slug].astro.

import type { CollectionEntry } from 'astro:content'
import type { APIRoute, GetStaticPaths } from 'astro'

import { getCollection } from 'astro:content'

type DocEntry = CollectionEntry<'docs'>

export const getStaticPaths: GetStaticPaths = async () => {
  const entries = await getCollection('docs')
  return entries.map((entry) => ({
    // Root index ("") has no slug; expose it at /index.md.
    params: { slug: entry.data.slug || 'index' },
    props: { entry },
  }))
}

export const GET: APIRoute = ({ props }) => {
  const { entry } = props as { entry: DocEntry }

  // sync-docs demotes the body's h1 to keep a single document title in
  // frontmatter; restore a clean top-level heading from it for the raw file.
  const body = (entry.body ?? '').trimStart()
  const markdown = `# ${entry.data.title}\n\n${body}\n`

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
