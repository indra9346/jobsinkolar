'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/bits'
import { useLang } from '@/lib/i18n'

export function NewsletterForm({ taluk, category, dark = false }: { taluk?: string; category?: string; dark?: boolean }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const toast = useToast()
  const { t } = useLang()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return toast(t('Enter a valid email address'), 'error')
    setBusy(true)
    const { error } = await getSupabase().rpc('subscribe_to_job_alerts', {
      p_email: email.trim(),
      p_taluk: taluk ?? null,
      p_area_id: null,
      p_category: category ?? null,
    })
    setBusy(false)
    if (error) return toast(error.message, 'error')
    setDone(true)
    toast(t('Subscribed. New matching jobs will reach your inbox.'))
  }

  if (done) return <p className={dark ? 'text-sm text-white/80' : 'text-sm text-ink-2'}>{t("You're subscribed. Unsubscribe anytime from any alert email.")}</p>

  return (
    <form onSubmit={submit} className="flex gap-2">
      <label className="sr-only" htmlFor={`nl-${dark}`}>Email address</label>
      <input
        id={`nl-${dark}`}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="input min-w-0 flex-1"
      />
      <button className="btn btn-navy shrink-0" disabled={busy}>
        {busy ? <Spinner /> : t('Subscribe')}
      </button>
    </form>
  )
}
