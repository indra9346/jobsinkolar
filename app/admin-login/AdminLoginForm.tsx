'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/bits'
import mark from '@/public/brand/mark.png'

/** Sign-in for administrators only. Any other account is signed straight back out. */
export function AdminLoginForm() {
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const sb = getSupabase()
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error || !data.user) {
      setBusy(false)
      setError(error?.message === 'Invalid login credentials' ? 'Email or password is incorrect.' : (error?.message ?? 'Could not sign in.'))
      return
    }
    const { data: p } = await sb.from('profiles').select('is_admin,account_status').eq('id', data.user.id).maybeSingle()
    if (!p?.is_admin || p.account_status !== 'active') {
      await sb.auth.signOut()
      setBusy(false)
      setError('This account does not have administrator access.')
      return
    }
    if ((data.user.app_metadata as { role?: string })?.role !== 'admin') await sb.auth.refreshSession()
    const next = params.get('next')
    window.location.assign(next && next.startsWith('/admin') ? next : '/admin')
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-navy-900 px-4 py-10">
      <div className="mesh" aria-hidden>
        <span className="-top-20 -left-16 size-96 bg-navy-500/50" />
        <span className="right-[-80px] bottom-[-60px] size-96 bg-brand-600/40 [animation-delay:-7s]" />
        <span className="top-1/3 left-1/2 size-72 bg-saffron-500/20 [animation-delay:-13s]" />
      </div>
      <div className="relative w-full max-w-[400px] animate-slide-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-white shadow-pop">
            <Image src={mark} alt="" width={34} height={44} priority className="h-11 w-auto" />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-white">Admin console</h1>
          <p className="mt-1 text-sm text-white/60">Jobs in Kolar · restricted access</p>
        </div>
        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-pop backdrop-blur" noValidate>
          {error && (
            <p role="alert" className="mb-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-700">
              {error}
            </p>
          )}
          <div className="grid gap-4">
            <div className="field">
              <label htmlFor="a-email" className="label">Admin email</label>
              <input id="a-email" type="email" autoComplete="username" required className="input h-11" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="a-pass" className="label">Password</label>
              <div className="relative">
                <input id="a-pass" type={show ? 'text' : 'password'} autoComplete="current-password" required className="input h-11 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-ink-3 hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button className="btn btn-navy btn-lg mt-1" disabled={busy || !email || !password}>
              {busy ? <Spinner /> : <><LockKeyhole size={16} /> Sign in to admin</>}
            </button>
          </div>
          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-ink-3">
            <ShieldCheck size={14} className="text-emerald-600" /> Every admin action is recorded in the audit log.
          </p>
        </form>
        <p className="mt-6 text-center text-sm text-white/60">
          Not an administrator? <Link href="/login" className="font-medium text-white underline-offset-2 hover:underline">Go to the regular sign-in</Link>
        </p>
      </div>
    </div>
  )
}
