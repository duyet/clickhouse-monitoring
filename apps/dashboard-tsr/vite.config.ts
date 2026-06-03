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
    // The @chm/* source packages live at ../../packages and are transpiled into
    // the worker (ssr.noExternal). Their npm deps live in THIS app's isolated
    // node_modules (own-lockfile), which is not on the packages' upward resolve
    // path — dedupe forces these bare specifiers to resolve from the app root.
    dedupe: [
      '@clickhouse/client-web',
      'lru-cache',
      'zod',
      'react',
      'react-dom',
    ],
    alias: {
      '@': r('./src'),
      // Shared workspace packages resolved from SOURCE — own-lockfile isolation
      // means no `workspace:*` protocol. Vite transpiles them; ssr.noExternal
      // (below) bundles them into the worker rather than externalizing.
      '@chm/sql-builder': r('../../packages/sql-builder/src/index.ts'),
      '@chm/logger': r('../../packages/logger/src/index.ts'),
      '@chm/clickhouse-client': r(
        '../../packages/clickhouse-client/src/index.ts'
      ),
      '@chm/clickhouse-client/runtime/cloudflare-workers': r(
        '../../packages/clickhouse-client/src/runtime/cloudflare-workers.ts'
      ),
      // The node @clickhouse/client (node:os/node:stream/TCP) is a static value
      // import in clickhouse-client.ts, used only on the web:false branch which
      // never runs (we force web:true). Because @chm/clickhouse-client is
      // noExternal, Rolldown walks that import — alias it to an empty stub so it
      // resolves in the worker instead of leaving an unresolvable bare specifier.
      '@clickhouse/client': r('./src/lib/empty.ts'),
    },
  },
  ssr: {
    // Transpile + bundle the @chm source packages and their bundleable leaf
    // deps into the worker.
    noExternal: [
      '@chm/sql-builder',
      '@chm/logger',
      '@chm/clickhouse-client',
      '@clickhouse/client-web',
      'lru-cache',
      'zod',
    ],
    // The node @clickhouse/client is kept out of the worker via the empty-stub
    // resolve.alias above. (ssr.external is rejected by @cloudflare/vite-plugin
    // for Worker environments, so the alias is the only mechanism.)
  },
  plugins: [
    tailwindcss(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart(),
    viteReact(),
  ],
})
