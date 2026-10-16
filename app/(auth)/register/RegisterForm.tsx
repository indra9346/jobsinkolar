'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Building2, Eye, EyeOff, UserRound } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { safeNext } from '@/lib/auth-routing'
import { TALUKS } from '@/lib/constants'
import { Spinner } from '@/components/ui/bits'
import { cn } from '@/lib/format'

type Role = 'candidate' | 'employer'

export function RegisterForm() {
  const params = useSearchParams()
  const [role, setRole] = useState<Role>(params.get('role') === 'employer' ? 'employer' : 'candidate')
  const [f, setF] = useState({ full_name: '', company_name: '', phone: '', email: '', password: '', taluk: '' })
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (f.full_name.trim().length < 2) e.full_name = 'Enter your full name'
    if (role === 'employer' && f.company_name.trim().length < 2) e.company_name = 'Enter your company or business name'
    if (!/^[6-9]\d{9}$/.test(f.phone.replace(/\D/g, '').slice(-10)) || f.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid 10-digit mobile number'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Enter a valid email address'
    if (f.password.length < 8) e.password = 'Use at least 8 characters'
    else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) e.password = 'Use letters and at least one number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!validate()) return
    setBusy(true)
    const sb = getSupabase()
    const email = f.email.trim().toLowerCase()
    const phone = f.phone.replace(/\D/g, '').slice(-10)
    const { error } = await sb.auth.signUp({
      email,
      password: f.password,
      options: {
        data: { role, full_name: f.full_name.trim(), phone, company_name: role === 'employer' ? f.company_name.trim() : null },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (error) {
      setBusy(false)
      setFormError(/registered|exists/i.test(error.message) ? 'An account with this email already exists. Sign in instead.' : error.message)
      return
    }
    // Accounts are confirmed by the database; sign in to get a session that carries the role claim.
    const { data: signed, error: signErr } = await sb.auth.signInWithPassword({ email, password: f.password })
    if (signErr || !signed.user) {
      setBusy(false)
      setFormError('Account created. Check your email to confirm it, then sign in.')
      return
    }
    if (role === 'candidate' && f.taluk) await sb.from('profiles').update({ taluk: f.taluk }).eq('id', signed.user.id)
    const next = params.get('next')
    const dest = next ? safeNext(next, role, false) : role === 'employer' ? '/employer/company?welcome=1' : '/candidate/profile?welcome=1'
    window.location.assign(dest)
  }

  const field = (k: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="field">
      <label htmlFor={k} className="label">{label}</label>
      <input id={k} className="input h-11" value={f[k]} onChange={set(k)} aria-invalid={Boolean(errors[k])} aria-describedby={errors[k] ? `${k}-err` : undefined} {...props} />
      {errors[k] && <p id={`${k}-err`} className="error-text">{errors[k]}</p>}
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-1.5 text-sm text-ink-3">
        Already registered? <Link href={`/login${params.get('next') ? `?next=${encodeURIComponent(params.get('next')!)}` : ''}`} className="link">Sign in</Link>
      </p>

      <div className="mt-7 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Account type">
        {(
          [
            ['candidate', UserRound, 'I want a job', 'Find and apply'],
            ['employer', Building2, 'I want to hire', 'Post jobs, find staff'],
          ] as const
        ).map(([r, Icon, t, s]) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={role === r}
            onClick={() => setRole(r)}
            className={cn('flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-colors', role === r ? 'border-navy-600 bg-navy-50/60 ring-1 ring-navy-600' : 'border-line hover:border-ink-4')}
          >
            <Icon size={20} className={role === r ? 'text-navy-700' : 'text-ink-3'} />
            <span>
              <span className="block text-sm font-semibold">{t}</span>
              <span className="block text-xs text-ink-3">{s}</span>
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-4" noValidate>
        {formError && (
          <p role="alert" className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-700">
            {formError}{' '}
            {formError.includes('Sign in') && <Link href="/login" className="font-medium underline">Sign in</Link>}
          </p>
        )}
        {role === 'employer' && field('company_name', 'Company or business name', { autoComplete: 'organization' })}
        {field('full_name', role === 'employer' ? 'Your name (hiring contact)' : 'Full name', { autoComplete: 'name' })}
        <div className="grid gap-4 sm:grid-cols-2">
          {field('phone', 'Mobile number', { inputMode: 'tel', autoComplete: 'tel', placeholder: '98XXXXXXXX' })}
          {role === 'candidate' ? (
            <div className="field">
              <label htmlFor="taluk" className="label">Your taluk</label>
              <select id="taluk" className="input h-11" value={f.taluk} onChange={set('taluk')}>
                <option value="">Select</option>
                {TALUKS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
                <option value="">Outside Kolar district</option>
              </select>
            </div>
          ) : (
            field('email', 'Work email', { type: 'email', autoComplete: 'email' })
          )}
        </div>
        {role === 'candidate' && field('email', 'Email', { type: 'email', autoComplete: 'email' })}
        <div className="field">
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <input id="password" type={show ? 'text' : 'password'} autoComplete="new-password" className="input h-11 pr-10" value={f.password} onChange={set('password')} aria-invalid={Boolean(errors.password)} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-ink-3 hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.password ? <p className="error-text">{errors.password}</p> : <p className="hint">At least 8 characters, with a number.</p>}
        </div>
        <button className="btn btn-primary btn-lg mt-1" disabled={busy}>
          {busy ? <Spinner /> : role === 'employer' ? 'Create employer account' : 'Create account'}
        </button>
        {role === 'employer' && <p className="text-center text-xs text-ink-3">Includes 2 free job posts and 5 candidate unlocks.</p>}
      </form>
    </div>
  )
}
