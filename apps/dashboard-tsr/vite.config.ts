import { fileURLToPath } from 'node:url'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, type PluginOption } from 'vite'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

// Dual build target from ONE source (#1409):
//  - default / BUILD_TARGET=cloudflare: @cloudflare/vite-plugin → workerd bundle
//    (the proven, merged CF path; deployed by `wrangler deploy`).
//  - BUILD_TARGET=node: drop @cloudflare/vite-plugin, add nitro() node-server
//    preset → .output/server/index.mjs for the Docker image. Same routes, same
//    @chm/* seam; `cloudflare:workers` is aliased to a process.env shim so the
//    routes' static `import { env } from 'cloudflare:workers'` resolves on Node.
const isNode = process.env.BUILD_TARGET === 'node'

// Plugin order is load-bearing:
//  - CF: cloudflare() retargets the SSR env to workerd and MUST precede
//    tanstackStart(); viteReact() MUST come after tanstackStart().
//  - Node: nitro() goes AFTER tanstackStart() (per TanStack hosting docs); no
//    cloudflare() plugin.
// tailwindcss() (Tailwind v4) is order-independent; kept first by convention.
// Static prerender: emit per-route static HTML at build (fast first paint,
// served via Cloudflare Workers Assets / Docker static files), with a SPA
// fallback shell for any non-crawled route. Dynamic data still loads
// client-side via TanStack Query against the API routes — "fast like SSR".
const startConfig = {
  prerender: { enabled: true, crawlLinks: true },
  spa: { enabled: true },
}

const runtimePlugins: PluginOption[] = isNode
  ? [tanstackStart(startConfig), nitro({ preset: 'node-server' }), viteReact()]
  : [
      cloudflare({ viteEnvironment: { name: 'ssr' } }),
      tanstackStart(startConfig),
      viteReact(),
    ]

export default defineConfig({
  server: {
    port: 3000,
    // Allow Vite to read shared @chm/* package sources outside the app root.
    fs: { allow: ['../..'] },
  },
  resolve: {
    // The @chm/* source packages live at ../../packages and are transpiled into
    // the server bundle (ssr.noExternal). Their npm deps live in THIS app's
    // isolated node_modules (own-lockfile), not on the packages' upward resolve
    // path — dedupe forces these bare specifiers to resolve from the app root.
    dedupe: [
      '@clickhouse/client-web',
      'lru-cache',
      'zod',
      'react',
      'react-dom',
      'lucide-react',
      '@radix-ui/react-icons',
    ],
    alias: {
      '@': r('./src'),
      // Shared workspace packages resolved from SOURCE — own-lockfile isolation
      // means no `workspace:*` protocol. Vite transpiles them; ssr.noExternal
      // (below) bundles them into the server build rather than externalizing.
      //
      // IMPORTANT: sub-path aliases MUST precede the generic alias so rolldown
      // resolves them correctly (it matches first entry, not longest prefix).
      '@chm/sql-builder': r('../../packages/sql-builder/src/index.ts'),
      '@chm/logger': r('../../packages/logger/src/index.ts'),
      // Specific sub-paths FIRST (before the generic @chm/clickhouse-client)
      '@chm/clickhouse-client/runtime/cloudflare-workers': r(
        '../../packages/clickhouse-client/src/runtime/cloudflare-workers.ts'
      ),
      '@chm/clickhouse-client/clickhouse-version': r(
        '../../packages/clickhouse-client/src/clickhouse-version.ts'
      ),
      '@chm/clickhouse-client/constants': r(
        '../../packages/clickhouse-client/src/clickhouse/constants.ts'
      ),
      '@chm/clickhouse-client/table-existence-cache': r(
        '../../packages/clickhouse-client/src/table-existence-cache.ts'
      ),
      // Generic entry (must be after sub-paths)
      '@chm/clickhouse-client': r(
        '../../packages/clickhouse-client/src/index.ts'
      ),
      '@chm/types': r('../../packages/types/src/index.ts'),
      // MCP subpaths — http.ts re-exports cors/server/data via relative imports
      // that resolve from the package source, so aliasing the entrypoints is enough.
      '@chm/mcp-server/http': r('../../packages/mcp-server/src/http.ts'),
      '@chm/mcp-server/data': r(
        '../../packages/mcp-server/src/data/mcp-tools-data.ts'
      ),
      // The MCP SDK ships an exact `./server` export that shadows `./server/*`
      // subpaths in rolldown's exports resolution, so point the two used deep
      // imports straight at their dist ESM files (the `./*` wildcard target).
      '@modelcontextprotocol/sdk/server/mcp.js': r(
        './node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.js'
      ),
      '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js': r(
        './node_modules/@modelcontextprotocol/sdk/dist/esm/server/webStandardStreamableHttp.js'
      ),
      // The node @clickhouse/client (node:os/node:stream/TCP) is a dead static
      // import in clickhouse-client.ts (routes force web:true). Alias it to an
      // empty stub so it resolves in the bundle on BOTH targets.
      '@clickhouse/client': r('./src/lib/empty.ts'),
      // Node has no `cloudflare:workers` virtual module — alias the routes'
      // static `import { env } from 'cloudflare:workers'` to a process.env shim.
      ...(isNode
        ? { 'cloudflare:workers': r('./src/lib/cloudflare-workers-shim.ts') }
        : {}),
    },
  },
  ssr: {
    // Transpile + bundle the @chm source packages and their bundleable leaf
    // deps into the server build.
    noExternal: [
      '@chm/sql-builder',
      '@chm/logger',
      '@chm/clickhouse-client',
      '@chm/types',
      '@chm/mcp-server',
      '@clickhouse/client-web',
      '@modelcontextprotocol/sdk',
      'lru-cache',
      'zod',
    ],
  },
  plugins: [tailwindcss(), ...runtimePlugins],
})
