'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, RefreshCw, Search, ShieldCheck, UserRound, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Profile = {
  id: string; full_name: string; email: string | null; phone: string | null; role: string;
  location: string | null; headline: string | null; resume_path: string | null;
  account_status: 'active' | 'blocked' | 'suspended'; interest_status: string;
  is_admin: boolean; created_at: string;
}

const interestStatuses = ['new', 'interested', 'contacted', 'shortlisted', 'hired', 'not_interested']

export default function AdminProfilesPage() {
  const [adminId, setAdminId] = useState('')
  const [allowed, setAllowed] = useState(false)
  const [ready, setReady] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [query, setQuery] = useState('')
  const [notes, setNotes] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [noteText, setNoteText] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const loadProfiles = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('profiles')
      .select('id,full_name,email,phone,role,location,headline,resume_path,account_status,interest_status,is_admin,created_at')
      .order('created_at', { ascending: false })
    if (error) { setMessage(`Could not load profiles: ${error.message}`); return }
    const nextProfiles = (data || []) as Profile[]
    setProfiles(nextProfiles)
    setSelectedId((current) => current && nextProfiles.some((p) => p.id === current) ? current : nextProfiles[0]?.id || '')
  }, [])

  useEffect(() => {
    let alive = true
    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | undefined
    async function init() {
      if (!supabase) { setReady(true); return }
      const { data: { user } } = await supabase.auth.getUser()
      if (!alive) return
      if (!user) { setReady(true); return }
      const { data: ownProfile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
      if (!alive) return
      if (!ownProfile?.is_admin) { setReady(true); return }
      setAdminId(user.id)
      setAllowed(true)
      await loadProfiles()
      channel = supabase.channel('admin-profile-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { void loadProfiles() })
        .subscribe()
      setReady(true)
    }
    void init()
    return () => { alive = false; if (channel && supabase) void supabase.removeChannel(channel) }
  }, [loadProfiles])

  const selected = profiles.find((profile) => profile.id === selectedId)
  const visible = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return profiles
    return profiles.filter((profile) => [profile.full_name, profile.email, profile.phone, profile.location, profile.role, profile.interest_status]
      .some((field) => String(field || '').toLowerCase().includes(value)))
  }, [profiles, query])

  useEffect(() => {
    let alive = true
    async function loadDetail() {
      if (!supabase || !allowed || !selected) return
      setResumeUrl('')
      const [nr, hr] = await Promise.all([
        supabase.from('admin_profile_notes').select('id,note,created_at').eq('profile_id', selected.id).order('created_at', { ascending: false }),
        supabase.from('admin_profile_history').select('id,field_name,old_value,new_value,created_at').eq('profile_id', selected.id).order('created_at', { ascending: false }).limit(30),
      ])
      if (!alive) return
      setNotes(nr.data || [])
      setHistory(hr.data || [])
      if (selected.resume_path) {
        const { data } = await supabase.storage.from('candidate-files').createSignedUrl(selected.resume_path, 60 * 5)
        if (alive) setResumeUrl(data?.signedUrl || '')
      }
    }
    void loadDetail()
    return () => { alive = false }
  }, [allowed, selected?.id, selected?.resume_path])

  async function updateStatus(field: 'account_status' | 'interest_status', value: string) {
    if (!supabase || !selected) return
    setBusy(true); setMessage('')
    const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', selected.id)
    setBusy(false)
    if (error) setMessage(`Could not update status: ${error.message}`)
    else { setProfiles((items) => items.map((p) => p.id === selected.id ? { ...p, [field]: value } : p)); setMessage('Profile status saved and the candidate was notified.') }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase || !selected || !adminId || !noteText.trim()) return
    setBusy(true); setMessage('')
    const { error } = await supabase.from('admin_profile_notes').insert({ profile_id: selected.id, admin_id: adminId, note: noteText.trim() })
    setBusy(false)
    if (error) setMessage(`Could not save note: ${error.message}`)
    else { setNotes((items) => [{ id: crypto.randomUUID(), note: noteText.trim(), created_at: new Date().toISOString() }, ...items]); setNoteText(''); setMessage('Private admin note saved.') }
  }

  if (!ready) return <main className="page-shell"><div className="page-container">Checking administrator access…</div></main>
  if (!allowed) return <main className="page-shell"><div className="page-container"><div className="panel" style={{ textAlign: 'center', padding: 40 }}><ShieldCheck size={30} color="var(--primary)" /><h1>Administrator access required</h1><p>Sign in with the authorized admin account to view candidate and employer details.</p><Link href="/auth?mode=signin" className="button button-primary">Sign in</Link></div></div></main>

  return (
    <main className="page-shell"><div className="page-container">
      <Link href="/admin" className="button button-secondary button-sm" style={{ marginBottom: 20 }}><ArrowLeft size={15} /> Admin home</Link>
      <div style={{ marginBottom: 24 }}><span className="eyebrow eyebrow-navy"><ShieldCheck size={13} /> ADMIN ONLY · PROFILE DATA</span><h1 className="page-title">Profiles & candidate status</h1><p className="page-intro">Private candidate and employer information is visible to profile owners and administrators only. Changes are recorded and delivered live.</p></div>
      {message && <div className="form-message success" role="status">{message}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,0.8fr) minmax(0,1.5fr)', gap: 22, alignItems: 'start' }}>
        <section className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}><label style={{ display: 'flex', alignItems: 'center', gap: 7, border: '1px solid var(--border-light)', borderRadius: 10, padding: '9px 10px', flex: 1 }}><Search size={16} /><input aria-label="Search profiles" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, email, phone…" style={{ border: 0, outline: 0, minWidth: 0, width: '100%' }} /></label><button className="button button-secondary button-sm" onClick={() => void loadProfiles()} aria-label="Refresh profiles"><RefreshCw size={15} /></button></div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>{visible.length} of {profiles.length} profiles</div>
          <div style={{ display: 'grid', gap: 7, maxHeight: 650, overflowY: 'auto' }}>{visible.map((profile) => <button key={profile.id} onClick={() => setSelectedId(profile.id)} style={{ textAlign: 'left', border: profile.id === selectedId ? '1px solid var(--primary)' : '1px solid var(--border-light)', borderRadius: 11, padding: 12, background: profile.id === selectedId ? 'var(--primary-light)' : '#fff', cursor: 'pointer' }}>
            <strong style={{ display: 'block', color: 'var(--text-heading)' }}>{profile.full_name || 'Unnamed profile'} {profile.is_admin ? '· Admin' : ''}</strong><span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 12, overflowWrap: 'anywhere' }}>{profile.email || 'No email'} · {profile.role}</span><span className="job-pill" style={{ marginTop: 7, display: 'inline-flex', fontSize: 10 }}>{profile.account_status} / {profile.interest_status.replaceAll('_', ' ')}</span>
          </button>)}</div>
        </section>

        {selected ? <section className="panel" style={{ display: 'grid', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}><div><span className="eyebrow"><UserRound size={13} /> {selected.role.toUpperCase()} PROFILE</span><h2 style={{ margin: '8px 0 4px', fontSize: 24 }}>{selected.full_name || 'Unnamed profile'}</h2><div style={{ color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>{selected.email || 'No email on file'}{selected.phone ? ` · ${selected.phone}` : ''}</div><div style={{ color: 'var(--text-muted)', marginTop: 5 }}>{selected.location || 'Location not provided'}{selected.headline ? ` · ${selected.headline}` : ''}</div></div>{selected.resume_path && resumeUrl && <a className="button button-secondary button-sm" href={resumeUrl} target="_blank" rel="noreferrer"><FileText size={15} /> Resume</a>}</div>
          <div className="grid-two">
            <label className="field">Account access status<select disabled={busy || selected.is_admin} value={selected.account_status} onChange={(e) => void updateStatus('account_status', e.target.value)}><option value="active">Active</option><option value="blocked">Blocked</option><option value="suspended">Suspended</option></select>{selected.is_admin && <small>Admin accounts cannot be disabled here.</small>}</label>
            <label className="field">Recruitment interest status<select disabled={busy || selected.is_admin} value={selected.interest_status} onChange={(e) => void updateStatus('interest_status', e.target.value)}>{interestStatuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></label>
          </div>
          <form onSubmit={addNote}><label className="field">Private admin note<textarea rows={3} maxLength={4000} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a private follow-up note…" /></label><button className="button button-primary button-sm" disabled={busy || !noteText.trim()}>Save note</button></form>
          <div className="grid-two">
            <div><h3 style={{ fontSize: 16 }}>Admin notes</h3>{notes.length ? notes.map((note) => <article key={note.id} style={{ padding: 11, background: 'var(--bg-soft)', borderRadius: 10, marginBottom: 8 }}><p style={{ margin: '0 0 6px', whiteSpace: 'pre-wrap' }}>{note.note}</p><small style={{ color: 'var(--text-muted)' }}>{new Date(note.created_at).toLocaleString()}</small></article>) : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No admin notes yet.</p>}</div>
            <div><h3 style={{ fontSize: 16 }}>Status history</h3>{history.length ? history.map((item) => <article key={item.id} style={{ padding: 11, background: 'var(--bg-soft)', borderRadius: 10, marginBottom: 8 }}><strong>{item.field_name.replaceAll('_', ' ')}</strong><div style={{ fontSize: 13 }}>{item.old_value || '—'} → {item.new_value}</div><small style={{ color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleString()}</small></article>) : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No status changes recorded.</p>}</div>
          </div>
          <button type="button" className="button button-secondary button-sm" onClick={() => setSelectedId('')} style={{ display: 'none' }}><X size={14} /></button>
        </section> : <section className="panel empty-state">Select a profile to review its details.</section>}
      </div>
    </div></main>
  )
}
