'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, MapPin, RefreshCw, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminAreasPage() {
  const [ready, setReady] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [areas, setAreas] = useState<any[]>([])
  const [sourceValues, setSourceValues] = useState<Record<string, { name: string; url: string }>>({})
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState('')

  const load = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('areas').select('id,name,taluk,pincode,active,verified,source_name,source_url').order('taluk').order('name')
    if (error) { setMessage(`Could not load localities: ${error.message}`); return }
    setAreas(data || [])
    setSourceValues((current) => Object.fromEntries((data || []).map((area) => [area.id, current[area.id] || { name: area.source_name || '', url: area.source_url || '' }])))
  }, [])

  useEffect(() => {
    const client = supabase
    if (!client) { setReady(true); return }
    let alive = true
    async function init() {
      if (!client) return
      const { data: { user } } = await client.auth.getUser()
      if (!alive) return
      if (!user) { setReady(true); return }
      const { data: profile } = await client.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
      if (!alive) return
      if (!profile?.is_admin) { setReady(true); return }
      setAllowed(true); await load(); setReady(true)
    }
    void init()
    return () => { alive = false }
  }, [load])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return areas.filter((area) => !term || [area.name, area.taluk, area.pincode, area.source_name].some((value) => String(value || '').toLowerCase().includes(term)))
  }, [areas, query])

  async function saveVerification(area: any, verified: boolean) {
    if (!supabase) return
    const source = sourceValues[area.id] || { name: '', url: '' }
    if (verified && (!source.name.trim() || !/^https:\/\//i.test(source.url.trim()))) {
      setMessage('To verify a locality, add a source name and a secure https source URL.'); return
    }
    setBusyId(area.id); setMessage('')
    const { error } = await supabase.from('areas').update({
      verified,
      source_name: verified ? source.name.trim() : area.source_name,
      source_url: verified ? source.url.trim() : area.source_url,
    }).eq('id', area.id)
    setBusyId('')
    if (error) setMessage(`Could not update locality: ${error.message}`)
    else { setAreas((current) => current.map((item) => item.id === area.id ? { ...item, verified, source_name: verified ? source.name.trim() : item.source_name, source_url: verified ? source.url.trim() : item.source_url } : item)); setMessage(verified ? `${area.name} is verified and now available for job posts.` : `${area.name} is no longer available for new job posts.`) }
  }

  async function toggleActive(area: any) {
    if (!supabase) return
    setBusyId(area.id); setMessage('')
    const { error } = await supabase.from('areas').update({ active: !area.active }).eq('id', area.id)
    setBusyId('')
    if (error) setMessage(`Could not update locality: ${error.message}`)
    else { setAreas((current) => current.map((item) => item.id === area.id ? { ...item, active: !area.active } : item)); setMessage(`${area.name} is now ${area.active ? 'inactive' : 'active'}.`) }
  }

  if (!ready) return <main className="page-shell"><div className="page-container">Checking administrator access…</div></main>
  if (!allowed) return <main className="page-shell"><div className="page-container"><div className="panel" style={{ textAlign: 'center', padding: 40 }}><ShieldCheck size={30} color="var(--primary)" /><h1>Administrator access required</h1><Link href="/auth?mode=signin" className="button button-primary">Sign in</Link></div></div></main>

  return <main className="page-shell"><div className="page-container">
    <Link href="/admin" className="button button-secondary button-sm" style={{ marginBottom: 20 }}><ArrowLeft size={15} /> Admin home</Link>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}><div><span className="eyebrow eyebrow-navy"><MapPin size={13} /> REGION DIRECTORY</span><h1 className="page-title">Verified Kolar localities</h1><p className="page-intro">Only active localities with a recorded source can be selected when a job is published. Verify approved suggestions after checking their source.</p></div><button className="button button-secondary" onClick={() => void load()}><RefreshCw size={15} /> Refresh</button></div>
    {message && <div className="form-message success" role="status">{message}</div>}
    <div className="panel" style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}><input aria-label="Search localities" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search locality, taluk or PIN" style={{ flex: 1 }} /><span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{filtered.length} areas</span></div>
    <div style={{ display: 'grid', gap: 12 }}>{filtered.map((area) => <article key={area.id} className="panel" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(260px,.9fr) auto', gap: 16, alignItems: 'center' }}>
      <div><strong>{area.name}</strong><div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{area.taluk} Taluk{area.pincode ? ` · PIN ${area.pincode}` : ''}</div><div style={{ marginTop: 6, display: 'flex', gap: 6 }}><span className="job-pill">{area.active ? 'active' : 'inactive'}</span><span className="job-pill">{area.verified ? 'verified' : 'unverified'}</span></div>{area.verified && area.source_url && <a href={area.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, display: 'inline-flex', gap: 4, marginTop: 6 }}>{area.source_name || 'Source'} <ExternalLink size={12} /></a>}</div>
      <div style={{ display: 'grid', gap: 6 }}><input aria-label={`Source name for ${area.name}`} placeholder="Source name (e.g. India Post)" value={sourceValues[area.id]?.name || ''} onChange={(e) => setSourceValues((current) => ({ ...current, [area.id]: { name: e.target.value, url: current[area.id]?.url || '' } }))} /><input aria-label={`Source URL for ${area.name}`} type="url" placeholder="https:// official source URL" value={sourceValues[area.id]?.url || ''} onChange={(e) => setSourceValues((current) => ({ ...current, [area.id]: { name: current[area.id]?.name || '', url: e.target.value } }))} /></div>
      <div style={{ display: 'grid', gap: 7 }}><button className="button button-primary button-sm" disabled={busyId === area.id || !area.active || area.verified} onClick={() => void saveVerification(area, true)}>Verify locality</button><button className="button button-secondary button-sm" disabled={busyId === area.id || !area.active} onClick={() => void toggleActive(area)}>{area.active ? 'Deactivate' : 'Activate'}</button>{area.verified && <button className="button button-secondary button-sm" disabled={busyId === area.id} onClick={() => void saveVerification(area, false)}>Remove verification</button>}</div>
    </article>)}</div>
  </div></main>
}
