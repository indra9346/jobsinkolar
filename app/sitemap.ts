import type { MetadataRoute } from 'next'
import { getPublicSupabase } from '@/lib/supabase/server'
import { SITE, TALUKS } from '@/lib/constants'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = getPublicSupabase()
  const [{ data: jobs }, { data: companies }] = await Promise.all([
    sb.from('jobs').select('id,updated_at').eq('status', 'published').limit(5000),
    sb.from('company_directory').select('slug,created_at').limit(2000),
  ])
  const base = SITE.url
  return [
    ...['', '/jobs', '/companies', '/employers', '/about', '/contact', '/job-alerts', '/safety', '/privacy', '/terms'].map((p) => ({ url: `${base}${p}`, changeFrequency: 'daily' as const })),
    ...TALUKS.map((t) => ({ url: `${base}/jobs?taluk=${encodeURIComponent(t)}`, changeFrequency: 'daily' as const })),
    ...(jobs ?? []).map((j) => ({ url: `${base}/jobs/${j.id}`, lastModified: j.updated_at })),
    ...(companies ?? []).map((c) => ({ url: `${base}/companies/${c.slug}`, lastModified: c.created_at })),
  ]
}
