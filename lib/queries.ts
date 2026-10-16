import 'server-only'
import { cache } from 'react'
import { getPublicSupabase } from './supabase/server'
import type { Area, Category, Company, Job } from './types'

export const JOB_CARD_COLUMNS =
  'id,title,company_name,company_id,category,employment_type,location,taluk,salary_min,salary_max,salary_period,experience_min,experience_max,work_mode,shift,openings,featured,walk_in,published_at,created_at,expires_at,deadline,skills,companies(name,slug,logo_path,verified)'

export type JobFilters = {
  q?: string
  category?: string
  taluk?: string
  area?: string
  type?: string
  mode?: string
  exp?: string
  salary?: string
  posted?: string
  sort?: string
  page?: string
  company?: string
}

export const PAGE_SIZE = 20

const live = (q: any) => q.eq('status', 'published').or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)

export async function searchJobs(f: JobFilters) {
  const sb = getPublicSupabase()
  const page = Math.max(1, Number(f.page) || 1)
  let q = live(sb.from('jobs').select(JOB_CARD_COLUMNS, { count: 'exact' }))

  if (f.q?.trim()) {
    const term = f.q.trim().replace(/[%,()]/g, ' ').slice(0, 80)
    q = q.or(`title.ilike.%${term}%,company_name.ilike.%${term}%,category.ilike.%${term}%,description.ilike.%${term}%`)
  }
  if (f.category) q = q.eq('category', f.category)
  if (f.area && /^[0-9a-f-]{36}$/i.test(f.area)) q = q.eq('area_id', f.area)
  else if (f.taluk) q = q.eq('taluk', f.taluk)
  if (f.type) q = q.eq('employment_type', f.type)
  if (f.mode) q = q.eq('work_mode', f.mode)
  if (f.company) q = q.eq('company_id', f.company)
  if (f.exp) {
    const n = Number(f.exp)
    if (n === 0) q = q.eq('experience_min', 0)
    else q = q.lte('experience_min', n)
  }
  if (f.salary) q = q.gte('salary_max', Number(f.salary))
  if (f.posted) {
    const days = Number(f.posted)
    if (days > 0) q = q.gte('published_at', new Date(Date.now() - days * 86400000).toISOString())
  }

  if (f.sort === 'salary') q = q.order('salary_max', { ascending: false, nullsFirst: false })
  else q = q.order('featured', { ascending: false }).order('published_at', { ascending: false, nullsFirst: false })
  q = q.order('created_at', { ascending: false })

  const from = (page - 1) * PAGE_SIZE
  const { data, count, error } = await q.range(from, from + PAGE_SIZE - 1)
  if (error) console.error('searchJobs', error.message)
  return { jobs: (data ?? []) as unknown as Job[], total: count ?? 0, page }
}

export const getJob = cache(async (id: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const sb = getPublicSupabase()
  const { data } = await live(sb.from('jobs').select('*,companies(name,slug,logo_path,verified,industry,company_size,about,website)').eq('id', id)).maybeSingle()
  return data as (Job & { companies: (Company & { verified: boolean }) | null }) | null
})

export async function getSimilarJobs(job: Job, limit = 4) {
  const sb = getPublicSupabase()
  const { data } = await live(sb.from('jobs').select(JOB_CARD_COLUMNS))
    .neq('id', job.id)
    .or(`category.eq.${job.category}${job.taluk ? `,taluk.eq.${job.taluk}` : ''}`)
    .order('published_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as unknown as Job[]
}

export async function getLatestJobs(limit = 8) {
  const sb = getPublicSupabase()
  const { data } = await live(sb.from('jobs').select(JOB_CARD_COLUMNS))
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as unknown as Job[]
}

export const getCategories = cache(async () => {
  const { data } = await getPublicSupabase().from('job_categories').select('id,name,slug,description').eq('active', true).order('sort_order')
  return (data ?? []) as Category[]
})

export const getAreas = cache(async () => {
  const { data } = await getPublicSupabase().from('areas').select('id,name,taluk,pincode').eq('active', true).eq('verified', true).order('name')
  return (data ?? []) as Area[]
})

export type PublicStats = {
  live_jobs: number
  openings: number
  companies: number
  candidates: number
  hires: number
  by_category: Record<string, number>
  by_taluk: Record<string, number>
}

export const getStats = cache(async () => {
  const { data } = await getPublicSupabase().rpc('public_stats')
  return (data ?? { live_jobs: 0, openings: 0, companies: 0, candidates: 0, hires: 0, by_category: {}, by_taluk: {} }) as PublicStats
})

export async function getCompanies() {
  const { data } = await getPublicSupabase().from('company_directory').select('*').order('verified', { ascending: false }).order('open_jobs', { ascending: false })
  return ((data ?? []) as Company[]).filter((c) => c.verified || (c.open_jobs ?? 0) > 0)
}

export const getCompany = cache(async (slug: string) => {
  const { data } = await getPublicSupabase().from('company_directory').select('*').eq('slug', slug).maybeSingle()
  return data as Company | null
})
