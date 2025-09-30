import { codecovWebpackPlugin } from '@codecov/webpack-plugin'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
import type { NextConfig } from 'next'

if (process.env.NODE_ENV === 'development') {
  await initOpenNextCloudflareForDev()
}

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
