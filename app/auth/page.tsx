'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, User, Mail, Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { supabase } from '@/lib/supabase'

function AuthForm() {
  const params = useSearchParams()
  const [mode, setMode] = useState<'signin' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'signin')
  const [role, setRole] = useState<'candidate' | 'employer'>('candidate')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setIsSuccess(false)
    setBusy(true)

    if (!supabase) {
      setMessage('Authentication is unavailable. Check the Supabase URL and anon key in the app environment.')
      setBusy(false)
      return
    }

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
              role,
            },
          },
        })

        if (error) {
          if (error.message.toLowerCase().includes('already registered')) {
            const loginRes = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            })
            if (loginRes.data.session) {
              setIsSuccess(true)
              setMessage('Welcome back! Redirecting to your dashboard...')
              window.location.href = '/dashboard'
              return
            }
          }
          setMessage(error.message)
          setIsSuccess(false)
        } else {
          setIsSuccess(true)
          if (data.session) {
            setMessage('Account created! Redirecting to your dashboard...')
            window.location.href = '/dashboard'
          } else {
            const loginRes = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            })
            if (loginRes.data.session) {
              setMessage('Account created! Redirecting to your dashboard...')
              window.location.href = '/dashboard'
            } else {
              setMessage('Account created! Welcome to Jobs in Kolar.')
              setTimeout(() => { window.location.href = '/dashboard' }, 500)
            }
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          setMessage(error.message)
          setIsSuccess(false)
        } else {
          setIsSuccess(true)
          setMessage('Signed in successfully! Redirecting...')
          if (data.session) {
            window.location.href = '/dashboard'
          }
        }
      }
    } catch (err: any) {
      setMessage(err.message || 'An error occurred during authentication.')
      setIsSuccess(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page-shell" style={{ display: 'grid', placeItems: 'center', minHeight: '80vh' }}>
      <div className="panel" style={{ width: 'min(480px, 100%)', padding: '40px 36px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-block', marginBottom: '16px' }}>
            <Logo size="md" />
          </div>
          <h1 style={{ fontSize: '26px', margin: '0 0 8px' }}>
            {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            {mode === 'signup'
              ? 'Join Kolar’s premier local talent and employer network.'
              : 'Sign in to access your jobs, applications, and profile.'}
          </p>
        </div>

        {/* Candidate / Employer Switcher on Signup */}
        {mode === 'signup' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              padding: '4px',
              background: 'var(--bg-soft)',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid var(--border-light)',
            }}
          >
            <button
              type="button"
              onClick={() => setRole('candidate')}
              style={{
                border: '0',
                padding: '10px',
                borderRadius: '9px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: role === 'candidate' ? '#ffffff' : 'transparent',
                color: role === 'candidate' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: role === 'candidate' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <User size={16} /> Job Seeker
            </button>
            <button
              type="button"
              onClick={() => setRole('employer')}
              style={{
                border: '0',
                padding: '10px',
                borderRadius: '9px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: role === 'employer' ? '#ffffff' : 'transparent',
                color: role === 'employer' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: role === 'employer' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <Briefcase size={16} /> Employer / HR
            </button>
          </div>
        )}

        {message && (
          <div className={`form-message ${isSuccess ? 'success' : 'error'}`} role="status">
            {isSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label className="field">
              {role === 'employer' ? 'Company or HR Contact Name' : 'Full Name'}
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'employer' ? 'e.g. Anand Sharma (HR Manager)' : 'e.g. Ramesh Gowda'}
                autoComplete="name"
              />
            </label>
          )}

          <label className="field">
            Email Address
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label className="field">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </label>

          <button className="button button-primary" style={{ width: '100%', marginTop: '12px' }} disabled={busy}>
            {busy ? 'Please wait...' : mode === 'signup' ? `Register as ${role === 'employer' ? 'Employer' : 'Candidate'}` : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
          {mode === 'signup' ? 'Already have an account?' : 'New to Jobs in Kolar?'}{' '}
          <button
            onClick={() => {
              setMode(mode === 'signup' ? 'signin' : 'signup')
              setMessage('')
            }}
            style={{ border: 0, background: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
          >
            {mode === 'signup' ? 'Sign in here' : 'Create an account'}
          </button>
        </div>
      </div>
    </main>
  )
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell" style={{ display: 'grid', placeItems: 'center' }}>
          <div>Loading authentication...</div>
        </main>
      }
    >
      <AuthForm />
    </Suspense>
  )
}
