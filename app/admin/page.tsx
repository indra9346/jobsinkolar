'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AlertCircle, Briefcase, CheckCircle2, ExternalLink, MapPin, ShieldCheck, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [allowed, setAllowed] = useState(false)
  const [ready, setReady] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [verifiedAreas, setVerifiedAreas] = useState<any[]>([])
  const [jobAreas, setJobAreas] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    let alive = true
    async function load() {
      if (!supabase) { setReady(true); return }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { if (alive) setReady(true); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
      if (!alive) return
      if (!profile?.is_admin) { setReady(true); return }
      setAllowed(true)
      const [jr, ar, vr] = await Promise.all([
        supabase.from('jobs').select('*').eq('status', 'pending_review').order('created_at', { ascending: false }),
        supabase.from('area_suggestions').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('areas').select('id,name,taluk,pincode').eq('active', true).eq('verified', true).order('taluk').order('name'),
      ])
      if (jr.error || ar.error) setMessage(jr.error?.message || ar.error?.message || 'Could not load the moderation queues.')
      setJobs(jr.data || [])
      setAreas(ar.data || [])
      setVerifiedAreas(vr.data || [])
      setReady(true)
    }
    load()
    return () => { alive = false }
  }, [])

  async function moderateJob(id: string, status: 'published' | 'rejected') {
    if (!supabase) return
    const job = jobs.find((item) => item.id === id)
    const selectedArea = status === 'published' && job ? verifiedAreas.find((area) => area.id === (jobAreas[id] || job.area_id)) : null
    if (status === 'published' && !selectedArea) { setMessage('Assign this job to an active verified Kolar locality before publishing.'); return }
    const values: Record<string, any> = { status }
    if (selectedArea) { values.area_id = selectedArea.id; values.taluk = selectedArea.taluk }
    const { error } = await supabase.from('jobs').update(values).eq('id', id)
    if (error) { setMessage(`Could not update this job: ${error.message}`); return }
    setJobs((items) => items.filter((job) => job.id !== id))
    setMessage(status === 'published' ? 'Job approved and published. Matching subscribers have been queued for alerts.' : 'Job rejected.')
  }

  async function moderateArea(id: string, status: 'approved' | 'rejected') {
    if (!supabase) return
    const { error } = await supabase.from('area_suggestions').update({ status }).eq('id', id)
    if (error) { setMessage(`Could not update this area: ${error.message}`); return }
    setAreas((items) => items.filter((area) => area.id !== id))
    setMessage(status === 'approved' ? 'Area suggestion accepted as unverified. Check its source in Manage localities before allowing job posts there.' : 'Area suggestion declined.')
  }

  if (!ready) return <main className="page-shell"><div className="page-container">Checking administrator access…</div></main>
  if (!allowed) return (
    <main className="page-shell"><div className="page-container" style={{ maxWidth: 720 }}>
      <div className="panel" style={{ textAlign: 'center', padding: 42 }}>
        <AlertCircle size={30} color="var(--primary)" />
        <h1 className="page-title" style={{ fontSize: 28 }}>Administrator access required</h1>
        <p className="page-intro">Sign in with the administrator account to manage private profiles, jobs and area submissions.</p>
        <Link className="button button-primary" href="/auth?mode=signin">Sign in</Link>
      </div>
    </div></main>
  )

  return (
    <main className="page-shell">
      <div className="page-container">
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow eyebrow-navy"><ShieldCheck size={13} /> PRIVATE ADMINISTRATION</span>
          <h1 className="page-title">Jobs in Kolar Admin</h1>
          <p className="page-intro">Manage candidate profiles, publish local jobs and review employer submissions.</p>
        </div>
        {message && <div className="form-message success" role="status"><CheckCircle2 size={16} /> {message}</div>}

        <div className="grid-two" style={{ marginBottom: 30 }}>
          <Link href="/admin/profiles" className="panel" style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none' }}>
            <Users color="var(--primary)" size={26} />
            <span><strong style={{ display: 'block', color: 'var(--text-heading)' }}>Manage private profiles</strong><small style={{ color: 'var(--text-secondary)' }}>Review interest, account status, notes and history</small></span>
            <ExternalLink size={16} style={{ marginLeft: 'auto' }} />
          </Link>
          <Link href="/admin/applications" className="panel" style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none' }}>
            <Users color="var(--primary)" size={26} />
            <span><strong style={{ display: 'block', color: 'var(--text-heading)' }}>Review applications</strong><small style={{ color: 'var(--text-secondary)' }}>Update candidate application status and review resumes</small></span>
            <ExternalLink size={16} style={{ marginLeft: 'auto' }} />
          </Link>
          <Link href="/admin/jobs/new" className="panel" style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none' }}>
            <Briefcase color="var(--primary)" size={26} />
            <span><strong style={{ display: 'block', color: 'var(--text-heading)' }}>Post a Kolar job</strong><small style={{ color: 'var(--text-secondary)' }}>Publish from a verified taluk and area</small></span>
            <ExternalLink size={16} style={{ marginLeft: 'auto' }} />
          </Link>
          <Link href="/admin/alerts" className="panel" style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none' }}>
            <MapPin color="var(--primary)" size={26} />
            <span><strong style={{ display: 'block', color: 'var(--text-heading)' }}>Monitor job alerts</strong><small style={{ color: 'var(--text-secondary)' }}>Track the email alert delivery queue live</small></span>
            <ExternalLink size={16} style={{ marginLeft: 'auto' }} />
          </Link>
          <Link href="/admin/areas" className="panel" style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none' }}>
            <MapPin color="var(--primary)" size={26} />
            <span><strong style={{ display: 'block', color: 'var(--text-heading)' }}>Manage localities</strong><small style={{ color: 'var(--text-secondary)' }}>Verify areas against a source before job posts use them</small></span>
            <ExternalLink size={16} style={{ marginLeft: 'auto' }} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, alignItems: 'start' }}>
          <section className="panel">
            <h2 style={{ fontSize: 20, margin: '0 0 18px', display: 'flex', gap: 8, alignItems: 'center' }}><Briefcase size={18} color="var(--primary)" /> Pending job posts ({jobs.length})</h2>
            {jobs.length ? <div style={{ display: 'grid', gap: 14 }}>{jobs.map((job) => <article key={job.id} style={{ padding: 18, background: 'var(--bg-soft)', borderRadius: 14 }}>
              <strong style={{ display: 'block' }}>{job.title}</strong><span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{job.company_name} · {job.location} · {job.category}</span>
              {(!job.area_id || !verifiedAreas.some((area) => area.id === job.area_id)) && <label className="field" style={{ marginTop: 12 }}>Select verified locality before publishing<select value={jobAreas[job.id] || ''} onChange={(e) => setJobAreas((current) => ({ ...current, [job.id]: e.target.value }))}><option value="">Choose locality</option>{verifiedAreas.map((area) => <option key={area.id} value={area.id}>{area.taluk} · {area.name}{area.pincode ? ` · ${area.pincode}` : ''}</option>)}</select></label>}
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.55 }}>{job.description}</p>
              <div style={{ display: 'flex', gap: 8 }}><button className="button button-primary button-sm" onClick={() => moderateJob(job.id, 'published')}><CheckCircle2 size={14} /> Approve & publish</button><button className="button button-secondary button-sm" onClick={() => moderateJob(job.id, 'rejected')}>Reject</button></div>
            </article>)}</div> : <div className="empty-state">No jobs are waiting for review.</div>}
          </section>
          <section className="panel">
            <h2 style={{ fontSize: 20, margin: '0 0 18px', display: 'flex', gap: 8, alignItems: 'center' }}><MapPin size={18} color="var(--primary)" /> Area suggestions ({areas.length})</h2>
            {areas.length ? <div style={{ display: 'grid', gap: 14 }}>{areas.map((area) => <article key={area.id} style={{ padding: 16, background: 'var(--bg-soft)', borderRadius: 14 }}>
              <strong>{area.area_name}</strong><span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 12px' }}>{area.taluk} Taluk · PIN {area.pincode}</span>
              <div style={{ display: 'flex', gap: 8 }}><button className="button button-primary button-sm" onClick={() => moderateArea(area.id, 'approved')}>Approve</button><button className="button button-secondary button-sm" onClick={() => moderateArea(area.id, 'rejected')}>Decline</button></div>
            </article>)}</div> : <div className="empty-state">No area suggestions are waiting.</div>}
          </section>
        </div>
      </div>
    </main>
  )
}
