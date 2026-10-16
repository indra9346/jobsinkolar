import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import { requireRole } from '@/lib/session'
import { EmptyState, PageHeader } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { APP_STATUS } from '@/lib/constants'
import { MiniTracker } from '@/components/portal/MiniTracker'
import { cn, formatDate, formatSalary, timeAgo } from '@/lib/format'
import type { Application, AppStatus } from '@/lib/types'

export const metadata = { title: 'My applications' }

const TABS: { key: string; label: string; match: (s: AppStatus) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'active', label: 'In progress', match: (s) => ['submitted', 'reviewing'].includes(s) },
  { key: 'progress', label: 'Shortlisted', match: (s) => ['shortlisted', 'interview', 'offered', 'hired'].includes(s) },
  { key: 'closed', label: 'Closed', match: (s) => ['rejected', 'withdrawn'].includes(s) },
]

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { sb } = await requireRole('candidate')
  const tab = (await searchParams).tab ?? 'all'
  const { data } = await sb
    .from('applications')
    .select('id,status,created_at,updated_at,interview_at,job_id,jobs(id,title,company_name,location,salary_min,salary_max,salary_period,status)')
    .order('updated_at', { ascending: false })
  const all = (data ?? []) as unknown as Application[]
  const current = TABS.find((t) => t.key === tab) ?? TABS[0]
  const rows = all.filter((a) => current.match(a.status))

  return (
    <>
      <PageHeader title="My applications" description="Every status change is also sent to your notifications." />
      <div className="-mx-4 mb-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-1 border-b border-line">
          {TABS.map((t) => {
            const n = all.filter((a) => t.match(a.status)).length
            return (
              <Link
                key={t.key}
                href={t.key === 'all' ? '/candidate/applications' : `/candidate/applications?tab=${t.key}`}
                className={cn('-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium', current.key === t.key ? 'border-navy-600 text-ink' : 'border-transparent text-ink-3 hover:text-ink')}
              >
                {t.label} <span className="rounded bg-canvas px-1.5 text-xs text-ink-3 tabular-nums">{n}</span>
              </Link>
            )
          })}
        </div>
      </div>
      <section className="card">
        {rows.length === 0 ? (
          <EmptyState icon={<ClipboardList size={20} />} title={all.length ? 'Nothing in this tab' : 'You haven’t applied yet'} body="Applications you send appear here with live status." action={<Link href="/jobs" className="btn btn-primary">Browse jobs</Link>} />
        ) : (
          <ul className="divide-y divide-line-2">
            {rows.map((a) => (
              <li key={a.id}>
                <Link href={`/candidate/applications/${a.id}`} className="flex flex-col gap-2 px-5 py-4 hover:bg-canvas sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.jobs?.title ?? 'Job no longer available'}</p>
                    <p className="truncate text-sm text-ink-3">
                      {a.jobs?.company_name} · {a.jobs?.location} · {formatSalary(a.jobs?.salary_min, a.jobs?.salary_max, a.jobs?.salary_period)}
                    </p>
                    <p className="mt-1 text-xs text-ink-4">
                      Applied {formatDate(a.created_at)} · updated {timeAgo(a.updated_at)}
                      {a.status === 'interview' && a.interview_at ? ` · Interview ${formatDate(a.interview_at, true)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <StatusPill tone={APP_STATUS[a.status].tone}>{APP_STATUS[a.status].label}</StatusPill>
                    <MiniTracker status={a.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
