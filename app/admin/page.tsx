import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { requireRole } from '@/lib/session'
import { PageHeader, Stat } from '@/components/ui/bits'
import { formatINR, timeAgo } from '@/lib/format'

export const metadata = { title: 'Overview' }

type Overview = {
  candidates: number; employers: number; live_jobs: number; pending_jobs: number; applications: number; applications_7d: number; hires: number
  pending_documents: number; unverified_companies: number; pending_areas: number; open_messages: number; revenue_inr: number
  signups_14d: { day: string; candidates: number; employers: number }[]
}

export default async function AdminHome() {
  const { sb } = await requireRole('admin')
  const [{ data }, { data: queue }, { data: actions }] = await Promise.all([
    sb.rpc('admin_overview'),
    sb.from('jobs').select('id,title,company_name,submitted_at').eq('status', 'pending_review').order('submitted_at', { ascending: true }).limit(6),
    sb.from('admin_actions').select('id,target_type,action,reason,created_at').order('created_at', { ascending: false }).limit(8),
  ])
  const o = (data ?? {}) as Overview
  const days = o.signups_14d ?? []
  const peak = Math.max(1, ...days.map((d) => d.candidates + d.employers))

  const todo = [
    [o.pending_jobs, 'jobs waiting for review', '/admin/jobs'],
    [o.pending_documents, 'documents to verify', '/admin/documents'],
    [o.unverified_companies, 'companies not verified', '/admin/employers?filter=unverified'],
    [o.pending_areas, 'area suggestions', '/admin/areas'],
    [o.open_messages, 'open contact messages', '/admin/inbox'],
  ].filter(([n]) => Number(n) > 0) as [number, string, string][]

  return (
    <>
      <PageHeader title="Overview" description="Platform health and the moderation queue." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Candidates" value={o.candidates ?? 0} href="/admin/candidates" />
        <Stat label="Employers" value={o.employers ?? 0} href="/admin/employers" />
        <Stat label="Live jobs" value={o.live_jobs ?? 0} sub={`${o.pending_jobs ?? 0} pending review`} href="/admin/jobs" />
        <Stat label="Applications" value={o.applications ?? 0} sub={`${o.applications_7d ?? 0} this week · ${o.hires ?? 0} hires`} href="/admin/applications" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Sign-ups, last 14 days</h2>
              <p className="flex gap-3 text-xs text-ink-3">
                <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-navy-600" /> Candidates</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-brand-500" /> Employers</span>
              </p>
            </div>
            <div className="mt-5 flex h-36 items-end gap-1.5" role="img" aria-label="Daily sign-ups chart">
              {days.map((d) => (
                <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.day}: ${d.candidates} candidates, ${d.employers} employers`}>
                  <div className="rounded-t-sm bg-brand-500" style={{ height: `${(d.employers / peak) * 100}%` }} />
                  <div className="bg-navy-600" style={{ height: `${(d.candidates / peak) * 100}%`, borderTopLeftRadius: d.employers ? 0 : 2, borderTopRightRadius: d.employers ? 0 : 2 }} />
                  {d.candidates + d.employers === 0 && <div className="h-px bg-line" />}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-ink-4">
              <span>{days[0]?.day}</span>
              <span>{days.at(-1)?.day}</span>
            </div>
          </section>

          <section className="card">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold">Oldest jobs in review</h2>
              <Link href="/admin/jobs" className="text-[13px] link">Open queue</Link>
            </div>
            {(queue ?? []).length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-3">The review queue is empty.</p>
            ) : (
              <ul className="divide-y divide-line-2">
                {queue!.map((j) => (
                  <li key={j.id}>
                    <Link href={`/admin/jobs?focus=${j.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-canvas">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{j.title}</p>
                        <p className="truncate text-sm text-ink-3">{j.company_name} · waiting {j.submitted_at ? timeAgo(j.submitted_at).replace(' ago', '') : '—'}</p>
                      </div>
                      <ArrowRight size={16} className="text-ink-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold">To do</h2>
            {todo.length === 0 ? (
              <p className="mt-2 text-sm text-ink-3">Nothing waiting. Nice.</p>
            ) : (
              <ul className="mt-3 space-y-1">
                {todo.map(([n, l, h]) => (
                  <li key={h}>
                    <Link href={h} className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-canvas">
                      <span className="min-w-7 rounded bg-brand-50 px-1.5 text-center font-semibold text-brand-700 tabular-nums">{n}</span>
                      <span className="flex-1">{l}</span>
                      <ArrowRight size={14} className="text-ink-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="card p-5">
            <p className="text-[13px] text-ink-3">Revenue (paid orders, incl. GST)</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{formatINR(o.revenue_inr ?? 0)}</p>
            <Link href="/admin/payments" className="mt-2 inline-block text-[13px] link">Payments & credits</Link>
          </section>
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Recent moderation</h2>
              <Link href="/admin/audit" className="text-[13px] link">Audit log</Link>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {(actions ?? []).length === 0 && <li className="text-ink-3">No actions yet.</li>}
              {(actions ?? []).map((a) => (
                <li key={a.id} className="flex justify-between gap-2">
                  <span className="truncate"><span className="capitalize">{a.target_type}</span> · {a.action.replace('_', ' ')}</span>
                  <span className="shrink-0 text-xs text-ink-4">{timeAgo(a.created_at)}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  )
}
