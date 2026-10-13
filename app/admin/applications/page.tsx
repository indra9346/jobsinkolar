'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, RefreshCw, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const statuses = ['submitted', 'reviewing', 'shortlisted', 'rejected', 'hired', 'withdrawn']

export default function AdminApplicationsPage() {
  const [ready, setReady] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [applications, setApplications] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState('')

  const load = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('applications')
      .select('id,candidate_id,job_id,status,created_at,cover_letter,resume_path,jobs(title,company_name,location),profiles:profiles!applications_candidate_id_fkey(full_name,email,phone,location,headline,skills,resume_path)')
      .order('created_at', { ascending: false }).limit(300)
    if (error) setMessage(`Could not load applications: ${error.message}`)
    else setApplications(data || [])
  }, [])

  useEffect(() => {
    const client = supabase
    if (!client) { setReady(true); return }
    let alive = true
    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | undefined
    async function init() {
      if (!client) return
      const { data: { user } } = await client.auth.getUser()
      if (!alive) return
      if (!user) { setReady(true); return }
      const { data: profile } = await client.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
      if (!alive) return
      if (!profile?.is_admin) { setReady(true); return }
      setAllowed(true)
      await load()
      channel = client.channel('admin-applications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => { void load() })
        .subscribe()
      if (!alive && channel) void client.removeChannel(channel)
      setReady(true)
    }
    void init()
    return () => { alive = false; if (channel) void client.removeChannel(channel) }
  }, [load])

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return applications.filter((application) => {
      const profile = Array.isArray(application.profiles) ? application.profiles[0] : application.profiles
      const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs
      const matchesStatus = !statusFilter || application.status === statusFilter
      const matchesQuery = !term || [profile?.full_name, profile?.email, profile?.phone, profile?.location, job?.title, job?.company_name]
        .some((value) => String(value || '').toLowerCase().includes(term))
      return matchesStatus && matchesQuery
    })
  }, [applications, query, statusFilter])

  async function updateStatus(id: string, status: string) {
    if (!supabase) return
    setBusyId(id); setMessage('')
    const { error } = await supabase.from('applications').update({ status }).eq('id', id)
    setBusyId('')
    if (error) setMessage(`Could not update application: ${error.message}`)
    else { setApplications((current) => current.map((application) => application.id === id ? { ...application, status } : application)); setMessage('Application updated; the candidate has been notified.') }
  }

  async function openResume(path: string) {
    if (!supabase) return
    const { data, error } = await supabase.storage.from('candidate-files').createSignedUrl(path, 5 * 60)
    if (error || !data?.signedUrl) { setMessage('Resume is unavailable or permission was denied.'); return }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  if (!ready) return <main className="page-shell"><div className="page-container">Checking administrator access…</div></main>
  if (!allowed) return <main className="page-shell"><div className="page-container"><div className="panel" style={{ textAlign: 'center', padding: 40 }}><ShieldCheck size={30} color="var(--primary)" /><h1>Administrator access required</h1><Link href="/auth?mode=signin" className="button button-primary">Sign in</Link></div></div></main>

  return <main className="page-shell"><div className="page-container">
    <Link href="/admin" className="button button-secondary button-sm" style={{ marginBottom: 20 }}><ArrowLeft size={15} /> Admin home</Link>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}><div><span className="eyebrow eyebrow-navy"><ShieldCheck size={13} /> ADMIN ONLY · APPLICATIONS</span><h1 className="page-title">Candidate applications</h1><p className="page-intro">Review private candidate details and update application status. Candidates receive an in-app notification when status changes.</p></div><button className="button button-secondary" onClick={() => void load()}><RefreshCw size={15} /> Refresh</button></div>
    {message && <div className="form-message success" role="status">{message}</div>}
    <div className="panel" style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}><input aria-label="Search applications" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search candidate, email, phone, job…" style={{ flex: 1, minWidth: 220 }} /><select aria-label="Filter by application status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select><span style={{ alignSelf: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{visible.length} applications</span></div>
    {visible.length ? <div style={{ display: 'grid', gap: 14 }}>{visible.map((application) => {
      const profile = Array.isArray(application.profiles) ? application.profiles[0] : application.profiles
      const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs
      const resume = application.resume_path || profile?.resume_path
      return <article className="panel" key={application.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 16, alignItems: 'start' }}>
        <div><strong style={{ fontSize: 18 }}>{profile?.full_name || 'Candidate'}</strong><div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{profile?.email || 'No email'}{profile?.phone ? ` · ${profile.phone}` : ''}</div><div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 3 }}>{profile?.headline || profile?.location || 'Candidate profile'}</div><div style={{ padding: 12, background: 'var(--bg-soft)', borderRadius: 10, marginTop: 12 }}><strong>{job?.title || 'Removed job'}</strong><div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{job?.company_name} · {job?.location}</div><small style={{ color: 'var(--text-muted)' }}>Applied {new Date(application.created_at).toLocaleString()}</small></div>{application.cover_letter && <p style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: 'var(--text-secondary)' }}>{application.cover_letter}</p>}{Array.isArray(profile?.skills) && profile.skills.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>{profile.skills.map((skill: string) => <span className="job-pill" key={skill}>{skill}</span>)}</div>}</div>
        <div style={{ display: 'grid', gap: 9, minWidth: 170 }}><label className="field" style={{ margin: 0 }}>Application status<select disabled={busyId === application.id} value={application.status} onChange={(e) => void updateStatus(application.id, e.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>{resume && <button className="button button-secondary button-sm" onClick={() => void openResume(resume)}><Download size={14} /> Open resume</button>}</div>
      </article>
    })}</div> : <div className="panel empty-state">No applications match this filter.</div>}
  </div></main>
}
