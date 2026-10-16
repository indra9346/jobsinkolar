'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers'
import { Spinner } from '@/components/ui/bits'
import { TALUKS } from '@/lib/constants'
import type { Area } from '@/lib/types'

export function JobAlertForm({ categories, areas }: { categories: string[]; areas: Area[] }) {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [taluk, setTaluk] = useState('')
  const [area, setArea] = useState('')
  const [category, setCategory] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const value = email || user?.email || ''

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return setError('Enter a valid email address')
    setBusy(true)
    const { error } = await getSupabase().rpc('subscribe_to_job_alerts', { p_email: value.trim(), p_taluk: taluk || null, p_area_id: area || null, p_category: category || null })
    setBusy(false)
    if (error) return setError(error.message)
    setDone(true)
  }

  if (done)
    return (
      <div className="card mt-8 flex gap-3 p-6">
        <CheckCircle2 className="shrink-0 text-emerald-600" />
        <div>
          <p className="font-semibold">Alert created</p>
          <p className="mt-1 text-sm text-ink-3">We’ll email {value} when a matching job goes live.</p>
          <button onClick={() => { setDone(false); setCategory(''); setArea('') }} className="mt-3 text-sm link">Create another alert</button>
        </div>
      </div>
    )

  return (
    <form onSubmit={submit} className="card mt-8 grid gap-4 p-5 sm:p-6" noValidate>
      {error && <p role="alert" className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-700">{error}</p>}
      <div className="field"><label className="label" htmlFor="ja-e">Email</label><input id="ja-e" type="email" className="input" value={value} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
      <div className="field">
        <label className="label" htmlFor="ja-c">Category</label>
        <select id="ja-c" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label className="label" htmlFor="ja-t">Taluk</label>
          <select id="ja-t" className="input" value={taluk} onChange={(e) => { setTaluk(e.target.value); setArea('') }}>
            <option value="">All taluks</option>
            {TALUKS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="ja-a">Locality</label>
          <select id="ja-a" className="input" value={area} disabled={!taluk} onChange={(e) => setArea(e.target.value)}>
            <option value="">Whole taluk</option>
            {areas.filter((a) => a.taluk === taluk).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>
      <button className="btn btn-navy" disabled={busy}>{busy ? <Spinner /> : 'Create alert'}</button>
      <p className="text-xs text-ink-3">By subscribing you agree to receive job alert emails. We never share your email.</p>
    </form>
  )
}
