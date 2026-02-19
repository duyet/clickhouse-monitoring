import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Use standalone output for hybrid static pages + dynamic API routes
  output: 'standalone',

  // Automatically bundle external packages in the Pages Router:
  bundlePagesRouterDependencies: true,

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
}

export default nextConfig

// Only initialize Cloudflare for dev when ENABLE_CLOUDFLARE is set
if (process.env.ENABLE_CLOUDFLARE === 'true') {
  import('@opennextjs/cloudflare').then(({ initOpenNextCloudflareForDev }) => {
    initOpenNextCloudflareForDev({
      // experimental: { remoteBindings: true }, // Removed due to type incompatibility
    } as any)
  })
}
