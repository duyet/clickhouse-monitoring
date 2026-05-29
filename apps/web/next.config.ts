import type { NextConfig } from 'next'

import path from 'node:path'

// next.config.ts is compiled as CommonJS (require.resolve below), so __dirname
// is the native CJS global — do NOT use import.meta.url, which forces ESM and
// breaks the compiled config ("exports is not defined in ES module scope").

// Check if optional @vercel/analytics is available
let hasVercelAnalytics = false
try {
  require.resolve('@vercel/analytics/react')
  hasVercelAnalytics = true
} catch {
  // Optional dependency not installed
}

const nextConfig: NextConfig = {
  // Use standalone output for hybrid static pages + dynamic API routes
  output: 'standalone',

  // Trace from the monorepo root so standalone output includes hoisted
  // node_modules and workspace packages (apps/web -> ../..)
  outputFileTracingRoot: path.resolve(__dirname, '../..'),

  // Safety net: exclude non-production and development assets from tracing
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'rust/**/*',
      'coverage/**/*',
      'cypress/**/*',
      '.nyc_output/**/*',
      '.open-next/**/*',
      '.next/cache/**/*',
      'public/docs-assets/**/*',
      'tsconfig.tsbuildinfo',
      'tsconfig.codex-temp.tsbuildinfo',
      'bun.lock',
    ],
  },

  // React Compiler auto-memoizes components, replacing manual
  // useMemo/useCallback/memo. Requires babel-plugin-react-compiler.
  reactCompiler: true,

  // Limit experimental cpus / worker threads to reduce memory footprint
  experimental: {
    workerThreads: false,
    cpus: 1,
  },

  // Transpile workspace packages that ship raw TypeScript with node: scheme
  // dynamic imports (e.g. @chm/clickhouse-client's WASM loader) so Next applies
  // the same loaders/polyfills as app-internal code.
  transpilePackages: ['@chm/clickhouse-client'],

  // Automatically bundle external packages in the Pages Router:
  bundlePagesRouterDependencies: true,
  // Opt specific packages out of bundling for both App and Pages Router:
  serverExternalPackages: ['undici'],
  outputFileTracingIncludes: {
    '/api/v1/browser-connections/*': ['node_modules/undici/**/*'],
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        port: '',
      },
    ],
  },

  turbopack: {
    resolveAlias: {
      '@vercel/og': { browser: './lib/stubs/empty.js', default: '@vercel/og' },
      'next/dist/compiled/@vercel/og/resvg.wasm': './lib/stubs/empty.js',
      'next/dist/compiled/@vercel/og/yoga.wasm': './lib/stubs/empty.js',
      ...(!hasVercelAnalytics && {
        '@vercel/analytics/react': './lib/stubs/vercel-analytics.js',
      }),
    },
  },

  // https://nextjs.org/docs/app/api-reference/next-config-js/webpack
  webpack: (config, { isServer }) => {
    // Exclude @clickhouse/client from client bundles (uses node:os, node:stream, etc.)
    if (!isServer) {
      config.resolve = config.resolve || {}
      config.resolve.alias = {
        ...config.resolve.alias,
        '@clickhouse/client': false,
      }
    }

    // Exclude @vercel/og WASM files from bundle (not compatible with Cloudflare Workers)
    config.externals = config.externals || []
    config.externals.push({
      '@vercel/og': 'commonjs @vercel/og',
      '@vercel/og/dist/index': 'commonjs @vercel/og/dist/index',
      '@vercel/og/dist/index.node': 'commonjs @vercel/og/dist/index.node',
    })

    // Also exclude the compiled WASM files
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      'next/dist/compiled/@vercel/og/resvg.wasm': false,
      'next/dist/compiled/@vercel/og/yoga.wasm': false,
      // Stub @vercel/analytics when not installed (optional dependency)
      ...(!hasVercelAnalytics && {
        '@vercel/analytics/react': require.resolve(
          './lib/stubs/vercel-analytics.js'
        ),
      }),
    }

    // Exclude Cypress test files (.cy.tsx, .cy.ts) from webpack bundling
    if (config.module) {
      const excludeCyFiles = (rule: any) => {
        if (rule.test?.toString().includes('tsx')) {
          rule.exclude = /\.cy\.(tsx|ts)$/
        }
        if (rule.test?.toString().includes('ts')) {
          if (!rule.exclude) {
            rule.exclude = /\.cy\.(tsx|ts)$/
          }
        }
      }

      // Check include/exclude in module rules
      config.module.rules?.forEach(excludeCyFiles)

      // Handle nested rules
      config.module.rules?.forEach((rule: any) => {
        if (rule.oneOf) {
          rule.oneOf.forEach(excludeCyFiles)
        }
      })
    }

    // Important: return the modified config
    return config
  },
}

export default nextConfig

// Only initialize Cloudflare for dev when ENABLE_CLOUDFLARE is set
if (process.env.ENABLE_CLOUDFLARE === 'true') {
  import('@opennextjs/cloudflare').then(({ initOpenNextCloudflareForDev }) => {
    initOpenNextCloudflareForDev(
      // @ts-expect-error -- experimental option may not exist in all versions
      { experimental: { remoteBindings: true } }
    )
  })
}
