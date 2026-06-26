import { createFileRoute, notFound } from '@tanstack/react-router'
import { source } from '@/lib/source'

// OG image route: /og/docs/{...slugs}/image.webp
//
// Fumadocs Takumi integration (@takumi-rs/image-response) requires `ssr.external`
// which is incompatible with @cloudflare/vite-plugin (CF refuses to mark packages
// external in the Worker environment). As a result, per-page Takumi image generation
// is not available on the CF Workers target. The route serves a redirect to the
// static site-wide OG image instead.
//
// Future options for per-page OG images on CF Workers:
//  - Use CF Images Transformations to overlay text on a base image.
//  - Pregenerate images in a CI step (separate Node.js process) and commit them
//    to public/og/docs/.
//  - Switch to a hosting target that supports Node.js native modules (e.g. Vercel).
export const Route = createFileRoute('/og/docs/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        // Validate that the requested page exists; return 404 for unknown slugs.
        const rawSegments = (params._splat?.split('/') ?? []).filter(Boolean)
        const slugs =
          rawSegments[rawSegments.length - 1] === 'image.webp'
            ? rawSegments.slice(0, -1)
            : rawSegments

        const page = source.getPage(slugs)
        if (!page) throw notFound()

        // Redirect to the static site-wide OG image (in public/og/og.png).
        return Response.redirect('/og/og.png', 302)
      },
    },
  },
})
