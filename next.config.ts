import type { NextConfig } from 'next'

import { codecovWebpackPlugin } from '@codecov/webpack-plugin'

const nextConfig: NextConfig = {
  // Use standalone output for hybrid static pages + dynamic API routes
  output: 'standalone',

  // Enable Turbopack (default in Next.js 16) - Note: using webpack for Cloudflare
  turbopack: {},

  experimental: {
    turbopackUseSystemTlsCerts: true,
  },

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
    config.plugins.push(
      codecovWebpackPlugin({
        enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
        bundleName: 'clickhouse-monitoring-bundle',
        uploadToken: process.env.CODECOV_TOKEN,
      })
    )

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
