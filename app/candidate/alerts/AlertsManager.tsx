'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BellRing, Trash2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { EmptyState, PageHeader, Spinner } from '@/components/ui/bits'
import { TALUKS } from '@/lib/constants'

type Sub = { id: string; taluk: string | null; category: string | null; area_id: string | null; email_enabled: boolean; in_app_enabled: boolean; active: boolean }
type Area = { id: string; name: string; taluk: string }

export function AlertsManager({ email, subs, categories, areas }: { email: string; subs: Sub[]; categories: string[]; areas: Area[] }) {
  const router = useRouter()
  const toast = useToast()
  const [taluk, setTaluk] = useState('')
  const [area, setArea] = useState('')
  const [category, setCategory] = useState('')
  const [busy, setBusy] = useState(false)

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await getSupabase().rpc('subscribe_to_job_alerts', { p_email: email, p_taluk: taluk || null, p_area_id: area || null, p_category: category || null })
    setBusy(false)
    if (error) return toast(error.message, 'error')
    toast('Alert created')
    setArea('')
    router.refresh()
  }

  const update = async (id: string, patch: Partial<Sub>) => {
    const { error } = await getSupabase().from('job_alert_subscriptions').update(patch).eq('id', id)
    if (error) return toast(error.message, 'error')
    router.refresh()
  }

  const remove = async (id: string) => {
    const { error } = await getSupabase().from('job_alert_subscriptions').delete().eq('id', id)
    if (error) return toast(error.message, 'error')
    toast('Alert deleted')
    router.refresh()
  }

  const areaName = (id: string | null) => areas.find((a) => a.id === id)?.name

  return (
    <>
      <PageHeader title="Job alerts" description={`New jobs that match are sent to ${email} and to your notifications.`} />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="card">
          {subs.length === 0 ? (
            <EmptyState icon={<BellRing size={20} />} title="No alerts yet" body="Create an alert and be the first to apply when a matching job goes live." />
          ) : (
            <ul className="divide-y divide-line-2">
              {subs.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{s.category ?? 'All categories'}</p>
                    <p className="text-sm text-ink-3">{areaName(s.area_id) ?? s.taluk ?? 'Anywhere in Kolar district'}</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={s.email_enabled} onChange={(e) => update(s.id, { email_enabled: e.target.checked })} className="size-4 accent-[var(--color-navy-600)]" /> Email
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={s.in_app_enabled} onChange={(e) => update(s.id, { in_app_enabled: e.target.checked })} className="size-4 accent-[var(--color-navy-600)]" /> In-app
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={s.active} onChange={(e) => update(s.id, { active: e.target.checked })} className="size-4 accent-[var(--color-navy-600)]" /> Active
                  </label>
                  <button onClick={() => remove(s.id)} className="rounded-md p-2 text-ink-3 hover:bg-canvas hover:text-brand-700" aria-label="Delete alert">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <form onSubmit={create} className="card grid gap-4 self-start p-5">
          <p className="font-semibold">New alert</p>
          <div className="field">
            <label className="label" htmlFor="a-cat">Category</label>
            <select id="a-cat" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="a-taluk">Taluk</label>
            <select id="a-taluk" className="input" value={taluk} onChange={(e) => { setTaluk(e.target.value); setArea('') }}>
              <option value="">All taluks</option>
              {TALUKS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          {taluk && (
            <div className="field">
              <label className="label" htmlFor="a-area">Locality</label>
              <select id="a-area" className="input" value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">Whole taluk</option>
                {areas.filter((a) => a.taluk === taluk).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}
          <button className="btn btn-navy" disabled={busy}>{busy ? <Spinner /> : 'Create alert'}</button>
        </form>
      </div>
    </>
  )
}
