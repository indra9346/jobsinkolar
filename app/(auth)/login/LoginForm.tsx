'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { safeNext } from '@/lib/auth-routing'
import { Spinner } from '@/components/ui/bits'
import { useLang } from '@/lib/i18n'

export function LoginForm() {
  const params = useSearchParams()
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(params.get('error'))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const sb = getSupabase()
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error || !data.user) {
      setBusy(false)
      setError(error?.message === 'Invalid login credentials' ? t('Email or password is incorrect.') : (error?.message ?? 'Could not sign in.'))
      return
    }
    const { data: p } = await sb.from('profiles').select('role,is_admin,account_status').eq('id', data.user.id).maybeSingle()
    if (!p) {
      await sb.auth.signOut()
      setBusy(false)
      setError('We could not find your profile. Contact support.')
      return
    }
    if (p.account_status !== 'active') {
      await sb.auth.signOut()
      setBusy(false)
      setError(p.account_status === 'blocked' ? 'This account has been blocked. Contact support if you think this is a mistake.' : 'This account is temporarily suspended. Contact support.')
      return
    }
    // Make sure the JWT carries the latest role claim before the middleware sees it.
    if ((data.user.app_metadata as { role?: string })?.role !== (p.is_admin ? 'admin' : p.role)) await sb.auth.refreshSession()
    // Full navigation so server components render with the new session cookies.
    window.location.assign(safeNext(params.get('next'), p.role, p.is_admin))
  }

  return (
    <div>
      <h1 className="text-[28px] font-bold">{t('Welcome back')}</h1>
      <p className="mt-1.5 text-sm text-ink-3">
        {t('New to Jobs in Kolar?')}{' '}
        <Link href={`/register${params.get('next') ? `?next=${encodeURIComponent(params.get('next')!)}` : ''}`} className="link">
          {t('Create an account')}
        </Link>
      </p>
      <form onSubmit={submit} className="mt-8 grid gap-4" noValidate>
        {error && (
          <p role="alert" className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-700">
            {error}
          </p>
        )}
        <div className="field">
          <label htmlFor="email" className="label">{t('Email')}</label>
          <input id="email" type="email" autoComplete="email" required className="input h-11" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">{t('Password')}</label>
            <Link href="/forgot-password" className="text-[13px] link">{t('Forgot password?')}</Link>
          </div>
          <div className="relative">
            <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" required className="input h-11 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-ink-3 hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>
        <button className="btn btn-navy btn-lg mt-2" disabled={busy || !email || !password}>
          {busy ? <Spinner /> : t('Sign in')}
        </button>
      </form>
    </div>
  )
}
