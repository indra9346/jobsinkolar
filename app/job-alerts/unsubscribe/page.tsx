'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function UnsubscribeContent() {
  const params = useSearchParams()
  const token = params.get('token') || ''
  const [message, setMessage] = useState('Removing your job alerts…')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let alive = true
    async function remove() {
      if (!/^[0-9a-f-]{36}$/i.test(token)) { if (alive) { setMessage('This unsubscribe link is invalid.'); setDone(true) }; return }
      if (!supabase) { if (alive) { setMessage('The alert service is temporarily unavailable.'); setDone(true) }; return }
      const { data, error } = await supabase.rpc('unsubscribe_job_alert', { p_token: token })
      if (alive) { setMessage(error ? 'We could not update this subscription right now.' : data ? 'You have been unsubscribed from these job alerts.' : 'This subscription was already inactive.'); setDone(true) }
    }
    void remove()
    return () => { alive = false }
  }, [token])

  return <main className="page-shell"><div className="page-container" style={{ maxWidth: 680 }}><div className="panel" style={{ textAlign: 'center', padding: 40 }}>
    {done ? <CheckCircle2 size={32} color="var(--emerald)" /> : <XCircle size={32} color="var(--primary)" />}
    <h1 className="page-title" style={{ fontSize: 30 }}>Job alerts</h1><p className="page-intro">{message}</p><Link href="/jobs" className="button button-primary">Browse jobs</Link>
  </div></div></main>
}

export default function UnsubscribePage() {
  return <Suspense fallback={<main className="page-shell"><div className="page-container">Loading unsubscribe link…</div></main>}><UnsubscribeContent /></Suspense>
}
