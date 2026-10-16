'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MailCheck } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/bits'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Enter a valid email address')
    setError(null)
    setBusy(true)
    const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
    })
    setBusy(false)
    if (error && !/rate/i.test(error.message)) return setError(error.message)
    setSent(true)
    setCooldown(60)
    const t = setInterval(() => setCooldown((c) => (c <= 1 ? (clearInterval(t), 0) : c - 1)), 1000)
  }

  if (sent)
    return (
      <div>
        <span className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <MailCheck size={22} />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">Check your inbox</h1>
        <p className="mt-2 text-sm text-ink-3">
          If an account exists for <span className="font-medium text-ink">{email}</span>, we&apos;ve sent a link to reset your password. It expires in one hour.
        </p>
        <button onClick={() => send()} disabled={cooldown > 0 || busy} className="btn btn-outline mt-6 w-full">
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
        </button>
        <Link href="/login" className="btn btn-ghost mt-2 w-full">Back to sign in</Link>
      </div>
    )

  return (
    <div>
      <h1 className="text-2xl font-semibold">Reset your password</h1>
      <p className="mt-1.5 text-sm text-ink-3">Enter the email you registered with and we&apos;ll send you a reset link.</p>
      <form onSubmit={send} className="mt-8 grid gap-4" noValidate>
        <div className="field">
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" className="input h-11" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(error)} />
          {error && <p className="error-text">{error}</p>}
        </div>
        <button className="btn btn-navy btn-lg" disabled={busy}>{busy ? <Spinner /> : 'Send reset link'}</button>
        <Link href="/login" className="text-center text-sm link">Back to sign in</Link>
      </form>
    </div>
  )
}
