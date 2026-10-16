'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Modal } from '@/components/ui/modal'
import { EmptyState, PageHeader, Spinner } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { ApplicantSearch } from '@/components/portal/ApplicantSearch'
import { CandidateFiles } from '@/components/portal/CandidateFiles'
import { APP_STATUS } from '@/lib/constants'
import { cn, formatDate, timeAgo } from '@/lib/format'
import type { AppStatus } from '@/lib/types'

type Row = { id: string; full_name: string; email: string | null; phone: string | null; current_title: string | null; taluk: string | null; experience_years: number | null; account_status: string; interest_status: string; resume_path: string | null; created_at: string; last_active_at: string; talent_visible: boolean }

const INTEREST = ['new', 'interested', 'contacted', 'shortlisted', 'hired', 'not_interested']

export function CandidatesTable({ rows, total, page, q, status }: { rows: Row[]; total: number; page: number; q: string; status: string }) {
  const [sel, setSel] = useState<Row | null>(null)
  const pages = Math.ceil(total / 50)
  const qs = (p: Record<string, string>) => {
    const u = new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), ...p })
    return `/admin/candidates${u.size ? `?${u}` : ''}`
  }
  return (
    <>
      <PageHeader title="Candidates" description={`${total.toLocaleString('en-IN')} registered job seekers. Profiles are private to the candidate and administrators.`} actions={<ApplicantSearch initial={q} placeholder="Name, email, phone or role" />} />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {[['', 'All'], ['active', 'Active'], ['suspended', 'Suspended'], ['blocked', 'Blocked']].map(([k, l]) => (
          <Link key={k} href={qs({ status: k })} className={cn('rounded-full border px-3 py-1 text-[13px] font-medium', status === k ? 'border-navy-600 bg-navy-50 text-navy-800' : 'border-line text-ink-2 hover:border-ink-4')}>{l}</Link>
        ))}
      </div>
      <section className="card overflow-hidden">
        {rows.length === 0 ? <EmptyState title="No candidates found" /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Candidate</th><th>Contact</th><th>Experience</th><th>Status</th><th>Joined</th><th>Last active</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r)} className="cursor-pointer hover:bg-canvas/60">
                    <td><p className="font-medium">{r.full_name || '—'}</p><p className="text-xs text-ink-3">{r.current_title ?? '—'}{r.taluk ? ` · ${r.taluk}` : ''}</p></td>
                    <td><p>{r.phone ?? '—'}</p><p className="text-xs text-ink-3">{r.email}</p></td>
                    <td className="tabular-nums">{r.experience_years ?? '—'}</td>
                    <td><StatusPill tone={r.account_status === 'active' ? 'green' : 'red'}>{r.account_status}</StatusPill> <span className="ml-1 text-xs text-ink-3">{r.interest_status.replace('_', ' ')}</span></td>
                    <td className="whitespace-nowrap text-ink-3">{formatDate(r.created_at)}</td>
                    <td className="whitespace-nowrap text-ink-3">{timeAgo(r.last_active_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && <Link href={qs({ page: String(page - 1) })} className="btn btn-outline btn-sm">Previous</Link>}
          <span className="text-sm text-ink-3">Page {page} of {pages}</span>
          {page < pages && <Link href={qs({ page: String(page + 1) })} className="btn btn-outline btn-sm">Next</Link>}
        </div>
      )}
      <CandidateModal row={sel} onClose={() => setSel(null)} />
    </>
  )
}

