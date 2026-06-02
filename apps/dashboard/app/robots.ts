import type { MetadataRoute } from 'next'

/** Generate at build time — content is static. */
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://dash.chmonitor.dev'
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
