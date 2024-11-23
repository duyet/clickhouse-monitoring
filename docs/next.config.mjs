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
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
  search: true,
})

export default withNextra(nextConfig)
