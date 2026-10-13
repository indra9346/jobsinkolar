'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BellRing, RefreshCw, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminAlertsPage() {
  const [ready, setReady] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!supabase) return
    const { data, error: queryError } = await supabase.from('job_alert_deliveries')
      .select('id,status,attempt_count,error_message,sent_at,created_at,job:jobs(title,company_name,location),subscription:job_alert_subscriptions(email)')
      .order('created_at', { ascending: false }).limit(100)
    if (queryError) setError(queryError.message)
    else { setError(''); setDeliveries(data || []) }
  }, [])

  useEffect(() => {
    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | undefined
    let alive = true
    async function init() {
      if (!supabase) { setReady(true); return }
      const { data: { user } } = await supabase.auth.getUser()
      if (!alive) return
      if (!user) { setReady(true); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
      if (!alive) return
      if (!profile?.is_admin) { setReady(true); return }
      setAllowed(true)
      await load()
      channel = supabase.channel('admin-job-alert-deliveries')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'job_alert_deliveries' }, () => { void load() })
        .subscribe()
      if (!alive && channel) void supabase.removeChannel(channel)
      setReady(true)
    }
    void init()
    return () => { alive = false; if (channel && supabase) void supabase.removeChannel(channel) }
  }, [load])

  if (!ready) return <main className="page-shell"><div className="page-container">Checking administrator access…</div></main>
  if (!allowed) return <main className="page-shell"><div className="page-container"><div className="panel" style={{ textAlign: 'center', padding: 40 }}><ShieldCheck size={30} color="var(--primary)" /><h1>Administrator access required</h1><Link href="/auth?mode=signin" className="button button-primary">Sign in</Link></div></div></main>

  return <main className="page-shell"><div className="page-container">
    <Link href="/admin" className="button button-secondary button-sm" style={{ marginBottom: 20 }}><ArrowLeft size={15} /> Admin home</Link>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}><div><span className="eyebrow eyebrow-navy"><BellRing size={13} /> ALERT DELIVERY QUEUE</span><h1 className="page-title">Job alert deliveries</h1><p className="page-intro">Live status for queued, sent, failed and skipped email alerts.</p></div><button className="button button-secondary" onClick={() => void load()}><RefreshCw size={15} /> Refresh</button></div>
    {error && <div className="form-message error">Could not load alert deliveries: {error}</div>}
    <section className="panel" style={{ overflowX: 'auto' }}>
      {deliveries.length ? <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}><thead><tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>{['Status','Job','Subscriber','Queued','Result'].map((heading) => <th key={heading} style={{ padding: 12, fontSize: 12, color: 'var(--text-muted)' }}>{heading}</th>)}</tr></thead><tbody>{deliveries.map((delivery) => {
        const job = Array.isArray(delivery.job) ? delivery.job[0] : delivery.job
        const sub = Array.isArray(delivery.subscription) ? delivery.subscription[0] : delivery.subscription
        return <tr key={delivery.id} style={{ borderBottom: '1px solid var(--border-light)' }}><td style={{ padding: 12 }}><span className="job-pill">{delivery.status}</span></td><td style={{ padding: 12 }}><strong>{job?.title || 'Removed job'}</strong><small style={{ display: 'block', color: 'var(--text-muted)' }}>{job?.company_name} · {job?.location}</small></td><td style={{ padding: 12, overflowWrap: 'anywhere' }}>{sub?.email || 'Unavailable'}</td><td style={{ padding: 12, whiteSpace: 'nowrap' }}>{new Date(delivery.created_at).toLocaleString()}</td><td style={{ padding: 12, color: delivery.status === 'failed' ? 'var(--primary)' : 'var(--text-secondary)' }}>{delivery.sent_at ? `Sent ${new Date(delivery.sent_at).toLocaleString()}` : delivery.error_message || `${delivery.attempt_count} attempts`}</td></tr>
      })}</tbody></table> : <div className="empty-state">No job alert deliveries yet. Publishing a matching job will queue an alert.</div>}
    </section>
  </div></main>
}
