'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BellRing, CheckCircle2, MapPin, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Area = { id: string; name: string; taluk: string; pincode: string | null }

export default function JobAlertsPage() {
  const [email, setEmail] = useState('')
  const [taluks, setTaluks] = useState<string[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [taluk, setTaluk] = useState('')
  const [areaId, setAreaId] = useState('')
  const [category, setCategory] = useState('')
  const [consent, setConsent] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)
  const areasForTaluk = useMemo(() => areas.filter((area) => area.taluk === taluk), [areas, taluk])

  useEffect(() => {
    if (!supabase) return
    let alive = true
    async function load() {
      const [tr, ar, cr, auth] = await Promise.all([
        supabase!.from('taluks').select('name').eq('active', true).order('name'),
        supabase!.from('areas').select('id,name,taluk,pincode').eq('active', true).eq('verified', true).order('taluk').order('name'),
        supabase!.from('job_categories').select('name').eq('active', true).order('sort_order'),
        supabase!.auth.getUser(),
      ])
      if (!alive) return
      setTaluks((tr.data || []).map((item) => item.name))
      setAreas((ar.data || []) as Area[])
      setCategories((cr.data || []).map((item) => item.name))
      setTaluk(tr.data?.[0]?.name || '')
      if (auth.data.user) {
        const { data: profile } = await supabase!.from('profiles').select('email').eq('id', auth.data.user.id).maybeSingle()
        if (alive) setEmail(profile?.email || auth.data.user.email || '')
      }
    }
    void load()
    return () => { alive = false }
  }, [])

  async function subscribe(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(''); setSuccess(false); setBusy(true)
    if (!supabase) { setMessage('Supabase is not configured.'); setBusy(false); return }
    const { error } = await supabase.rpc('subscribe_to_job_alerts', {
      p_email: email.trim().toLowerCase(), p_taluk: taluk || null, p_area_id: areaId || null, p_category: category || null,
    })
    setBusy(false)
    if (error) { setMessage(error.message); return }
    setSuccess(true)
    setMessage('You’re subscribed. New matching Kolar jobs will be queued for email alerts. Signed-in users with a matching account also receive live in-app notifications.')
    setConsent(false)
  }

  return <main className="page-shell"><div className="page-container" style={{ maxWidth: 980 }}>
    <div className="panel" style={{ padding: 'clamp(24px,5vw,54px)', display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(250px,.9fr)', gap: 38, alignItems: 'center' }}>
      <div><span className="eyebrow"><BellRing size={13} /> KOLAR JOB ALERTS</span><h1 className="page-title" style={{ fontSize: 'clamp(32px,5vw,48px)' }}>The right local role, sent when it’s posted.</h1><p className="page-intro">Choose a taluk, verified locality and job category. New published jobs that match your preferences are queued automatically.</p><div style={{ display: 'grid', gap: 12, color: 'var(--text-secondary)', marginTop: 22 }}><span style={{ display: 'flex', gap: 9, alignItems: 'center' }}><MapPin size={17} color="var(--primary)" /> Kolar, Malur, Bangarpet, KGF, Mulbagal and Srinivaspur</span><span style={{ display: 'flex', gap: 9, alignItems: 'center' }}><Mail size={17} color="var(--primary)" /> Email alerts with a secure unsubscribe link</span></div></div>
      <form className="panel" style={{ boxShadow: 'none', background: 'var(--bg-soft)' }} onSubmit={subscribe}>
        {message && <div className={`form-message ${success ? 'success' : 'error'}`} role="status"><CheckCircle2 size={16} /> {message}</div>}
        <label className="field">Email address *<input type="email" required maxLength={254} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
        <label className="field">Taluk<select value={taluk} onChange={(e) => { setTaluk(e.target.value); setAreaId('') }}><option value="">All Kolar taluks</option>{taluks.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label className="field">Locality<select value={areaId} onChange={(e) => setAreaId(e.target.value)} disabled={!taluk}><option value="">Any verified locality</option>{areasForTaluk.map((area) => <option key={area.id} value={area.id}>{area.name}{area.pincode ? ` · ${area.pincode}` : ''}</option>)}</select></label>
        <label className="field">Job category<select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{categories.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '8px 0 16px' }}><input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />I agree to receive job alert emails for these preferences. I can unsubscribe at any time.</label>
        <button className="button button-primary button-lg" style={{ width: '100%' }} disabled={busy}>{busy ? 'Saving preferences…' : 'Subscribe to job alerts'}</button>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 0 }}>You can change your preferences by unsubscribing and subscribing again. <Link href="/jobs">Browse current jobs</Link>.</p>
      </form>
    </div>
  </div></main>
}
