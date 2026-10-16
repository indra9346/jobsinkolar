import { requireRole } from '@/lib/session'
import { ModerationQueue } from './ModerationQueue'
import type { JobStatus } from '@/lib/types'

export const metadata = { title: 'Job moderation' }

const MAP: Record<string, JobStatus[]> = {
  pending: ['pending_review'],
  live: ['published'],
  rejected: ['rejected'],
  closed: ['closed'],
  all: ['pending_review', 'published', 'rejected', 'closed'],
}

export default async function AdminJobs({ searchParams }: { searchParams: Promise<{ tab?: string; focus?: string; q?: string }> }) {
  const { sb } = await requireRole('admin')
  const sp = await searchParams
  const tab = sp.tab && MAP[sp.tab] ? sp.tab : 'pending'
  let q = sb
    .from('jobs')
    .select('*,companies(name,slug,verified,industry,website)')
    .in('status', MAP[tab])
    .order(tab === 'pending' ? 'submitted_at' : 'updated_at', { ascending: tab === 'pending', nullsFirst: false })
    .limit(200)
  if (sp.q?.trim()) {
    const t = sp.q.trim().replace(/[%,()]/g, ' ')
    q = q.or(`title.ilike.%${t}%,company_name.ilike.%${t}%`)
  }
  const [{ data }, counts] = await Promise.all([
    q,
    Promise.all(Object.entries(MAP).map(async ([k, v]) => [k, (await sb.from('jobs').select('id', { count: 'exact', head: true }).in('status', v)).count ?? 0] as const)),
  ])
  return <ModerationQueue jobs={data ?? []} tab={tab} counts={Object.fromEntries(counts)} focus={sp.focus ?? null} q={sp.q ?? ''} />
}
