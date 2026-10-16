'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers'
import { Spinner } from '@/components/ui/bits'

const TOPICS = { general: 'General question', candidate: 'Help with my job search', employer: 'Hiring / employer account', billing: 'Billing and invoices', report: 'Report a job or employer', verification: 'Document verification' } as const

export function ContactForm() {
  const params = useSearchParams()
  const { profile, user } = useAuth()
  const initialTopic = (params.get('topic') as keyof typeof TOPICS) ?? 'general'
  const job = params.get('job')
  const [f, setF] = useState({ name: '', email: '', phone: '', topic: TOPICS[initialTopic] ? initialTopic : 'general', message: job ? `Reporting job: /jobs/${job}\n\n` : '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const name = f.name || profile?.full_name || ''
  const email = f.email || user?.email || ''

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (name.trim().length < 2) return setError('Enter your name')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Enter a valid email')
    if (f.message.trim().length < 10) return setError('Write a little more so we can help (at least 10 characters)')
    setBusy(true)
    const { error } = await getSupabase().from('contact_messages').insert({ name: name.trim(), email: email.trim().toLowerCase(), phone: f.phone.trim() || null, topic: f.topic, message: f.message.trim() })
    setBusy(false)
    if (error) return setError(error.message)
    setDone(true)
  }

  if (done)
    return (
      <div className="card flex gap-3 p-6">
        <CheckCircle2 className="shrink-0 text-emerald-600" />
        <div><p className="font-semibold">Message sent</p><p className="mt-1 text-sm text-ink-3">Thanks — we’ll reply to {email} within one working day.</p></div>
      </div>
    )

  return (
    <form onSubmit={submit} className="card grid gap-4 p-5 sm:p-6" noValidate>
      {error && <p role="alert" className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field"><label className="label" htmlFor="c-name">Name</label><input id="c-name" className="input" value={name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></div>
        <div className="field"><label className="label" htmlFor="c-email">Email</label><input id="c-email" type="email" className="input" value={email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></div>
        <div className="field"><label className="label" htmlFor="c-phone">Mobile <span className="font-normal text-ink-4">(optional)</span></label><input id="c-phone" className="input" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div className="field">
          <label className="label" htmlFor="c-topic">Topic</label>
          <select id="c-topic" className="input" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value as keyof typeof TOPICS })}>
            {Object.entries(TOPICS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div className="field"><label className="label" htmlFor="c-msg">Message</label><textarea id="c-msg" className="input" rows={6} maxLength={3000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></div>
      <button className="btn btn-navy justify-self-start" disabled={busy}>{busy ? <Spinner /> : 'Send message'}</button>
    </form>
  )
}
