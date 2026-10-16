import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/candidate', '/employer', '/admin', '/auth'] }],
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
