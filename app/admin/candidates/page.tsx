import { requireRole } from '@/lib/session'
import { CandidatesTable } from './CandidatesTable'

export const metadata = { title: 'Candidates' }

export default async function AdminCandidates({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const { sb } = await requireRole('admin')
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  let q = sb
    .from('profiles')
    .select('id,full_name,email,phone,current_title,taluk,experience_years,account_status,interest_status,resume_path,created_at,last_active_at,talent_visible', { count: 'exact' })
    .eq('role', 'candidate')
    .eq('is_admin', false)
    .order('created_at', { ascending: false })
    .range((page - 1) * 50, page * 50 - 1)
  if (sp.status) q = q.eq('account_status', sp.status)
  if (sp.q?.trim()) {
    const t = sp.q.trim().replace(/[%,()]/g, ' ')
    q = q.or(`full_name.ilike.%${t}%,email.ilike.%${t}%,phone.ilike.%${t}%,current_title.ilike.%${t}%`)
  }
  const { data, count } = await q
  return <CandidatesTable rows={data ?? []} total={count ?? 0} page={page} q={sp.q ?? ''} status={sp.status ?? ''} />
}
