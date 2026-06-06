import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

// Docs are generated per-version by scripts/sync-docs.mjs (gitignored). The
// latest version lands at the root; older versions under src/content/docs/<v>/.
//   - slug    route param for [...slug] ("" = root; "<v>/<path>" for older)
//   - subpath page path within its version ("" = version index)
//   - version owning release (e.g. "v0.3")
const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    editUrl: z.string().optional(),
    version: z.string(),
    subpath: z.string(),
    slug: z.string(),
  }),
})

export const collections = { docs }
