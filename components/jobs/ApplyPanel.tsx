'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, FileText, Phone } from 'lucide-react'
import { useAuth } from '@/components/providers'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Modal } from '@/components/ui/modal'
import { Skeleton, Spinner } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { SaveJobButton, useCandidateJobState } from './SaveJobButton'
import { APP_STATUS } from '@/lib/constants'
import { useLang } from '@/lib/i18n'
import type { AppStatus } from '@/lib/types'

type JobLite = {
  id: string
  title: string
  company: string
  employer_id: string
  screening_questions: string[]
  deadline: string | null
  walk_in: boolean
  contact_phone: string | null
  contact_name: string | null
}

export function ApplyPanel({ job }: { job: JobLite }) {
  const { user, profile, ready, refreshProfile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const toast = useToast()
  const { t } = useLang()
  const qc = useQueryClient()
  const state = useCandidateJobState()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [answers, setAnswers] = useState<string[]>(() => job.screening_questions.map(() => ''))
  const [cover, setCover] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    const key = `jik-view-${job.id}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {}
    void getSupabase().rpc('increment_job_view', { p_job: job.id })
  }, [job.id])

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? '')
      setPhone(profile.phone ?? '')
    }
  }, [profile])

  const expired = job.deadline ? new Date(job.deadline + 'T23:59:59') < new Date() : false
  const applied = state.data?.applied.get(job.id)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return
    if (name.trim().length < 2) return toast(t('Enter your full name'), 'error')
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, '').slice(-10))) return toast(t('Enter a valid 10-digit mobile number'), 'error')
    if (answers.some((a) => !a.trim())) return toast('Answer all screening questions', 'error')
    setBusy(true)
    const sb = getSupabase()
    if (name.trim() !== profile.full_name || phone !== profile.phone) {
      const { error } = await sb.from('profiles').update({ full_name: name.trim(), phone: phone.replace(/\D/g, '').slice(-10) }).eq('id', user.id)
      if (error) {
        setBusy(false)
        return toast(error.message, 'error')
      }
    }
    const { error } = await sb.from('applications').insert({
      job_id: job.id,
      candidate_id: user.id,
      cover_letter: cover.trim() || null,
      screening_answers: job.screening_questions.map((q, i) => ({ question: q, answer: answers[i].trim() })),
    })
    setBusy(false)
    if (error) {
      const msg = error.code === '23505' ? 'You have already applied to this job.' : error.message.includes('row-level') ? 'Your account is not allowed to apply right now. Contact support.' : error.message
      return toast(msg, 'error')
    }
    setOpen(false)
    toast(t('Application sent. You will be notified when the employer responds.'))
    await Promise.all([qc.invalidateQueries({ queryKey: ['job-state'] }), qc.invalidateQueries({ queryKey: ['applications'] }), refreshProfile()])
    router.refresh()
  }

  if (!ready || (user && profile?.role === 'candidate' && state.isLoading)) {
    return (
      <div className="card space-y-3 p-5">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="card p-5">
        <p className="font-semibold">{t('Interested in this job?')}</p>
        <p className="mt-1 text-sm text-ink-3">{t('Sign in or create a free account to apply. It takes under a minute.')}</p>
        <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn btn-primary btn-lg mt-4 w-full">
          {t('Apply now')}
        </Link>
        <Link href={`/register?next=${encodeURIComponent(pathname)}`} className="btn btn-outline mt-2 w-full">
          {t('Create free account')}
        </Link>
        <MobileBar>
          <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn btn-primary btn-lg w-full">{t('Apply now')}</Link>
        </MobileBar>
      </div>
    )
  }

  if (profile?.is_admin || profile?.role === 'admin') {
    return (
      <div className="card p-5">
        <p className="text-sm text-ink-3">You are viewing as an administrator.</p>
        <Link href={`/admin/jobs?focus=${job.id}`} className="btn btn-navy mt-3 w-full">Open in moderation</Link>
      </div>
    )
  }

  if (profile?.role === 'employer') {
    return (
      <div className="card p-5">
        {profile.id === job.employer_id ? (
          <>
            <p className="font-semibold">This is your job post</p>
            <Link href={`/employer/jobs/${job.id}`} className="btn btn-navy mt-3 w-full">Manage applicants</Link>
          </>
        ) : (
          <p className="text-sm text-ink-3">You are signed in as an employer. Sign in with a candidate account to apply.</p>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="card p-5">
        {applied ? (
          <>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <p className="font-semibold">{t('You applied to this job')}</p>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-ink-3">{t('Status')}</span>
              <StatusPill tone={APP_STATUS[applied.status as AppStatus].tone}>{APP_STATUS[applied.status as AppStatus].label}</StatusPill>
            </div>
            {(job.contact_phone || job.walk_in) && applied.status !== 'withdrawn' && (
              <div className="mt-4 rounded-lg bg-canvas p-3 text-sm">
                <p className="font-medium">{t('HR contact')}</p>
                {job.contact_name && <p className="text-ink-2">{job.contact_name}</p>}
                {job.contact_phone && (
                  <a href={`tel:${job.contact_phone}`} className="mt-1 inline-flex items-center gap-1.5 font-medium text-navy-700">
                    <Phone size={14} /> {job.contact_phone}
                  </a>
                )}
              </div>
            )}
            <Link href={`/candidate/applications/${applied.id}`} className="btn btn-outline mt-4 w-full">{t('Track application')}</Link>
          </>
        ) : (
          <>
            <button onClick={() => setOpen(true)} disabled={expired} className="btn btn-primary btn-lg w-full">
              {expired ? t('Applications closed') : t('Apply now')}
            </button>
            <div className="mt-2 grid">
              <SaveJobButton jobId={job.id} withLabel />
            </div>
            {!expired && (
              <MobileBar>
                <SaveJobButton jobId={job.id} withLabel />
                <button onClick={() => setOpen(true)} className="btn btn-primary btn-lg flex-1">{t('Apply now')}</button>
              </MobileBar>
            )}
            {!profile?.resume_path && !expired && (
              <p className="mt-3 flex gap-2 text-[13px] text-ink-3">
                <FileText size={15} className="mt-0.5 shrink-0" />
                <span>
                  {t('Applications with a resume get more replies.')}{' '}
                  <Link href="/candidate/profile#resume" className="link">{t('Add resume')}</Link>
                </span>
              </p>
            )}
          </>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${t('Apply')}: ${job.title}`}
        description={job.company}
        footer={
          <>
            <button onClick={() => setOpen(false)} className="btn btn-outline">{t('Cancel')}</button>
            <button form="apply-form" className="btn btn-primary" disabled={busy}>
              {busy ? <Spinner /> : t('Submit application')}
            </button>
          </>
        }
      >
        <form id="apply-form" onSubmit={submit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label className="label" htmlFor="ap-name">{t('Full name')}</label>
              <input id="ap-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label className="label" htmlFor="ap-phone">{t('Mobile number')}</label>
              <input id="ap-phone" className="input" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" required />
            </div>
          </div>
          {job.screening_questions.map((q, i) => (
            <div key={i} className="field">
              <label className="label" htmlFor={`ap-q${i}`}>{q}</label>
              <input
                id={`ap-q${i}`}
                className="input"
                value={answers[i]}
                maxLength={300}
                onChange={(e) => setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)))}
                required
              />
            </div>
          ))}
          <div className="field">
            <label className="label" htmlFor="ap-cover">{t('Message to employer')} <span className="font-normal text-ink-4">{t('(optional)')}</span></label>
            <textarea id="ap-cover" className="input" rows={3} maxLength={1500} value={cover} onChange={(e) => setCover(e.target.value)} placeholder="Why are you a good fit? When can you join?" />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-canvas px-3 py-2.5 text-[13px] text-ink-2">
            <FileText size={15} className="shrink-0 text-ink-3" />
            {profile?.resume_path ? t('Your profile resume will be attached.') : t('No resume on your profile. You can still apply.')}
          </div>
        </form>
      </Modal>
    </>
  )
}

/** apna-style sticky apply bar on phones, where the side panel sits below the description. */
function MobileBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-line bg-white/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      {children}
    </div>
  )
}
