import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Use standalone output for hybrid static pages + dynamic API routes
  output: 'standalone',

  // Use separate build directories for dev and production
  // Allows bun run dev and bun run build to not conflict
  distDir: process.env.NODE_ENV === 'production' ? '.next-prod' : '.next',

  // Automatically bundle external packages in the Pages Router:
  bundlePagesRouterDependencies: true,
  // Opt specific packages out of bundling for both App and Pages Router:
  // serverExternalPackages: [],

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

  // https://nextjs.org/docs/app/api-reference/next-config-js/webpack
  webpack: (config, { isServer: _isServer }) => {
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
    initOpenNextCloudflareForDev({
      experimental: { remoteBindings: true },
    })
  })
}