function CandidateModal({ row, onClose }: { row: Row | null; onClose: () => void }) {
  const router = useRouter()
  const toast = useToast()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const { data, refetch } = useQuery({
    queryKey: ['admin-candidate', row?.id],
    enabled: Boolean(row),
    queryFn: async () => {
      const sb = getSupabase()
      const [card, apps, notes, history] = await Promise.all([
        sb.rpc('candidate_card', { p_candidate: row!.id }),
        sb.from('applications').select('id,status,created_at,jobs(title,company_name)').eq('candidate_id', row!.id).order('created_at', { ascending: false }),
        sb.from('admin_profile_notes').select('id,note,created_at').eq('profile_id', row!.id).order('created_at', { ascending: false }),
        sb.from('admin_profile_history').select('id,field_name,old_value,new_value,created_at').eq('profile_id', row!.id).order('created_at', { ascending: false }).limit(20),
      ])
      return {
        card: card.data as { resume_path: string | null; documents: { id: string; kind: string; file_name: string; file_path: string; status: string }[]; bio: string | null; skills: string[] } | null,
        apps: (apps.data ?? []) as unknown as { id: string; status: AppStatus; created_at: string; jobs: { title: string; company_name: string } | null }[],
        notes: notes.data ?? [],
        history: history.data ?? [],
      }
    },
  })

  const update = async (patch: Record<string, string>, msg: string) => {
    if (!row) return
    setBusy(true)
    const { error } = await getSupabase().from('profiles').update(patch).eq('id', row.id)
    setBusy(false)
    if (error) return toast(error.message, 'error')
    toast(msg)
    router.refresh()
    void refetch()
  }

  const addNote = async () => {
    if (!row || !note.trim()) return
    const { data: me } = await getSupabase().auth.getUser()
    const { error } = await getSupabase().from('admin_profile_notes').insert({ profile_id: row.id, admin_id: me.user!.id, note: note.trim() })
    if (error) return toast(error.message, 'error')
    setNote('')
    void refetch()
  }

  return (
    <Modal open={Boolean(row)} onClose={onClose} size="lg" title={row?.full_name || 'Candidate'} description={`${row?.email ?? ''}${row?.phone ? ` · ${row.phone}` : ''}`}>
      {row && (
        <div className="grid gap-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="field">
              <label className="label" htmlFor="ac-st">Account</label>
              <select id="ac-st" className="input w-40" defaultValue={row.account_status} disabled={busy} onChange={(e) => confirm(`Change account to ${e.target.value}?`) ? update({ account_status: e.target.value }, 'Account status updated') : (e.target.value = row.account_status)}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="ac-in">Recruitment status</label>
              <select id="ac-in" className="input w-44" defaultValue={row.interest_status} disabled={busy} onChange={(e) => update({ interest_status: e.target.value }, 'Recruitment status updated')}>
                {INTEREST.map((i) => <option key={i} value={i}>{i.replace('_', ' ')}</option>)}
              </select>
            </div>
            {busy && <Spinner className="mb-3 text-ink-3" />}
          </div>
          {!data ? <div className="flex justify-center py-6"><Spinner className="text-ink-3" /></div> : (
            <>
              {data.card?.bio && <p className="text-sm whitespace-pre-line text-ink-2">{data.card.bio}</p>}
              <CandidateFiles resumePath={data.card?.resume_path ?? null} documents={data.card?.documents ?? []} />
              <div>
                <p className="text-sm font-semibold">Applications ({data.apps.length})</p>
                <ul className="mt-2 divide-y divide-line-2 rounded-lg border border-line text-sm">
                  {data.apps.length === 0 && <li className="p-3 text-ink-3">None</li>}
                  {data.apps.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 p-3">
                      <span className="truncate">{a.jobs?.title} · <span className="text-ink-3">{a.jobs?.company_name}</span></span>
                      <StatusPill tone={APP_STATUS[a.status].tone}>{APP_STATUS[a.status].label}</StatusPill>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold">Private admin notes</p>
                <div className="mt-2 flex gap-2">
                  <input className="input" value={note} maxLength={4000} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" />
                  <button onClick={addNote} className="btn btn-outline shrink-0" disabled={!note.trim()}>Add</button>
                </div>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {data.notes.map((n) => <li key={n.id} className="rounded-md bg-canvas p-2.5">{n.note} <span className="text-xs text-ink-4">· {timeAgo(n.created_at)}</span></li>)}
                </ul>
              </div>
              {data.history.length > 0 && (
                <div>
                  <p className="text-sm font-semibold">Status history</p>
                  <ul className="mt-2 space-y-1 text-xs text-ink-3">
                    {data.history.map((h) => <li key={h.id}>{formatDate(h.created_at, true)} · {h.field_name.replace('_', ' ')}: {h.old_value} → {h.new_value}</li>)}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
