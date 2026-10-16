'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/bits'

export default function ResetPasswordPage() {
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    void getSupabase().auth.getSession().then(({ data }) => setHasSession(Boolean(data.session)))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.length < 8 || !/\d/.test(pw)) return setError('Use at least 8 characters, with a number.')
    if (pw !== pw2) return setError('Passwords do not match.')
    setBusy(true)
    const sb = getSupabase()
    const { error } = await sb.auth.updateUser({ password: pw })
    if (error) {
      setBusy(false)
      return setError(error.message)
    }
    await sb.auth.signOut({ scope: 'global' })
    setDone(true)
  }

  if (hasSession === null) return <div className="flex justify-center"><Spinner size={22} className="text-ink-3" /></div>

  if (done)
    return (
      <div>
        <h1 className="text-2xl font-semibold">Password updated</h1>
        <p className="mt-2 text-sm text-ink-3">For your security we signed you out of all devices. Sign in with your new password.</p>
        <Link href="/login" className="btn btn-navy btn-lg mt-6 w-full">Sign in</Link>
      </div>
    )

  if (!hasSession)
    return (
      <div>
        <h1 className="text-2xl font-semibold">Link expired</h1>
        <p className="mt-2 text-sm text-ink-3">This reset link is invalid or has expired. Request a new one.</p>
        <Link href="/forgot-password" className="btn btn-navy btn-lg mt-6 w-full">Request new link</Link>
      </div>
    )

  return (
    <div>
      <h1 className="text-2xl font-semibold">Choose a new password</h1>
      <form onSubmit={submit} className="mt-8 grid gap-4">
        {error && <p role="alert" className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-700">{error}</p>}
        <div className="field">
          <label htmlFor="pw" className="label">New password</label>
          <input id="pw" type="password" autoComplete="new-password" className="input h-11" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pw2" className="label">Confirm password</label>
          <input id="pw2" type="password" autoComplete="new-password" className="input h-11" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </div>
        <button className="btn btn-navy btn-lg" disabled={busy}>{busy ? <Spinner /> : 'Update password'}</button>
      </form>
    </div>
  )
}
