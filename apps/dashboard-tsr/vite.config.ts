import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, type PluginOption } from 'vite'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

// ─────────────────────────────────────────────────────────────────────────────
// Build-time client env (`import.meta.env.VITE_*`).
//
// Vite/TanStack inline `import.meta.env.VITE_*` into BOTH the client and server
// bundles at build time — the equivalent of Next's `NEXT_PUBLIC_*` inlining.
// Cloudflare Worker `[vars]` are RUNTIME-only and never reach the client bundle,
// so anything the browser needs at build time lives here, not in wrangler vars.
//
// Values come from `process.env.VITE_*` (CI overrides — e.g. the pk_test Clerk
// key for preview deploys) with non-secret committed defaults that mirror
// `scripts/patch-wrangler-env.ts`. The Clerk publishable key is a PUBLIC key
// (already committed in wrangler.toml), so defaulting it here is safe.
function git(cmd: string): string {
  try {
    return execSync(`git ${cmd}`, { encoding: 'utf-8' }).trim()
  } catch {
    return ''
  }
}

// Back-compat: each client var also accepts its legacy Next `NEXT_PUBLIC_*`
// build-env name as a fallback, so configs from before the VITE_ rename keep
// working. Precedence: VITE_* (new) → NEXT_PUBLIC_* (legacy) → committed default.
// Only PUBLIC vars live here — never a runtime secret (security boundary).
const e = process.env
const CLIENT_ENV = {
  VITE_AUTH_PROVIDER:
    e.VITE_AUTH_PROVIDER ?? e.NEXT_PUBLIC_AUTH_PROVIDER ?? 'clerk',
  VITE_CLERK_PUBLISHABLE_KEY:
    e.VITE_CLERK_PUBLISHABLE_KEY ??
    e.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    'pk_live_Y2xlcmsuY2htb25pdG9yLmRldiQ',
  VITE_FEATURE_CONVERSATION_DB:
    e.VITE_FEATURE_CONVERSATION_DB ??
    e.NEXT_PUBLIC_FEATURE_CONVERSATION_DB ??
    'true',
  VITE_AUTOCOMPLETE_LIMIT:
    e.VITE_AUTOCOMPLETE_LIMIT ?? e.NEXT_PUBLIC_AUTOCOMPLETE_LIMIT ?? '',
  VITE_RUNNING_QUERIES_REFRESH_MS:
    e.VITE_RUNNING_QUERIES_REFRESH_MS ??
    e.NEXT_PUBLIC_RUNNING_QUERIES_REFRESH_MS ??
    '',
  VITE_GIT_SHA:
    e.VITE_GIT_SHA ?? e.NEXT_PUBLIC_GIT_SHA ?? git('rev-parse HEAD'),
  VITE_GIT_REF:
    e.VITE_GIT_REF ??
    e.NEXT_PUBLIC_GIT_REF ??
    git('rev-parse --abbrev-ref HEAD'),
  VITE_BUILD_TIMESTAMP:
    e.VITE_BUILD_TIMESTAMP ??
    e.NEXT_PUBLIC_BUILD_TIMESTAMP ??
    new Date().toISOString(),
  VITE_CI: e.VITE_CI ?? e.NEXT_PUBLIC_CI ?? (e.CI ? 'true' : ''),
} as const

// Explicit text-replacement of each `import.meta.env.VITE_*` read. Deterministic
// across local + CI builds regardless of Vite's .env-file discovery.
const CLIENT_ENV_DEFINE = Object.fromEntries(
  Object.entries(CLIENT_ENV).map(([k, v]) => [
    `import.meta.env.${k}`,
    JSON.stringify(v),
  ])
)

// ─────────────────────────────────────────────────────────────────────────────
// SSR stub for browser-only render libraries (#1393 worker size limit).
//
// The Cloudflare Worker is deployed with `no_bundle: true`, so `wrangler deploy`
// uploads EVERY file in `dist/server/assets/*.js` against the free-plan 3 MiB
// limit — including the lazy/dynamic-import chunks that only render in the
// browser. mermaid (+cytoscape, katex, the langium/vscode-langserver parser, all
// diagram renderers) and codemirror are always mounted behind React.lazy /
// <ClientOnly> / Suspense, so they NEVER execute during SSR or prerender. Replace
// them with an empty stub in the worker (`ssr`) environment only; the client
// build keeps the real implementations, so runtime behaviour is unchanged.
//
// Matching by bare-specifier prefix covers package entries AND subpaths
// (`@codemirror/view`, `mermaid/dist/...`). Internal relative chunks of these
// packages disappear automatically once their bare entry resolves to the stub.
const SSR_STUB_PREFIXES = [
  'mermaid',
  'cytoscape',
  '@mermaid-js/',
  'katex',
  'dagre',
  '@dagrejs/dagre',
  '@codemirror/',
  'codemirror',
  // SQL beautify (sql-formatter, ~484K). Imported statically in 4 dialog/editor
  // components, but `format()` only runs on user interaction — beautify defaults
  // OFF and getInitialBeautifyState() returns false under SSR (no `window`), so
  // it never executes during prerender. Stub it out of the worker bundle.
  'sql-formatter',
  // @assistant-ui/react + react-ai-sdk (~1.5 MB thread chunk). All assistant-ui
  // code is behind React.lazy in agents-page-client.tsx and
  // global-assistant-modal.tsx — neither path executes during SSR/prerender.
  // Stubbing also drops transitive deps: assistant-cloud, remend, embla-carousel,
  // vaul, hast/rehype/marked, nanoid, zustand, entities, dequal.
  '@assistant-ui/react',
  '@assistant-ui/react-ai-sdk',
]

