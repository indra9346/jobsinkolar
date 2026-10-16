import Link from 'next/link'
import { Users } from 'lucide-react'
import { Avatar, EmptyState } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { QuickStatus } from './QuickStatus'
import { ExportCsv } from './ExportCsv'
import { ApplicantSearch } from './ApplicantSearch'
import { APP_STATUS } from '@/lib/constants'
import { cn, formatDate, timeAgo } from '@/lib/format'
import type { AppStatus } from '@/lib/types'

export type ApplicantRow = {
  id: string
  status: AppStatus
  created_at: string
  viewed_at: string | null
  interview_at: string | null
  candidate_snapshot: { full_name?: string; headline?: string; experience_years?: number; location?: string; skills?: string[] }
  screening_answers: { question: string; answer: string }[]
  resume_path: string | null
  job_id: string
  jobs: { title: string } | null
}

export const APPLICANT_TABS: { key: string; label: string; statuses: AppStatus[] }[] = [
  { key: 'all', label: 'All', statuses: ['submitted', 'reviewing', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn'] },
  { key: 'submitted', label: 'Action pending', statuses: ['submitted'] },
  { key: 'reviewing', label: 'Reviewed', statuses: ['reviewing'] },
  { key: 'shortlisted', label: 'Shortlisted', statuses: ['shortlisted'] },
  { key: 'interview', label: 'Interview', statuses: ['interview'] },
  { key: 'offered', label: 'Offered & hired', statuses: ['offered', 'hired'] },
  { key: 'rejected', label: 'Rejected', statuses: ['rejected', 'withdrawn'] },
]

export function ApplicantList({ rows, basePath, status, q, showJob = true }: { rows: ApplicantRow[]; basePath: string; status: string; q: string; showJob?: boolean }) {
  const tab = APPLICANT_TABS.find((t) => t.key === status) ?? APPLICANT_TABS[0]
  const term = q.trim().toLowerCase()
  const searched = term
    ? rows.filter((r) => [r.candidate_snapshot?.full_name, r.candidate_snapshot?.headline, r.candidate_snapshot?.location, ...(r.candidate_snapshot?.skills ?? [])].join(' ').toLowerCase().includes(term))
    : rows
  const shown = searched.filter((r) => tab.statuses.includes(r.status))
  const href = (k: string) => {
    const p = new URLSearchParams()
    if (k !== 'all') p.set('status', k)
    if (q) p.set('q', q)
    return `${basePath}${basePath.includes('?') ? '&' : '?'}${p}`.replace(/[?&]$/, '')
  }

  // Typeahead options from the applicants already loaded (names, roles, places, skills).
  const suggestions: { value: string; type: string }[] = []
  const seen = new Set<string>()
  const add = (value: string | undefined, type: string) => {
    if (!value || seen.has(value.toLowerCase())) return
    seen.add(value.toLowerCase())
    suggestions.push({ value, type })
  }
  for (const r of rows) {
    add(r.candidate_snapshot?.full_name, 'candidate')
    add(r.candidate_snapshot?.headline, 'role')
    add(r.candidate_snapshot?.location, 'area')
    for (const sk of r.candidate_snapshot?.skills ?? []) add(sk, 'skill')
  }

  const csv = shown.map((r) => ({
    Candidate: r.candidate_snapshot?.full_name ?? '',
    Role: r.candidate_snapshot?.headline ?? '',
    Experience: r.candidate_snapshot?.experience_years ?? '',
    Location: r.candidate_snapshot?.location ?? '',
    Job: r.jobs?.title ?? '',
    Status: APP_STATUS[r.status].label,
    Applied: formatDate(r.created_at),
    ...Object.fromEntries((r.screening_answers ?? []).map((s, i) => [`Q${i + 1}: ${s.question}`, s.answer])),
  }))

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ApplicantSearch initial={q} options={suggestions} />
        <ExportCsv rows={csv} filename="applicants" />
      </div>
      <div className="-mx-4 mb-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-1 border-b border-line">
          {APPLICANT_TABS.map((t) => (
            <Link key={t.key} href={href(t.key)} scroll={false} className={cn('-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium', tab.key === t.key ? 'border-navy-600 text-ink' : 'border-transparent text-ink-3 hover:text-ink')}>
              {t.label}
              <span className={cn('rounded px-1.5 text-xs tabular-nums', t.key === 'submitted' && searched.some((r) => r.status === 'submitted') ? 'bg-brand-50 text-brand-700' : 'bg-canvas text-ink-3')}>
                {searched.filter((r) => t.statuses.includes(r.status)).length}
              </span>
            </Link>
          ))}
        </div>
      </div>
      <section className="card">
        {shown.length === 0 ? (
          <EmptyState icon={<Users size={20} />} title={rows.length ? 'No applicants here' : 'No applicants yet'} body={rows.length ? 'Try another tab or search.' : 'Applicants appear here as soon as they apply. Share your job link to get more.'} />
        ) : (
          <ul className="divide-y divide-line-2">
            {shown.map((r) => {
              const c = r.candidate_snapshot ?? {}
              return (
                <li key={r.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                  <Link href={`/employer/applications/${r.id}`} className="flex min-w-0 flex-1 gap-3">
                    <Avatar name={c.full_name} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2">
                        <span className={cn('truncate', r.viewed_at ? 'font-medium' : 'font-semibold')}>{c.full_name || 'Candidate'}</span>
                        {!r.viewed_at && <span className="rounded bg-brand-50 px-1.5 text-[11px] font-semibold text-brand-700">New</span>}
                      </p>
                      <p className="truncate text-sm text-ink-3">
                        {[c.headline, c.experience_years !== undefined && c.experience_years !== null ? `${c.experience_years} yrs exp` : null, c.location].filter(Boolean).join(' · ') || 'Profile details on open'}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-ink-4">
                        {showJob && r.jobs?.title ? `${r.jobs.title} · ` : ''}Applied {timeAgo(r.created_at)}
                        {r.resume_path ? ' · Resume attached' : ''}
                        {r.status === 'interview' && r.interview_at ? ` · Interview ${formatDate(r.interview_at, true)}` : ''}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 pl-[52px] sm:pl-0">
                    <StatusPill tone={APP_STATUS[r.status].tone}>{APP_STATUS[r.status].label}</StatusPill>
                    <QuickStatus id={r.id} status={r.status} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}
