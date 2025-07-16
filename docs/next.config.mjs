import nextra from 'nextra'

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'export',
  basePath: '/clickhouse-monitoring',
  images: {
    unoptimized: true, // mandatory, otherwise won't export
  },
  distDir: 'build',
}

const withNextra = nextra({
  // config for nextra
})

export default withNextra(nextConfig)
