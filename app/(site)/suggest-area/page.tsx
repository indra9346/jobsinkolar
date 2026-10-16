'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers'
import { Spinner } from '@/components/ui/bits'
import { TALUKS } from '@/lib/constants'

export default function SuggestAreaPage() {
  const { user } = useAuth()
  const [f, setF] = useState({ taluk: '', area_name: '', pincode: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!f.taluk) return setError('Choose the taluk')
    if (f.area_name.trim().length < 2) return setError('Enter the locality name')
    if (!/^56\d{4}$/.test(f.pincode)) return setError('Enter the 6-digit PIN code (Kolar district PINs start with 56)')
    setBusy(true)
    const { error } = await getSupabase().from('area_suggestions').insert({ taluk: f.taluk, area_name: f.area_name.trim(), pincode: f.pincode, submitted_by: user?.id ?? null })
    setBusy(false)
    if (error) return setError(error.message)
    setDone(true)
  }

  return (
    <div className="container-x py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-semibold">Suggest a locality</h1>
        <p className="mt-2 text-ink-3">Can’t find your village, town or industrial area? Tell us and our team will verify and add it, usually within a day.</p>
        {done ? (
          <div className="card mt-8 flex gap-3 p-6">
            <CheckCircle2 className="shrink-0 text-emerald-600" />
            <div><p className="font-semibold">Thanks for the suggestion</p><p className="mt-1 text-sm text-ink-3">{f.area_name} will be available once verified.</p></div>
          </div>
        ) : (
          <form onSubmit={submit} className="card mt-8 grid gap-4 p-5 sm:p-6" noValidate>
            {error && <p role="alert" className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-700">{error}</p>}
            <div className="field">
              <label className="label" htmlFor="sa-t">Taluk</label>
              <select id="sa-t" className="input" value={f.taluk} onChange={(e) => setF({ ...f, taluk: e.target.value })}>
                <option value="">Select</option>
                {TALUKS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field"><label className="label" htmlFor="sa-n">Locality name</label><input id="sa-n" className="input" maxLength={80} value={f.area_name} onChange={(e) => setF({ ...f, area_name: e.target.value })} /></div>
            <div className="field"><label className="label" htmlFor="sa-p">PIN code</label><input id="sa-p" className="input" inputMode="numeric" maxLength={6} value={f.pincode} onChange={(e) => setF({ ...f, pincode: e.target.value.replace(/\D/g, '') })} /></div>
            <button className="btn btn-navy" disabled={busy}>{busy ? <Spinner /> : 'Send suggestion'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
