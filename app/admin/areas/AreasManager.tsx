'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { EmptyState, PageHeader, Spinner } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { TALUKS } from '@/lib/constants'
import { formatDate } from '@/lib/format'

type Suggestion = { id: string; taluk: string; area_name: string; pincode: string; status: string; created_at: string }
type AreaRow = { id: string; name: string; taluk: string; pincode: string | null; active: boolean; verified: boolean; source_name: string | null }

export function AreasManager({ suggestions, areas }: { suggestions: Suggestion[]; areas: AreaRow[] }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', taluk: 'Kolar', pincode: '', source: 'India Post' })
  const [filter, setFilter] = useState('')

  const run = async (id: string, fn: () => PromiseLike<{ error: { message: string } | null }>, msg: string) => {
    setBusy(id)
    const { error } = await fn()
    setBusy(null)
    if (error) return toast(error.message, 'error')
    toast(msg)
    router.refresh()
  }
  const sb = getSupabase()

  const approve = (s: Suggestion) =>
    run(s.id, async () => {
      const r = await sb.from('area_suggestions').update({ status: 'approved' }).eq('id', s.id)
      if (r.error) return r
      // The approval trigger inserts the area; mark it verified so employers can use it.
      return sb.from('areas').update({ verified: true, source_name: 'Admin-reviewed suggestion' }).eq('name', s.area_name)
    }, 'Area approved and available for jobs')

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.name.trim().length < 2) return toast('Enter the locality name', 'error')
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) return toast('PIN code must be 6 digits', 'error')
    void run('new', () => sb.from('areas').insert({ name: form.name.trim(), taluk: form.taluk, pincode: form.pincode || null, active: true, verified: true, source_name: form.source.trim() || null }), 'Locality added')
    setForm({ ...form, name: '', pincode: '' })
  }

  const pending = suggestions.filter((s) => s.status === 'pending')
  const shown = areas.filter((a) => !filter || a.taluk === filter)

  return (
    <>
      <PageHeader title="Areas" description="Jobs can only be posted in active, verified localities. Review public suggestions here." />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="card">
            <div className="border-b border-line px-5 py-4"><h2 className="font-semibold">Suggestions ({pending.length} pending)</h2></div>
            {suggestions.length === 0 ? <EmptyState title="No suggestions yet" /> : (
              <ul className="divide-y divide-line-2">
                {suggestions.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{s.area_name}</p>
                      <p className="text-[13px] text-ink-3">{s.taluk} · {s.pincode} · {formatDate(s.created_at)}</p>
                    </div>
                    <StatusPill tone={s.status === 'approved' ? 'green' : s.status === 'rejected' ? 'red' : 'amber'}>{s.status}</StatusPill>
                    {s.status === 'pending' && (
                      <>
                        <button onClick={() => approve(s)} disabled={busy === s.id} className="btn btn-navy btn-sm">{busy === s.id ? <Spinner size={14} /> : 'Approve'}</button>
                        <button onClick={() => run(s.id, () => sb.from('area_suggestions').update({ status: 'rejected' }).eq('id', s.id), 'Suggestion rejected')} className="btn btn-outline btn-sm">Reject</button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h2 className="font-semibold">Localities ({areas.length})</h2>
              <select className="input h-8 w-40 text-[13px]" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by taluk">
                <option value="">All taluks</option>
                {TALUKS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="max-h-[520px] overflow-auto">
              <table className="table-base">
                <thead><tr><th>Name</th><th>Taluk</th><th>PIN</th><th>Verified</th><th>Active</th></tr></thead>
                <tbody>
                  {shown.map((a) => (
                    <tr key={a.id}>
                      <td className="font-medium">{a.name}<p className="text-xs font-normal text-ink-4">{a.source_name}</p></td>
                      <td>{a.taluk}</td>
                      <td className="tabular-nums">{a.pincode ?? '—'}</td>
                      <td><input type="checkbox" aria-label="Verified" checked={a.verified} onChange={(e) => run(a.id, () => sb.from('areas').update({ verified: e.target.checked }).eq('id', a.id), 'Updated')} className="size-4 accent-[var(--color-navy-600)]" /></td>
                      <td><input type="checkbox" aria-label="Active" checked={a.active} onChange={(e) => run(a.id, () => sb.from('areas').update({ active: e.target.checked }).eq('id', a.id), 'Updated')} className="size-4 accent-[var(--color-navy-600)]" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <form onSubmit={add} className="card grid gap-4 self-start p-5">
          <p className="font-semibold">Add a locality</p>
          <div className="field"><label className="label" htmlFor="ar-n">Name</label><input id="ar-n" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label className="label" htmlFor="ar-t">Taluk</label><select id="ar-t" className="input" value={form.taluk} onChange={(e) => setForm({ ...form, taluk: e.target.value })}>{TALUKS.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div className="field"><label className="label" htmlFor="ar-p">PIN code</label><input id="ar-p" className="input" inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></div>
          <div className="field"><label className="label" htmlFor="ar-s">Source</label><input id="ar-s" className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></div>
          <button className="btn btn-navy" disabled={busy === 'new'}>{busy === 'new' ? <Spinner /> : 'Add locality'}</button>
        </form>
      </div>
    </>
  )
}
