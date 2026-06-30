import type { CollectionEntry } from 'astro:content'

// The public URL slug for a post. We prefer the explicit `version` frontmatter
// (e.g. "v0.3" → /v0.3/) over the glob-loader `id`, because Astro slugifies the
// filename and would strip the dot (v0.3 → v0-3). Falls back to `id` for posts
// without a version.
export function postSlug(post: CollectionEntry<'blog'>): string {
  return post.data.version ?? post.id
}
