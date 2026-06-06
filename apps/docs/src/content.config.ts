import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

// Docs are generated per-version into src/content/docs/<version>/** by
// scripts/sync-docs.mjs (gitignored). Each file carries a version + a
// fully-qualified slug ("<version>/<path>") used for routing.
const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    editUrl: z.string().optional(),
    version: z.string(),
    slug: z.string(),
  }),
})

export const collections = { docs }
