import Link from 'next/link'
import { requireRole } from '@/lib/session'
import { PageHeader } from '@/components/ui/bits'
import { ExportCsv } from '@/components/portal/ExportCsv'
import { APP_STATUS } from '@/lib/constants'
import { cn, formatDate } from '@/lib/format'
import type { AppStatus } from '@/lib/types'

export const metadata = { title: 'Reports' }

const RANGES = [
  ['7', 'Last 7 days'],
  ['30', 'Last 30 days'],
  ['90', 'Last 90 days'],
  ['all', 'All time'],
] as const

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { sb, user } = await requireRole('employer')
  const range = (await searchParams).range ?? '30'
  let q = sb.from('applications').select('id,status,created_at,viewed_at,candidate_snapshot,job_id,jobs(title)').eq('employer_id', user.id).order('created_at', { ascending: false })
  if (range !== 'all') q = q.gte('created_at', new Date(Date.now() - Number(range) * 86400000).toISOString())
  const [{ data }, { data: jobs }] = await Promise.all([q, sb.from('jobs').select('id,title,views,status').eq('employer_id', user.id)])
  const apps = (data ?? []) as unknown as { id: string; status: AppStatus; created_at: string; viewed_at: string | null; candidate_snapshot: { full_name?: string; headline?: string; experience_years?: number; location?: string }; job_id: string; jobs: { title: string } | null }[]

  const total = apps.length
  const reached = (s: AppStatus[]) => apps.filter((a) => s.includes(a.status)).length
  const funnel = [
    ['Applied', total],
    ['Reviewed', apps.filter((a) => a.viewed_at).length],
    ['Shortlisted', reached(['shortlisted', 'interview', 'offered', 'hired'])],
    ['Interviewed', reached(['interview', 'offered', 'hired'])],
    ['Offered', reached(['offered', 'hired'])],
    ['Hired', reached(['hired'])],
  ] as const
  const viewedTimes = apps.filter((a) => a.viewed_at).map((a) => new Date(a.viewed_at!).getTime() - new Date(a.created_at).getTime())
  const avgHours = viewedTimes.length ? Math.round(viewedTimes.reduce((x, y) => x + y, 0) / viewedTimes.length / 3600000) : null

  const perJob = (jobs ?? []).map((j) => {
    const a = apps.filter((x) => x.job_id === j.id)
    return { ...j, applied: a.length, shortlisted: a.filter((x) => ['shortlisted', 'interview', 'offered', 'hired'].includes(x.status)).length, hired: a.filter((x) => x.status === 'hired').length }
  }).filter((j) => j.applied > 0 || j.status === 'published').sort((a, b) => b.applied - a.applied)

  const csv = apps.map((a) => ({
    'Application ID': a.id,
    Job: a.jobs?.title ?? '',
    Candidate: a.candidate_snapshot?.full_name ?? '',
    Role: a.candidate_snapshot?.headline ?? '',
    Experience: a.candidate_snapshot?.experience_years ?? '',
    Location: a.candidate_snapshot?.location ?? '',
    Status: APP_STATUS[a.status].label,
    Applied: formatDate(a.created_at),
  }))

  return (
    <>
      <PageHeader title="Reports" description="Hiring funnel and response times." actions={<ExportCsv rows={csv} filename={`applications-${range}`} label="Export applications" />} />
      <div className="mb-5 flex flex-wrap gap-1.5">
        {RANGES.map(([k, l]) => (
          <Link key={k} href={`/employer/reports?range=${k}`} className={cn('rounded-full border px-3 py-1 text-[13px] font-medium', range === k ? 'border-navy-600 bg-navy-50 text-navy-800' : 'border-line text-ink-2 hover:border-ink-4')}>{l}</Link>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <section className="card p-5">
          <h2 className="font-semibold">Hiring funnel</h2>
          <ul className="mt-4 space-y-3">
            {funnel.map(([label, n]) => (
              <li key={label} className="grid grid-cols-[100px_1fr_48px] items-center gap-3 text-sm">
                <span className="text-ink-2">{label}</span>
                <span className="h-6 overflow-hidden rounded bg-canvas">
                  <span className="block h-full rounded bg-navy-600" style={{ width: total ? `${Math.max(2, (n / total) * 100)}%` : '0%' }} />
                </span>
                <span className="text-right font-semibold tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card grid content-start gap-4 p-5">
          <div><p className="text-[13px] text-ink-3">Average time to first review</p><p className="mt-1 text-2xl font-semibold">{avgHours === null ? '—' : avgHours < 24 ? `${avgHours} h` : `${Math.round(avgHours / 24)} days`}</p></div>
          <div><p className="text-[13px] text-ink-3">Shortlist rate</p><p className="mt-1 text-2xl font-semibold">{total ? `${Math.round((funnel[2][1] / total) * 100)}%` : '—'}</p></div>
          <div><p className="text-[13px] text-ink-3">Awaiting review</p><p className="mt-1 text-2xl font-semibold">{reached(['submitted'])}</p></div>
        </section>
      </div>
      <section className="card mt-5 overflow-hidden">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold">By job</h2></div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Job</th><th className="text-right">Views (all time)</th><th className="text-right">Applied</th><th className="text-right">Shortlisted</th><th className="text-right">Hired</th><th className="text-right">Apply rate</th></tr></thead>
            <tbody>
              {perJob.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-ink-3">No data for this period.</td></tr>
              ) : perJob.map((j) => (
                <tr key={j.id}>
                  <td><Link href={`/employer/jobs/${j.id}`} className="font-medium hover:underline">{j.title}</Link></td>
                  <td className="text-right tabular-nums">{j.views}</td>
                  <td className="text-right tabular-nums">{j.applied}</td>
                  <td className="text-right tabular-nums">{j.shortlisted}</td>
                  <td className="text-right tabular-nums">{j.hired}</td>
                  <td className="text-right text-ink-3 tabular-nums">{j.views ? `${Math.round((j.applied / j.views) * 100)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
