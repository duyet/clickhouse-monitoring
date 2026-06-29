# chmonitor blog

The chmonitor blog — release notes and product updates — served at
[blog.chmonitor.dev](https://blog.chmonitor.dev).

A plain **Astro** static site (no React/SSR) that reuses the same black/white/
orange design tokens as `apps/landing`, so the marketing site, blog and docs feel
like one product. Posts are Markdown in `src/content/blog/` validated by the
content-collection schema in `src/content.config.ts`.

## Develop

```bash
cd apps/blog
bun install
bun run dev        # http://localhost:4321
```

## Add a post

Create `src/content/blog/<slug>.md` with frontmatter:

```yaml
---
title: "Post title"
description: "One-line summary used for the card + social preview."
date: 2026-06-29
tag: Release          # shown on the card when `version` is absent
version: v0.3         # optional — shown instead of `tag`
cover: /brand/og-brand.png   # optional OG image
draft: false          # optional — true hides it from the build
---
```

The post URL is the file slug (e.g. `chmonitor-v0-3.md` → `/chmonitor-v0-3`).

### Embedding video

Drop the MP4 under `public/posts/<version>/` and embed it with raw HTML in the
Markdown (Astro renders raw HTML in `.md`):

```html
<figure class="video">
  <video src="/posts/v0.3/launch.mp4" poster="/posts/v0.3/launch-poster.png" controls preload="metadata" playsinline></video>
  <figcaption>Caption…</figcaption>
</figure>
```

Launch films live in `chmonitor/launch/<version>/` and are copied into
`public/posts/<version>/` for the release post.

## Deploy

```bash
cd apps/blog
bun run build
wrangler deploy            # → chmonitor-blog worker, blog.chmonitor.dev
```

Static-assets-only Worker (no `main`). Production is `blog.chmonitor.dev`; the
`preview` env is `preview.blog.chmonitor.dev`.