// rolldown does not honour `syntheticNamedExports` from a resolveId result, so
// the stub must declare every named export an app source file imports from a
// stubbed package (transitive node_modules importers use default/namespace
// imports and don't need this). These are the only `@codemirror/*` named
// imports in the codebase — see src/components/explorer/sql-editor.tsx.
const SSR_STUB_NAMED_EXPORTS = [
  'autocompletion',
  'completionKeymap',
  'defaultKeymap',
  'history',
  'historyKeymap',
  'sql',
  'bracketMatching',
  'defaultHighlightStyle',
  'syntaxHighlighting',
  'searchKeymap',
  'Compartment',
  'EditorState',
  'Transaction',
  'placeholder',
  'EditorView',
  'keymap',
  // sql-formatter
  'format',
  // @assistant-ui/react — all named imports used across src/components/assistant-ui/
  // and src/lib/conversation-store/adapter/
  'ActionBarPrimitive',
  'AssistantModalPrimitive',
  'AssistantRuntimeProvider',
  'BranchPickerPrimitive',
  'ComposerPrimitive',
  'EnrichedPartState',
  'ErrorPrimitive',
  'MessagePartStatus',
  'MessagePrimitive',
  'PartState',
  'RuntimeAdapterProvider',
  'ThreadListItemPrimitive',
  'ThreadListPrimitive',
  'ThreadPrimitive',
  'ToolCallMessagePartStatus',
  'useAui',
  'useMessage',
  'useMessageTiming',
  'useRemoteThreadListRuntime',
  'useScrollLock',
  'useThread',
  'useThreadList',
  'useThreadListItem',
  'useThreadRuntime',
  // @assistant-ui/react-ai-sdk
  'useChatRuntime',
]

const SSR_STUB_VIRTUAL_ID = '\0chm-ssr-client-only-stub'

function isStubbedSpecifier(id: string): boolean {
  return SSR_STUB_PREFIXES.some(
    (p) =>
      id === p ||
      id.startsWith(`${p}/`) ||
      (p.endsWith('/') && id.startsWith(p))
  )
}

function ssrClientOnlyStub(): PluginOption {
  // Virtual module: a Proxy default export (covers default/namespace imports of
  // mermaid/katex/cytoscape) plus explicit named aliases for the codemirror
  // symbols. The Proxy is never invoked — these modules only execute inside
  // browser effects / lazy chunks that the worker never reaches.
  const namedExports = SSR_STUB_NAMED_EXPORTS.map(
    (n) => `export const ${n} = stub`
  ).join('\n')
  const code = `const noop = () => undefined
const stub = new Proxy(noop, {
  get(_t, p) {
    if (p === '__esModule') return true
    if (p === 'default') return stub
    if (typeof p === 'symbol') return undefined
    return stub
  },
  apply() { return undefined },
  construct() { return {} },
})
export default stub
${namedExports}
`
  return {
    name: 'chm:ssr-client-only-stub',
    enforce: 'pre',
    resolveId(id) {
      // The stub exists ONLY to keep the Cloudflare Worker under the free-plan
      // 3 MiB limit (#1393). The Node/Docker target has no size limit and its
      // prerender needs the REAL libs — e.g. computeDagrePositions (PeerGraph)
      // calls dagre during SSR — so never stub when BUILD_TARGET=node.
      if (isNode) return null
      // `this.environment` is the per-environment build context (Vite 6+/8).
      // Only stub in the worker/SSR environment, never the browser client build.
      if (this.environment?.name === 'client') return null
      if (isStubbedSpecifier(id)) return SSR_STUB_VIRTUAL_ID
      return null
    },
    load(id) {
      if (id === SSR_STUB_VIRTUAL_ID) return code
      return null
    },
  }
}
// ─────────────────────────────────────────────────────────────────────────────

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
  // Inline client-exposed build-time env (`import.meta.env.VITE_*`). See
  // CLIENT_ENV above — Worker [vars] are runtime-only and never reach the client.
  define: CLIENT_ENV_DEFINE,
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
      // Native platform bindings — replaces @chm/platform's @opennextjs/cloudflare
      // adapter with a `cloudflare:workers` env reader (see src/lib/platform-native.ts).
      '@chm/platform': r('./src/lib/platform-native.ts'),
      // MCP subpaths — http.ts re-exports cors/server/data via relative imports
      // that resolve from the package source, so aliasing the entrypoints is enough.
      '@chm/mcp-server/http': r('../../packages/mcp-server/src/http.ts'),
      '@chm/mcp-server/data': r(
        '../../packages/mcp-server/src/data/mcp-tools-data.ts'
      ),
      '@chm/mcp-server/auth': r('../../packages/mcp-server/src/auth/index.ts'),
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
  plugins: [ssrClientOnlyStub(), tailwindcss(), ...runtimePlugins],
})
