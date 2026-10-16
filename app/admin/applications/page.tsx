import Link from 'next/link'
import { requireRole } from '@/lib/session'
import { EmptyState, PageHeader } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { ApplicantSearch } from '@/components/portal/ApplicantSearch'
import { APP_STATUS } from '@/lib/constants'
import { cn, formatDate } from '@/lib/format'
import type { AppStatus } from '@/lib/types'

export const metadata = { title: 'Applications' }

export default async function AdminApplications({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const { sb } = await requireRole('admin')
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  let q = sb
    .from('applications')
    .select('id,status,created_at,updated_at,candidate_snapshot,jobs(id,title,company_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * 50, page * 50 - 1)
  if (sp.status) q = q.eq('status', sp.status)
  const { data, count } = await q
  type R = { id: string; status: AppStatus; created_at: string; updated_at: string; candidate_snapshot: { full_name?: string }; jobs: { id: string; title: string; company_name: string } | null }
  let rows = (data ?? []) as unknown as R[]
  const term = sp.q?.trim().toLowerCase()
  if (term) rows = rows.filter((r) => `${r.candidate_snapshot?.full_name} ${r.jobs?.title} ${r.jobs?.company_name}`.toLowerCase().includes(term))
  const pages = Math.ceil((count ?? 0) / 50)
  const href = (p: Record<string, string>) => {
    const u = new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.status ? { status: sp.status } : {}), ...p })
    for (const [k, v] of [...u.entries()]) if (!v) u.delete(k)
    return `/admin/applications${u.size ? `?${u}` : ''}`
  }

  return (
    <>
      <PageHeader title="Applications" description="Audit trail of every application on the platform." actions={<ApplicantSearch initial={sp.q ?? ''} placeholder="Candidate, job or company" kind="job" />} />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {[['', 'All'], ...Object.entries(APP_STATUS).map(([k, v]) => [k, v.label])].map(([k, l]) => (
          <Link key={k} href={href({ status: k, page: '' })} className={cn('rounded-full border px-3 py-1 text-[13px] font-medium', (sp.status ?? '') === k ? 'border-navy-600 bg-navy-50 text-navy-800' : 'border-line text-ink-2 hover:border-ink-4')}>{l}</Link>
        ))}
      </div>
      <section className="card overflow-hidden">
        {rows.length === 0 ? <EmptyState title="No applications" /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Candidate</th><th>Job</th><th>Company</th><th>Status</th><th>Applied</th><th>Updated</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.candidate_snapshot?.full_name ?? '—'}</td>
                    <td>{r.jobs ? <Link href={`/admin/jobs?tab=all&focus=${r.jobs.id}&q=${encodeURIComponent(r.jobs.title)}`} className="hover:underline">{r.jobs.title}</Link> : '—'}</td>
                    <td className="text-ink-2">{r.jobs?.company_name}</td>
                    <td><StatusPill tone={APP_STATUS[r.status].tone}>{APP_STATUS[r.status].label}</StatusPill></td>
                    <td className="whitespace-nowrap text-ink-3">{formatDate(r.created_at)}</td>
                    <td className="whitespace-nowrap text-ink-3">{formatDate(r.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && <Link href={href({ page: String(page - 1) })} className="btn btn-outline btn-sm">Previous</Link>}
          <span className="text-sm text-ink-3">Page {page} of {pages}</span>
          {page < pages && <Link href={href({ page: String(page + 1) })} className="btn btn-outline btn-sm">Next</Link>}
        </div>
      )}
    </>
  )
}
