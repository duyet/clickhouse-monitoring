import { fileURLToPath } from 'node:url'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

// Plugin order is load-bearing for the Cloudflare target:
//  - cloudflare() retargets the SSR environment to the workerd runtime
//  - tanstackStart() generates routeTree.gen.ts and wires SSR/server routes
//  - viteReact() MUST come after tanstackStart()
// tailwindcss() (Tailwind v4) is order-independent; kept first by convention.
export default defineConfig({
  server: {
    port: 3000,
    // Allow Vite to read shared @chm/* package sources outside the app root.
    fs: { allow: ['../..'] },
  },
  resolve: {
    alias: {
      '@': r('./src'),
      // Shared workspace packages resolved from SOURCE — own-lockfile isolation
      // means no `workspace:*` protocol. Vite transpiles them; ssr.noExternal
      // (below) bundles them into the worker rather than externalizing.
      '@chm/sql-builder': r('../../packages/sql-builder/src/index.ts'),
      '@chm/logger': r('../../packages/logger/src/index.ts'),
    },
  },
  ssr: {
    noExternal: ['@chm/sql-builder', '@chm/logger'],
  },
  plugins: [
    tailwindcss(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart(),
    viteReact(),
  ],
})
