'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Area = { id: string; name: string; taluk: string; pincode: string | null }

export default function AdminNewJobPage() {
  const [adminId, setAdminId] = useState('')
  const [allowed, setAllowed] = useState(false)
  const [ready, setReady] = useState(false)
  const [taluks, setTaluks] = useState<string[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [taluk, setTaluk] = useState('')
  const [areaId, setAreaId] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)
  const areasForTaluk = useMemo(() => areas.filter((area) => area.taluk === taluk), [areas, taluk])

  useEffect(() => {
    let alive = true
    async function init() {
      if (!supabase) { setReady(true); return }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setReady(true); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin,company_name').eq('id', user.id).maybeSingle()
      if (!alive) return
      if (!profile?.is_admin) { setReady(true); return }
      setAdminId(user.id); setAllowed(true)
      const [tr, ar, cr] = await Promise.all([
        supabase.from('taluks').select('name').eq('active', true).order('name'),
        supabase.from('areas').select('id,name,taluk,pincode').eq('active', true).eq('verified', true).order('taluk').order('name'),
        supabase.from('job_categories').select('name').eq('active', true).order('sort_order'),
      ])
      if (!alive) return
      setTaluks((tr.data || []).map((item) => item.name))
      setAreas((ar.data || []) as Area[])
      setCategories((cr.data || []).map((item) => item.name))
      setTaluk(tr.data?.[0]?.name || '')
      setReady(true)
    }
    void init()
    return () => { alive = false }
  }, [])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase || !adminId) return
    const formElement = e.currentTarget
    const form = new FormData(formElement)
    setBusy(true); setMessage(''); setSuccess(false)
    const { error } = await supabase.from('jobs').insert({
      employer_id: adminId,
      title: String(form.get('title')).trim(),
      company_name: String(form.get('company_name')).trim(),
      category: String(form.get('category')),
      employment_type: String(form.get('employment_type')),
      experience_level: String(form.get('experience_level') || '').trim() || null,
      taluk,
      area_id: areaId,
      salary_min: form.get('salary_min') ? Number(form.get('salary_min')) : null,
      salary_max: form.get('salary_max') ? Number(form.get('salary_max')) : null,
      description: String(form.get('description')).trim(),
      requirements: String(form.get('requirements') || '').split('\n').map((line) => line.trim()).filter(Boolean),
      status: 'published',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    setBusy(false)
    if (error) { setMessage(`Job could not be published: ${error.message}`); return }
    setSuccess(true)
    setMessage('Job published. Matching subscribers have been queued for email and in-app alerts.')
    formElement.reset(); setTaluk(taluks[0] || ''); setAreaId('')
  }

  if (!ready) return <main className="page-shell"><div className="page-container">Checking administrator access…</div></main>
  if (!allowed) return <main className="page-shell"><div className="page-container"><div className="panel" style={{ textAlign: 'center', padding: 40 }}><ShieldCheck color="var(--primary)" size={30} /><h1>Administrator access required</h1><p>Only authorized administrators can publish jobs directly.</p><Link href="/auth?mode=signin" className="button button-primary">Sign in</Link></div></div></main>

  return <main className="page-shell"><div className="page-container" style={{ maxWidth: 900 }}>
    <Link href="/admin" className="button button-secondary button-sm" style={{ marginBottom: 20 }}><ArrowLeft size={15} /> Admin home</Link>
    <div style={{ marginBottom: 24 }}><span className="eyebrow eyebrow-navy"><BriefcaseBusiness size={13} /> ADMIN JOB PUBLISHING</span><h1 className="page-title">Post a verified Kolar job</h1><p className="page-intro">Choose an official district taluk and verified postal locality. Publishing immediately starts matching opted-in job alerts.</p></div>
    <section className="panel" style={{ padding: 30 }}>
      {message && <div className={`form-message ${success ? 'success' : 'error'}`} role="status"><CheckCircle2 size={16} /> {message}</div>}
      <form onSubmit={submit}>
        <div className="grid-two"><label className="field">Job title *<input name="title" required maxLength={160} placeholder="e.g. CNC operator" /></label><label className="field">Company / organization *<input name="company_name" required maxLength={160} placeholder="Employer name" /></label></div>
        <div className="grid-two"><label className="field">Category *<select name="category" required defaultValue=""><option value="" disabled>Select a category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="field">Employment type *<select name="employment_type" defaultValue="Full-time">{['Full-time','Part-time','Contract','Temporary','Internship'].map((type) => <option key={type}>{type}</option>)}</select></label></div>
        <div className="grid-two"><label className="field">Kolar district taluk *<select required value={taluk} onChange={(e) => { setTaluk(e.target.value); setAreaId('') }}><option value="" disabled>Select taluk</option>{taluks.map((name) => <option key={name}>{name}</option>)}</select></label><label className="field">Verified locality *<select required value={areaId} onChange={(e) => setAreaId(e.target.value)}><option value="" disabled>Select locality</option>{areasForTaluk.map((area) => <option key={area.id} value={area.id}>{area.name}{area.pincode ? ` · ${area.pincode}` : ''}</option>)}</select></label></div>
        <div className="grid-two"><label className="field">Experience level<input name="experience_level" maxLength={80} placeholder="e.g. Fresher, 2–4 years" /></label><label className="field">Monthly salary range (₹)<div style={{ display: 'flex', gap: 10 }}><input name="salary_min" type="number" min="0" step="1" placeholder="Minimum" /><input name="salary_max" type="number" min="0" step="1" placeholder="Maximum" /></div></label></div>
        <label className="field">Job description *<textarea name="description" required minLength={30} maxLength={10000} rows={6} placeholder="Responsibilities, shift details and role information" /></label>
        <label className="field">Requirements (one per line)<textarea name="requirements" rows={4} maxLength={3000} placeholder={'ITI / Diploma\nKannada communication\nRelevant experience'} /></label>
        {areas.length === 0 && <div className="form-message error">Verified areas are not available yet. Run the latest Supabase migration first.</div>}
        <button className="button button-primary button-lg" disabled={busy || !areasForTaluk.length || !categories.length}>{busy ? 'Publishing…' : 'Publish job and queue alerts'}</button>
      </form>
    </section>
  </div></main>
}
