import { codecovWebpackPlugin } from '@codecov/webpack-plugin'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',

  // Enable Turbopack (default in Next.js 16)
  turbopack: {},

  experimental: {
    turbopackUseSystemTlsCerts: true,
  },

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

// Only initialize Cloudflare for dev when ENABLE_CLOUDFLARE is set
if (process.env.ENABLE_CLOUDFLARE === 'true') {
  import('@opennextjs/cloudflare').then(({ initOpenNextCloudflareForDev }) => {
    initOpenNextCloudflareForDev({
      experimental: { remoteBindings: true },
    })
  })
}
