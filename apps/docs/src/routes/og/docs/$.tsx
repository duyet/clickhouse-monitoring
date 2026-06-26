import { createFileRoute, notFound } from '@tanstack/react-router'
import { source } from '@/lib/source'

// OG image route: /og/docs/{...slugs}/image.webp
//
// Per-page OG images are PRE-GENERATED at build time by scripts/generate-og.mjs
// (Node.js process, @takumi-rs/core native Napi-rs bindings) and written to
// public/og/docs/{...slugs}/image.webp. Vite copies the public/ directory into
// dist/, so the Cloudflare Worker serves these as static assets — this route
// handler is never reached for known pages.
//
// This handler acts as a safety net for any request that slips through (e.g. a
// new page deployed before the next build, or a request for a non-existent slug).
// It validates that the slug at least maps to a known page and redirects to the
// static fallback /og/og.png rather than returning 404.
export const Route = createFileRoute('/og/docs/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const rawSegments = (params._splat?.split('/') ?? []).filter(Boolean)
        const slugs =
          rawSegments[rawSegments.length - 1] === 'image.webp'
            ? rawSegments.slice(0, -1)
            : rawSegments

        const page = source.getPage(slugs)
        if (!page) throw notFound()

        // Static image was pre-generated; this redirect is a last-resort fallback.
        return Response.redirect('/og/og.png', 302)
      },
    },
  },
})
