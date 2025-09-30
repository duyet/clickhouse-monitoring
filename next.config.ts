import { codecovWebpackPlugin } from '@codecov/webpack-plugin'
import type { NextConfig } from 'next'

// Note: initOpenNextCloudflareForDev is not used here because:
// 1. It requires top-level await which doesn't work with Next.js config compilation
// 2. Cloudflare Pages deployment is handled separately via wrangler.jsonc
// 3. For local Cloudflare Workers development, use: npx @cloudflare/next-on-pages

const nextConfig: NextConfig = {
  output: 'standalone',

  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

  experimental: {},

  // Automatically bundle external packages in the Pages Router:
  bundlePagesRouterDependencies: true,
  // Opt specific packages out of bundling for both App and Pages Router:
  // serverExternalPackages: [],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        port: '',
      },
    ],
  },

  // https://nextjs.org/docs/app/api-reference/next-config-js/webpack
  webpack: (config) => {
    config.plugins.push(
      codecovWebpackPlugin({
        enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
        bundleName: 'clickhouse-monitoring-bundle',
        uploadToken: process.env.CODECOV_TOKEN,
      })
    )

    // Important: return the modified config
    return config
  },
}

export default nextConfig

import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
initOpenNextCloudflareForDev()
