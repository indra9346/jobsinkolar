import { requireRole } from '@/lib/session'
import { EmployersTable } from './EmployersTable'

export const metadata = { title: 'Employers' }

export default async function AdminEmployers({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string; focus?: string }> }) {
  const { sb } = await requireRole('admin')
  const sp = await searchParams
  let q = sb.from('companies').select('*,profiles(email,full_name,phone,account_status,created_at)').order('created_at', { ascending: false }).limit(500)
  if (sp.filter === 'unverified') q = q.eq('verified', false)
  if (sp.filter === 'verified') q = q.eq('verified', true)
  if (sp.q?.trim()) q = q.ilike('name', `%${sp.q.trim().replace(/[%,]/g, ' ')}%`)
  const [{ data: companies }, { data: wallets }, { data: priv }, { data: jobs }] = await Promise.all([
    q,
    sb.from('employer_wallets').select('employer_id,plan_id,job_credits,unlock_credits,expires_at'),
    sb.from('company_private').select('id,gstin,contact_name,contact_phone,contact_email'),
    sb.from('jobs').select('employer_id,status'),
  ])
  const w = new Map((wallets ?? []).map((x) => [x.employer_id, x]))
  const p = new Map((priv ?? []).map((x) => [x.id, x]))
  const jc = new Map<string, { live: number; total: number }>()
  for (const j of jobs ?? []) {
    const c = jc.get(j.employer_id) ?? { live: 0, total: 0 }
    c.total++
    if (j.status === 'published') c.live++
    jc.set(j.employer_id, c)
  }
  const rows = (companies ?? []).map((c) => ({ ...c, wallet: w.get(c.id) ?? null, priv: p.get(c.id) ?? null, jobs: jc.get(c.id) ?? { live: 0, total: 0 } }))
  return <EmployersTable rows={rows} filter={sp.filter ?? 'all'} q={sp.q ?? ''} focus={sp.focus ?? null} />
}
