'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BadgeCheck, ExternalLink } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Modal } from '@/components/ui/modal'
import { Avatar, EmptyState, PageHeader, Spinner } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { ApplicantSearch } from '@/components/portal/ApplicantSearch'
import { logoUrl } from '@/lib/storage'
import { cn, formatDate } from '@/lib/format'

type Row = {
  id: string; name: string; slug: string; logo_path: string | null; industry: string | null; company_size: string | null; website: string | null; about: string | null; address: string | null; taluk: string | null
  verified: boolean; created_at: string
  profiles: { email: string | null; full_name: string; phone: string | null; account_status: string; created_at: string } | null
  wallet: { plan_id: string; job_credits: number; unlock_credits: number; expires_at: string | null } | null
  priv: { gstin: string | null; contact_name: string | null; contact_phone: string | null; contact_email: string | null } | null
  jobs: { live: number; total: number }
}

export function EmployersTable({ rows, filter, q, focus }: { rows: Row[]; filter: string; q: string; focus: string | null }) {
  const router = useRouter()
  const toast = useToast()
  const [sel, setSel] = useState<Row | null>(rows.find((r) => r.id === focus) ?? null)
  const [busy, setBusy] = useState(false)
  const [grant, setGrant] = useState({ jobs: '0', unlocks: '0', days: '', reason: '' })

  const act = async (fn: () => PromiseLike<{ error: { message: string } | null }>, msg: string) => {
    setBusy(true)
    const { error } = await fn()
    setBusy(false)
    if (error) return toast(error.message, 'error')
    toast(msg)
    setSel(null)
    router.refresh()
  }

  const sb = getSupabase()

  return (
    <>
      <PageHeader title="Employers" description="Verify companies, manage access and adjust credits." actions={<ApplicantSearch initial={q} placeholder="Search company name" kind="company" />} />
      <div className="mb-4 flex gap-1.5">
        {[['all', 'All'], ['unverified', 'Not verified'], ['verified', 'Verified']].map(([k, l]) => (
          <Link key={k} href={`/admin/employers${k === 'all' ? '' : `?filter=${k}`}`} className={cn('rounded-full border px-3 py-1 text-[13px] font-medium', filter === k ? 'border-navy-600 bg-navy-50 text-navy-800' : 'border-line text-ink-2 hover:border-ink-4')}>{l}</Link>
        ))}
      </div>
      <section className="card overflow-hidden">
        {rows.length === 0 ? <EmptyState title="No employers found" /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Company</th><th>Contact</th><th>Jobs</th><th>Credits</th><th>Status</th><th>Joined</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r)} className="cursor-pointer hover:bg-canvas/60">
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={r.name} src={logoUrl(r.logo_path)} size={32} square />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1 font-medium">{r.name}{r.verified && <BadgeCheck size={14} className="text-navy-500" />}</p>
                          <p className="text-xs text-ink-3">{r.industry ?? '—'}{r.taluk ? ` · ${r.taluk}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td><p>{r.profiles?.full_name}</p><p className="text-xs text-ink-3">{r.profiles?.email}</p></td>
                    <td className="tabular-nums">{r.jobs.live} live / {r.jobs.total}</td>
                    <td className="text-xs tabular-nums">{r.wallet ? `${r.wallet.job_credits} jobs · ${r.wallet.unlock_credits} unlocks` : '—'}<p className="capitalize text-ink-3">{r.wallet?.plan_id}</p></td>
                    <td>
                      {r.profiles?.account_status !== 'active' ? <StatusPill tone="red">{r.profiles?.account_status}</StatusPill> : r.verified ? <StatusPill tone="green">Verified</StatusPill> : <StatusPill tone="amber">Unverified</StatusPill>}
                    </td>
                    <td className="whitespace-nowrap text-ink-3">{formatDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={Boolean(sel)} onClose={() => setSel(null)} size="lg" title={sel?.name ?? ''} description={sel?.industry ?? undefined}>
        {sel && (
          <div className="grid gap-5">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-ink-3">Account</dt><dd className="font-medium">{sel.profiles?.full_name} · {sel.profiles?.email}</dd></div>
              <div><dt className="text-xs text-ink-3">Phone</dt><dd className="font-medium">{sel.profiles?.phone ?? sel.priv?.contact_phone ?? '—'}</dd></div>
              <div><dt className="text-xs text-ink-3">GSTIN</dt><dd className="font-medium">{sel.priv?.gstin ?? '—'}</dd></div>
              <div><dt className="text-xs text-ink-3">Website</dt><dd className="font-medium">{sel.website ? <a href={sel.website} target="_blank" rel="noopener noreferrer" className="link">{sel.website}</a> : '—'}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-ink-3">Address</dt><dd className="font-medium">{sel.address ?? '—'}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-ink-3">About</dt><dd className="whitespace-pre-line text-ink-2">{sel.about ?? '—'}</dd></div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} onClick={() => act(() => sb.from('companies').update({ verified: !sel.verified }).eq('id', sel.id), sel.verified ? 'Verification removed' : 'Company verified')} className={cn('btn', sel.verified ? 'btn-outline' : 'btn-navy')}>
                {busy ? <Spinner /> : sel.verified ? 'Remove verification' : 'Verify company'}
              </button>
              {sel.profiles?.account_status === 'active' ? (
                <>
                  <button disabled={busy} onClick={() => confirm('Suspend this employer? They cannot post or message until restored.') && act(() => sb.from('profiles').update({ account_status: 'suspended' }).eq('id', sel.id), 'Employer suspended')} className="btn btn-outline">Suspend</button>
                  <button disabled={busy} onClick={() => confirm('Block this employer permanently? Their live jobs will be closed.') && act(async () => {
                    await sb.from('jobs').update({ status: 'closed' }).eq('employer_id', sel.id).eq('status', 'published')
                    return sb.from('profiles').update({ account_status: 'blocked' }).eq('id', sel.id)
                  }, 'Employer blocked and live jobs closed')} className="btn btn-danger">Block</button>
                </>
              ) : (
                <button disabled={busy} onClick={() => act(() => sb.from('profiles').update({ account_status: 'active' }).eq('id', sel.id), 'Account restored')} className="btn btn-outline">Restore account</button>
              )}
              <Link href={`/companies/${sel.slug}`} target="_blank" className="btn btn-ghost"><ExternalLink size={14} /> Public page</Link>
              <Link href={`/admin/jobs?tab=all&q=${encodeURIComponent(sel.name)}`} className="btn btn-ghost">Jobs</Link>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!grant.reason.trim()) return toast('Enter a reason', 'error')
                void act(() => sb.rpc('admin_grant_credits', { p_employer: sel.id, p_jobs: Number(grant.jobs) || 0, p_unlocks: Number(grant.unlocks) || 0, p_reason: grant.reason.trim(), p_validity_days: grant.days ? Number(grant.days) : null }), 'Credits updated')
                setGrant({ jobs: '0', unlocks: '0', days: '', reason: '' })
              }}
              className="rounded-lg border border-line p-4"
            >
              <p className="text-sm font-semibold">Adjust credits</p>
              <p className="text-xs text-ink-3">Current: {sel.wallet?.job_credits ?? 0} job posts, {sel.wallet?.unlock_credits ?? 0} unlocks{sel.wallet?.expires_at ? `, expires ${formatDate(sel.wallet.expires_at)}` : ''}. Use negative numbers to remove.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <div className="field"><label className="label" htmlFor="g-j">Job posts</label><input id="g-j" type="number" className="input" value={grant.jobs} onChange={(e) => setGrant({ ...grant, jobs: e.target.value })} /></div>
                <div className="field"><label className="label" htmlFor="g-u">Unlocks</label><input id="g-u" type="number" className="input" value={grant.unlocks} onChange={(e) => setGrant({ ...grant, unlocks: e.target.value })} /></div>
                <div className="field"><label className="label" htmlFor="g-d">Extend days</label><input id="g-d" type="number" min={0} className="input" placeholder="—" value={grant.days} onChange={(e) => setGrant({ ...grant, days: e.target.value })} /></div>
                <div className="field"><label className="label" htmlFor="g-r">Reason</label><input id="g-r" className="input" placeholder="Offline payment #123" value={grant.reason} onChange={(e) => setGrant({ ...grant, reason: e.target.value })} /></div>
              </div>
              <button className="btn btn-outline btn-sm mt-3" disabled={busy}>Apply adjustment</button>
            </form>
          </div>
        )}
      </Modal>
    </>
  )
}
