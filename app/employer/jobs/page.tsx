import Link from 'next/link'
import { Briefcase, Plus } from 'lucide-react'
import { requireRole } from '@/lib/session'
import { EmptyState, PageHeader } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { JobActions } from '@/components/portal/JobActions'
import { JOB_STATUS } from '@/lib/constants'
import { cn, formatDate, timeAgo } from '@/lib/format'
import type { JobStatus } from '@/lib/types'

export const metadata = { title: 'Jobs' }

type Row = {
  id: string; title: string; status: JobStatus; location: string; created_at: string; published_at: string | null; expires_at: string | null
  views: number; applications_count: number; rejection_reason: string | null; openings: number
}

const TABS: { key: string; label: string; statuses: JobStatus[] }[] = [
  { key: 'all', label: 'All', statuses: ['draft', 'pending_review', 'published', 'closed', 'rejected'] },
  { key: 'live', label: 'Live', statuses: ['published'] },
  { key: 'review', label: 'In review', statuses: ['pending_review'] },
  { key: 'action', label: 'Needs changes', statuses: ['rejected'] },
  { key: 'draft', label: 'Drafts', statuses: ['draft'] },
  { key: 'closed', label: 'Closed', statuses: ['closed'] },
]

export default async function EmployerJobs({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { sb, user } = await requireRole('employer')
  const tab = (await searchParams).tab ?? 'all'
  const [{ data }, { data: apps }] = await Promise.all([
    sb.from('jobs').select('id,title,status,location,created_at,published_at,expires_at,views,applications_count,rejection_reason,openings').eq('employer_id', user.id).order('created_at', { ascending: false }),
    sb.from('applications').select('job_id,status').eq('employer_id', user.id),
  ])
  const now = Date.now()
  const jobs = ((data ?? []) as Row[]).map((j) => ({ ...j, expired: j.status === 'published' && j.expires_at && new Date(j.expires_at).getTime() <= now }))
  const counts = new Map<string, { pending: number; shortlisted: number }>()
  for (const a of apps ?? []) {
    const c = counts.get(a.job_id) ?? { pending: 0, shortlisted: 0 }
    if (a.status === 'submitted') c.pending++
    if (['shortlisted', 'interview', 'offered', 'hired'].includes(a.status)) c.shortlisted++
    counts.set(a.job_id, c)
  }
  const current = TABS.find((t) => t.key === tab) ?? TABS[0]
  const rows = jobs.filter((j) => current.statuses.includes(j.status))

  return (
    <>
      <PageHeader title="Jobs" description="Manage every job post and its applicants." actions={<Link href="/employer/post-job" className="btn btn-primary"><Plus size={16} /> Post a job</Link>} />
      <div className="-mx-4 mb-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-1 border-b border-line">
          {TABS.map((t) => (
            <Link key={t.key} href={t.key === 'all' ? '/employer/jobs' : `/employer/jobs?tab=${t.key}`} className={cn('-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium', current.key === t.key ? 'border-navy-600 text-ink' : 'border-transparent text-ink-3 hover:text-ink')}>
              {t.label}
              <span className="rounded bg-canvas px-1.5 text-xs text-ink-3 tabular-nums">{jobs.filter((j) => t.statuses.includes(j.status)).length}</span>
            </Link>
          ))}
        </div>
      </div>

      <section className="card overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={<Briefcase size={20} />} title={jobs.length ? 'No jobs in this tab' : 'Post your first job'} body={jobs.length ? undefined : 'Every new company gets 2 free job posts.'} action={!jobs.length && <Link href="/employer/post-job" className="btn btn-primary">Post a job</Link>} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Status</th>
                    <th className="text-right">Applied</th>
                    <th className="text-right">Action pending</th>
                    <th className="text-right">Shortlisted</th>
                    <th className="text-right">Views</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((j) => {
                    const c = counts.get(j.id)
                    return (
                      <tr key={j.id} className="hover:bg-canvas/60">
                        <td className="max-w-[320px]">
                          <Link href={`/employer/jobs/${j.id}`} className="font-medium hover:underline">{j.title}</Link>
                          <p className="text-xs text-ink-3">
                            {j.location} · {j.published_at ? `Posted ${formatDate(j.published_at)}` : `Created ${timeAgo(j.created_at)}`}
                            {j.status === 'published' && j.expires_at ? ` · closes ${formatDate(j.expires_at)}` : ''}
                          </p>
                          {j.status === 'rejected' && j.rejection_reason && <p className="mt-0.5 truncate text-xs text-brand-700">{j.rejection_reason}</p>}
                        </td>
                        <td><StatusPill tone={j.expired ? 'gray' : JOB_STATUS[j.status].tone}>{j.expired ? 'Expired' : JOB_STATUS[j.status].label}</StatusPill></td>
                        <td className="text-right tabular-nums">{j.applications_count}</td>
                        <td className="text-right tabular-nums">{c?.pending ? <Link href={`/employer/jobs/${j.id}?status=submitted`} className="font-semibold text-brand-700 hover:underline">{c.pending}</Link> : 0}</td>
                        <td className="text-right tabular-nums">{c?.shortlisted ?? 0}</td>
                        <td className="text-right text-ink-3 tabular-nums">{j.views}</td>
                        <td className="text-right"><JobActions id={j.id} status={j.status} publishedAt={j.published_at} expiresAt={j.expires_at} compact /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-line-2 md:hidden">
              {rows.map((j) => {
                const c = counts.get(j.id)
                return (
                  <li key={j.id} className="flex gap-3 px-4 py-4">
                    <Link href={`/employer/jobs/${j.id}`} className="min-w-0 flex-1">
                      <p className="font-medium">{j.title}</p>
                      <p className="text-xs text-ink-3">{j.location}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-3">
                        <StatusPill tone={j.expired ? 'gray' : JOB_STATUS[j.status].tone}>{j.expired ? 'Expired' : JOB_STATUS[j.status].label}</StatusPill>
                        <span>{j.applications_count} applied</span>
                        {c?.pending ? <span className="font-semibold text-brand-700">{c.pending} pending</span> : null}
                      </div>
                    </Link>
                    <JobActions id={j.id} status={j.status} publishedAt={j.published_at} expiresAt={j.expires_at} compact />
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>
    </>
  )
}
