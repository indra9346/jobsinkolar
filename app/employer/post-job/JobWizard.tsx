'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { AlertTriangle, Check, Info, Plus, X } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/bits'
import { ChipSelect, TagInput } from '@/components/ui/TagInput'
import { BENEFITS, EDUCATION, EMPLOYMENT_TYPES, ENGLISH, PAY_TYPES, SCREENING_SUGGESTIONS, SHIFTS, TALUKS, WORK_MODES } from '@/lib/constants'
import { cn, formatSalary } from '@/lib/format'
import type { Area, Job, Wallet } from '@/lib/types'

type Form = {
  company_name: string
  title: string
  category: string
  employment_type: Job['employment_type']
  work_mode: Job['work_mode']
  shift: Job['shift']
  openings: string
  taluk: string
  area_id: string
  salary_period: Job['salary_period']
  pay_type: Job['pay_type']
  salary_min: string
  salary_max: string
  incentive_max: string
  benefits: string[]
  fresher: boolean
  experience_min: string
  experience_max: string
  education: string
  english_level: Job['english_level']
  skills: string[]
  requirements: string
  description: string
  screening_questions: string[]
  walk_in: boolean
  interview_address: string
  interview_timings: string
  contact_name: string
  contact_phone: string
  deadline: string
  joining_fee: boolean
  joining_fee_amount: string
  joining_fee_reason: string
}

const STEPS = ['Job details', 'Candidate requirements', 'Interview details', 'Review']

const s = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n))

function fromJob(j: Job | null, d: { company: string; address: string; contactName: string; contactPhone: string }): Form {
  return {
    company_name: j?.company_name ?? d.company,
    title: j?.title ?? '',
    category: j?.category ?? '',
    employment_type: j?.employment_type ?? 'Full-time',
    work_mode: j?.work_mode ?? 'on_site',
    shift: j?.shift ?? 'day',
    openings: s(j?.openings ?? 1),
    taluk: j?.taluk ?? '',
    area_id: j?.area_id ?? '',
    salary_period: j?.salary_period ?? 'month',
    pay_type: j?.pay_type ?? 'fixed',
    salary_min: s(j?.salary_min),
    salary_max: s(j?.salary_max),
    incentive_max: s(j?.incentive_max),
    benefits: j?.benefits ?? [],
    fresher: j ? j.experience_min === 0 && !j.experience_max : false,
    experience_min: s(j?.experience_min ?? 0),
    experience_max: s(j?.experience_max),
    education: j?.education ?? '',
    english_level: j?.english_level ?? 'none',
    skills: j?.skills ?? [],
    requirements: (j?.requirements ?? []).join('\n'),
    description: j?.description ?? '',
    screening_questions: j?.screening_questions ?? [],
    walk_in: j?.walk_in ?? false,
    interview_address: j?.interview_address ?? d.address,
    interview_timings: j?.interview_timings ?? '',
    contact_name: j?.contact_name ?? d.contactName,
    contact_phone: j?.contact_phone ?? d.contactPhone,
    deadline: j?.deadline ?? '',
    joining_fee: j?.joining_fee ?? false,
    joining_fee_amount: s(j?.joining_fee_amount),
    joining_fee_reason: j?.joining_fee_reason ?? '',
  }
}

export function JobWizard(props: {
  employerId: string
  companyName: string
  companyAddress: string
  contactName: string
  contactPhone: string
  categories: string[]
  areas: Area[]
  wallet: Wallet | null
  existing: Job | null
  template: Job | null
}) {
  const { existing, wallet } = props
  const router = useRouter()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [f, setF] = useState<Form>(() =>
    fromJob(existing ?? props.template, { company: props.companyName, address: props.companyAddress, contactName: props.contactName, contactPhone: props.contactPhone }),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<null | 'draft' | 'submit' | 'save'>(null)
  const [customQ, setCustomQ] = useState('')

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((x) => ({ ...x, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }))
  }
  const talukAreas = useMemo(() => props.areas.filter((a) => a.taluk === f.taluk), [props.areas, f.taluk])
  const credits = wallet?.job_credits ?? 0
  const needsCredit = !existing || (existing.status === 'draft' && !existing.credit_used)

  const validate = (st: number) => {
    const e: Record<string, string> = {}
    const num = (v: string) => (v === '' ? null : Number(v))
    if (st === 0) {
      if (f.company_name.trim().length < 2) e.company_name = 'Enter the company name'
      if (f.title.trim().length < 3) e.title = 'Enter a clear job title'
      if (!f.category) e.category = 'Choose a category'
      const o = Number(f.openings)
      if (!o || o < 1 || o > 500) e.openings = 'Enter 1–500'
      if (!f.taluk) e.taluk = 'Choose a taluk'
      if (!f.area_id) e.area_id = 'Choose the locality'
      const mn = num(f.salary_min)
      const mx = num(f.salary_max)
      if (mn === null || mn <= 0) e.salary_min = 'Enter the minimum salary'
      if (mx !== null && mn !== null && mx < mn) e.salary_max = 'Maximum must be at least the minimum'
      if (f.salary_period === 'month' && mn !== null && mn > 0 && mn < 3000) e.salary_min = 'Monthly salary looks too low'
      if (f.pay_type !== 'fixed' && f.incentive_max && Number(f.incentive_max) < 0) e.incentive_max = 'Enter a valid amount'
    }
    if (st === 1) {
      if (!f.fresher) {
        const a = Number(f.experience_min)
        const b = num(f.experience_max)
        if (isNaN(a) || a < 0 || a > 40) e.experience_min = 'Enter 0–40'
        if (b !== null && b < a) e.experience_max = 'Must be at least the minimum'
      }
      if (f.description.trim().length < 80) e.description = `Describe the role in at least 80 characters (${f.description.trim().length}/80)`
    }
    if (st === 2) {
      if (f.contact_phone && !/^[6-9]\d{9}$/.test(f.contact_phone.replace(/\D/g, '').slice(-10))) e.contact_phone = 'Enter a valid 10-digit mobile number'
      if (f.walk_in && f.interview_address.trim().length < 8) e.interview_address = 'Add the walk-in address'
      if (f.deadline && f.deadline < new Date().toISOString().slice(0, 10)) e.deadline = 'Deadline must be in the future'
      if (f.joining_fee) {
        if (!f.joining_fee_amount || Number(f.joining_fee_amount) <= 0) e.joining_fee_amount = 'Enter the amount'
        if (f.joining_fee_reason.trim().length < 5) e.joining_fee_reason = 'Explain what the fee is for'
      }
    }
    setErrors(e)
    const first = Object.keys(e)[0]
    if (first) document.getElementById(`f-${first}`)?.focus()
    return !first
  }

  const next = () => {
    if (!validate(step)) return
    setStep((x) => Math.min(3, x + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const goto = (i: number) => {
    if (i <= step) return setStep(i)
    for (let k = step; k < i; k++) if (!validate(k)) return setStep(k)
    setStep(i)
  }

  const payload = () => {
    const expMin = f.fresher ? 0 : Number(f.experience_min) || 0
    const expMax = f.fresher ? null : f.experience_max === '' ? null : Number(f.experience_max)
    return {
      company_name: f.company_name.trim(),
      title: f.title.trim(),
      category: f.category,
      employment_type: f.employment_type,
      work_mode: f.work_mode,
      shift: f.shift,
      openings: Number(f.openings),
      taluk: f.taluk,
      area_id: f.area_id,
      salary_period: f.salary_period,
      pay_type: f.pay_type,
      salary_min: Number(f.salary_min),
      salary_max: f.salary_max === '' ? Number(f.salary_min) : Number(f.salary_max),
      incentive_max: f.pay_type !== 'fixed' && f.incentive_max ? Number(f.incentive_max) : null,
      benefits: f.benefits,
      experience_min: expMin,
      experience_max: expMax,
      experience_level: f.fresher ? 'Fresher' : expMax ? `${expMin}-${expMax} years` : `${expMin}+ years`,
      education: f.education || null,
      english_level: f.english_level,
      skills: f.skills,
      requirements: f.requirements.split('\n').map((r) => r.replace(/^[-•*]\s*/, '').trim()).filter(Boolean).slice(0, 15),
      description: f.description.trim(),
      screening_questions: f.screening_questions,
      walk_in: f.walk_in,
      interview_address: f.interview_address.trim() || null,
      interview_timings: f.interview_timings.trim() || null,
      contact_name: f.contact_name.trim() || null,
      contact_phone: f.contact_phone ? f.contact_phone.replace(/\D/g, '').slice(-10) : null,
      deadline: f.deadline || null,
      joining_fee: f.joining_fee,
      joining_fee_amount: f.joining_fee ? Number(f.joining_fee_amount) : null,
      joining_fee_reason: f.joining_fee ? f.joining_fee_reason.trim() : null,
    }
  }

  const persist = async (mode: 'draft' | 'submit' | 'save') => {
    for (let k = 0; k < 3; k++) if (!validate(k)) return setStep(k)
    if (mode === 'submit' && needsCredit && credits < 1) {
      toast('You have no job posting credits left. Buy a plan to submit this job.', 'error')
      return
    }
    setBusy(mode)
    const sb = getSupabase()
    const body = payload()
    let status: Job['status'] | undefined
    if (mode === 'draft') status = 'draft'
    if (mode === 'submit') status = 'pending_review'

    const res = existing
      ? await sb.from('jobs').update({ ...body, ...(status ? { status } : {}) }).eq('id', existing.id).select('id,status').single()
      : await sb.from('jobs').insert({ ...body, employer_id: props.employerId, status: status ?? 'draft' }).select('id,status').single()
    setBusy(null)
    if (res.error) {
      const m = res.error.message
      return toast(m.includes('row-level') ? 'Your account cannot post jobs right now. Contact support.' : m, 'error')
    }
    const st = res.data.status as Job['status']
    toast(st === 'pending_review' ? 'Submitted for review. Most jobs are approved within a few hours.' : st === 'draft' ? 'Draft saved' : 'Changes saved')
    router.push(`/employer/jobs/${res.data.id}`)
    router.refresh()
  }

  const err = (k: keyof Form) => errors[k] && <p className="error-text">{errors[k]}</p>
  const area = props.areas.find((a) => a.id === f.area_id)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link href="/employer/jobs" className="text-[13px] font-medium text-ink-3 hover:text-ink">← Jobs</Link>
        <h1 className="mt-1.5 text-[22px] font-semibold sm:text-2xl">{existing ? 'Edit job' : 'Post a new job'}</h1>
        {!existing && (
          <p className="mt-1 text-sm text-ink-3">
            {credits > 0 ? `You have ${credits} job credit${credits === 1 ? '' : 's'}. Submitting uses one; saving a draft is free.` : (
              <>You have no job credits. You can save a draft now and <Link href="/employer/billing" className="link">buy a plan</Link> to submit.</>
            )}
          </p>
        )}
      </div>

      {existing?.status === 'rejected' && existing.rejection_reason && (
        <div className="mb-5 flex gap-3 rounded-[10px] border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Our team asked for changes</p>
            <p className="mt-0.5">{existing.rejection_reason}</p>
            <p className="mt-1 text-brand-700">Fix the job and resubmit. Resubmitting is free.</p>
          </div>
        </div>
      )}
      {existing?.status === 'published' && (
        <div className="mb-5 flex gap-3 rounded-[10px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Info size={18} className="mt-0.5 shrink-0" />
          <p>This job is live. Changing the title, description, salary, category or location sends it back for a quick review. Interview details and benefits update instantly.</p>
        </div>
      )}

      {/* Stepper */}
      <ol className="mb-6 grid grid-cols-4 gap-2">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button type="button" onClick={() => goto(i)} className="group w-full text-left">
              <span className={cn('block h-1 rounded-full', i <= step ? 'bg-navy-600' : 'bg-line')} />
              <span className={cn('mt-2 flex items-center gap-1.5 text-xs font-medium sm:text-[13px]', i === step ? 'text-ink' : i < step ? 'text-navy-700' : 'text-ink-4')}>
                {i < step && <Check size={13} className="hidden sm:inline" />}
                <span className="truncate">{label}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="card p-5 sm:p-6">
        {step === 0 && (
          <div className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field sm:col-span-2">
                <label className="label" htmlFor="f-title">Job title</label>
                <input id="f-title" className="input" placeholder="e.g. CNC Machine Operator" value={f.title} onChange={(e) => set('title', e.target.value)} maxLength={100} aria-invalid={!!errors.title} />
                {err('title')}
              </div>
              <div className="field">
                <label className="label" htmlFor="f-company_name">Company name</label>
                <input id="f-company_name" className="input" value={f.company_name} onChange={(e) => set('company_name', e.target.value)} maxLength={120} aria-invalid={!!errors.company_name} />
                {err('company_name')}
              </div>
              <div className="field">
                <label className="label" htmlFor="f-category">Category</label>
                <select id="f-category" className="input" value={f.category} onChange={(e) => set('category', e.target.value)} aria-invalid={!!errors.category}>
                  <option value="">Select</option>
                  {props.categories.map((c) => <option key={c}>{c}</option>)}
                </select>
                {err('category')}
              </div>
            </div>

            <fieldset className="grid gap-2">
              <legend className="label mb-2">Job type</legend>
              <div className="flex flex-wrap gap-1.5">
                {EMPLOYMENT_TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => set('employment_type', t)} className={cn('rounded-full border px-3 py-1.5 text-[13px] font-medium', f.employment_type === t ? 'border-navy-600 bg-navy-50 text-navy-800' : 'border-line text-ink-2 hover:border-ink-4')}>
                    {t}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="field">
                <label className="label" htmlFor="f-work_mode">Work mode</label>
                <select id="f-work_mode" className="input" value={f.work_mode} onChange={(e) => set('work_mode', e.target.value as Form['work_mode'])}>
                  {Object.entries(WORK_MODES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="f-shift">Shift</label>
                <select id="f-shift" className="input" value={f.shift} onChange={(e) => set('shift', e.target.value as Form['shift'])}>
                  {Object.entries(SHIFTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="f-openings">Openings</label>
                <input id="f-openings" type="number" min={1} max={500} className="input" value={f.openings} onChange={(e) => set('openings', e.target.value)} aria-invalid={!!errors.openings} />
                {err('openings')}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label className="label" htmlFor="f-taluk">Job location — taluk</label>
                <select id="f-taluk" className="input" value={f.taluk} onChange={(e) => { set('taluk', e.target.value); set('area_id', '') }} aria-invalid={!!errors.taluk}>
                  <option value="">Select taluk</option>
                  {TALUKS.map((t) => <option key={t}>{t}</option>)}
                </select>
                {err('taluk')}
              </div>
              <div className="field">
                <label className="label" htmlFor="f-area_id">Locality</label>
                <select id="f-area_id" className="input" value={f.area_id} onChange={(e) => set('area_id', e.target.value)} disabled={!f.taluk} aria-invalid={!!errors.area_id}>
                  <option value="">{f.taluk ? 'Select locality' : 'Choose a taluk first'}</option>
                  {talukAreas.map((a) => <option key={a.id} value={a.id}>{a.name}{a.pincode ? ` (${a.pincode})` : ''}</option>)}
                </select>
                {err('area_id')}
                <p className="hint">Locality missing? <Link href="/suggest-area" target="_blank" className="link">Suggest it</Link> and we’ll add it.</p>
              </div>
            </div>

            <div className="border-t border-line-2 pt-5">
              <p className="mb-3 text-sm font-semibold">Salary</p>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="field">
                  <label className="label" htmlFor="f-salary_period">Paid</label>
                  <select id="f-salary_period" className="input" value={f.salary_period} onChange={(e) => set('salary_period', e.target.value as Form['salary_period'])}>
                    <option value="month">Monthly</option>
                    <option value="day">Daily</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="f-salary_min">Minimum (₹)</label>
                  <input id="f-salary_min" type="number" min={0} step={500} className="input" value={f.salary_min} onChange={(e) => set('salary_min', e.target.value)} aria-invalid={!!errors.salary_min} />
                  {err('salary_min')}
                </div>
                <div className="field">
                  <label className="label" htmlFor="f-salary_max">Maximum (₹)</label>
                  <input id="f-salary_max" type="number" min={0} step={500} className="input" value={f.salary_max} onChange={(e) => set('salary_max', e.target.value)} aria-invalid={!!errors.salary_max} />
                  {err('salary_max')}
                </div>
                <div className="field">
                  <label className="label" htmlFor="f-pay_type">Pay type</label>
                  <select id="f-pay_type" className="input" value={f.pay_type} onChange={(e) => set('pay_type', e.target.value as Form['pay_type'])}>
                    {Object.entries(PAY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              {f.pay_type !== 'fixed' && (
                <div className="field mt-4 sm:w-1/2">
                  <label className="label" htmlFor="f-incentive_max">Average incentive per month (₹)</label>
                  <input id="f-incentive_max" type="number" min={0} step={500} className="input" value={f.incentive_max} onChange={(e) => set('incentive_max', e.target.value)} />
                </div>
              )}
            </div>
            <div className="field">
              <span className="label">Benefits</span>
              <ChipSelect options={BENEFITS} value={f.benefits} onChange={(v) => set('benefits', v)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={f.fresher} onChange={(e) => set('fresher', e.target.checked)} className="size-4 accent-[var(--color-navy-600)]" /> Freshers can apply (no experience needed)
              </label>
              {!f.fresher && (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="field">
                    <label className="label" htmlFor="f-experience_min">Minimum experience (years)</label>
                    <input id="f-experience_min" type="number" min={0} max={40} className="input" value={f.experience_min} onChange={(e) => set('experience_min', e.target.value)} aria-invalid={!!errors.experience_min} />
                    {err('experience_min')}
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="f-experience_max">Maximum experience (years)</label>
                    <input id="f-experience_max" type="number" min={0} max={50} className="input" placeholder="Optional" value={f.experience_max} onChange={(e) => set('experience_max', e.target.value)} aria-invalid={!!errors.experience_max} />
                    {err('experience_max')}
                  </div>
                </div>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label className="label" htmlFor="f-education">Minimum education</label>
                <select id="f-education" className="input" value={f.education} onChange={(e) => set('education', e.target.value)}>
                  <option value="">Any</option>
                  {EDUCATION.map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="f-english_level">English</label>
                <select id="f-english_level" className="input" value={f.english_level} onChange={(e) => set('english_level', e.target.value as Form['english_level'])}>
                  {Object.entries(ENGLISH).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="f-skills">Skills</label>
              <TagInput id="f-skills" value={f.skills} onChange={(v) => set('skills', v)} max={15} />
            </div>
            <div className="field">
              <label className="label" htmlFor="f-description">Job description</label>
              <textarea id="f-description" rows={7} className="input" maxLength={5000} placeholder="What will the person do day to day? Who will they report to? What makes this a good place to work?" value={f.description} onChange={(e) => set('description', e.target.value)} aria-invalid={!!errors.description} />
              {errors.description ? err('description') : <p className="hint">{f.description.trim().length}/5000 · at least 80 characters</p>}
            </div>
            <div className="field">
              <label className="label" htmlFor="f-requirements">Requirements <span className="font-normal text-ink-4">(one per line, optional)</span></label>
              <textarea id="f-requirements" rows={4} className="input" placeholder={'ITI in Fitter or Machinist\nCan read engineering drawings'} value={f.requirements} onChange={(e) => set('requirements', e.target.value)} />
            </div>
            <div className="border-t border-line-2 pt-5">
              <p className="text-sm font-semibold">Screening questions <span className="font-normal text-ink-4">({f.screening_questions.length}/5)</span></p>
              <p className="text-[13px] text-ink-3">Candidates must answer these when applying. You see the answers next to each applicant.</p>
              {f.screening_questions.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {f.screening_questions.map((q, i) => (
                    <li key={i} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                      <span className="flex-1">{q}</span>
                      <button type="button" onClick={() => set('screening_questions', f.screening_questions.filter((_, j) => j !== i))} className="rounded p-1 text-ink-3 hover:text-brand-700" aria-label="Remove question">
                        <X size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {f.screening_questions.length < 5 && (
                <>
                  <div className="mt-3 flex gap-2">
                    <input className="input" placeholder="Write your own question" value={customQ} maxLength={200} onChange={(e) => setCustomQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (customQ.trim().length > 4) { set('screening_questions', [...f.screening_questions, customQ.trim()]); setCustomQ('') } } }} />
                    <button type="button" className="btn btn-outline shrink-0" disabled={customQ.trim().length < 5} onClick={() => { set('screening_questions', [...f.screening_questions, customQ.trim()]); setCustomQ('') }}>
                      <Plus size={15} /> Add
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {SCREENING_SUGGESTIONS.filter((q) => !f.screening_questions.includes(q)).map((q) => (
                      <button key={q} type="button" onClick={() => set('screening_questions', [...f.screening_questions, q])} className="rounded-md border border-dashed border-line px-2 py-1 text-xs text-ink-3 hover:border-ink-4 hover:text-ink">
                        + {q}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5">
            <fieldset>
              <legend className="label mb-2">How will you interview?</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  [false, 'We will call shortlisted candidates', 'You review applicants and contact the ones you like.'],
                  [true, 'Walk-in interview', 'Candidates can come to your address during the timings below.'],
                ].map(([v, t, d]) => (
                  <button key={String(v)} type="button" onClick={() => set('walk_in', v as boolean)} className={cn('rounded-xl border p-3.5 text-left', f.walk_in === v ? 'border-navy-600 bg-navy-50/60 ring-1 ring-navy-600' : 'border-line hover:border-ink-4')}>
                    <span className="block text-sm font-semibold">{t as string}</span>
                    <span className="mt-0.5 block text-xs text-ink-3">{d as string}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="field">
              <label className="label" htmlFor="f-interview_address">Interview address</label>
              <textarea id="f-interview_address" rows={2} className="input" value={f.interview_address} onChange={(e) => set('interview_address', e.target.value)} maxLength={300} aria-invalid={!!errors.interview_address} />
              {err('interview_address')}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label className="label" htmlFor="f-interview_timings">Interview timings</label>
                <input id="f-interview_timings" className="input" placeholder="Mon–Sat, 10 AM – 4 PM" value={f.interview_timings} onChange={(e) => set('interview_timings', e.target.value)} maxLength={100} />
              </div>
              <div className="field">
                <label className="label" htmlFor="f-deadline">Last date to apply <span className="font-normal text-ink-4">(optional)</span></label>
                <input id="f-deadline" type="date" className="input" min={new Date().toISOString().slice(0, 10)} value={f.deadline} onChange={(e) => set('deadline', e.target.value)} aria-invalid={!!errors.deadline} />
                {err('deadline')}
              </div>
              <div className="field">
                <label className="label" htmlFor="f-contact_name">HR contact name</label>
                <input id="f-contact_name" className="input" value={f.contact_name} onChange={(e) => set('contact_name', e.target.value)} maxLength={80} />
              </div>
              <div className="field">
                <label className="label" htmlFor="f-contact_phone">HR mobile number</label>
                <input id="f-contact_phone" className="input" inputMode="tel" value={f.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} aria-invalid={!!errors.contact_phone} />
                {errors.contact_phone ? err('contact_phone') : <p className="hint">Shown to candidates only after they apply.</p>}
              </div>
            </div>
            <div className="border-t border-line-2 pt-5">
              <label className="flex items-start gap-2.5 text-sm">
                <input type="checkbox" checked={f.joining_fee} onChange={(e) => set('joining_fee', e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-navy-600)]" />
                <span>
                  <span className="font-medium">Candidates must pay a fee or deposit</span>
                  <span className="block text-[13px] text-ink-3">For uniforms, training or a refundable deposit. Undisclosed fees lead to permanent removal.</span>
                </span>
              </label>
              {f.joining_fee && (
                <div className="mt-3 grid gap-4 sm:grid-cols-[160px_1fr]">
                  <div className="field">
                    <label className="label" htmlFor="f-joining_fee_amount">Amount (₹)</label>
                    <input id="f-joining_fee_amount" type="number" min={1} className="input" value={f.joining_fee_amount} onChange={(e) => set('joining_fee_amount', e.target.value)} aria-invalid={!!errors.joining_fee_amount} />
                    {err('joining_fee_amount')}
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="f-joining_fee_reason">What is it for?</label>
                    <input id="f-joining_fee_reason" className="input" value={f.joining_fee_reason} onChange={(e) => set('joining_fee_reason', e.target.value)} maxLength={200} aria-invalid={!!errors.joining_fee_reason} />
                    {err('joining_fee_reason')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-medium text-ink-3">Preview</p>
              <h2 className="mt-1 text-xl font-semibold">{f.title}</h2>
              <p className="text-ink-2">{f.company_name} · {area?.name}, {f.taluk}</p>
              <p className="mt-2 font-semibold">{formatSalary(Number(f.salary_min), f.salary_max ? Number(f.salary_max) : Number(f.salary_min), f.salary_period)} <span className="font-normal text-ink-3">· {PAY_TYPES[f.pay_type]}</span></p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="chip">{f.employment_type}</span>
                <span className="chip">{WORK_MODES[f.work_mode]}</span>
                <span className="chip">{SHIFTS[f.shift]}</span>
                <span className="chip">{f.fresher ? 'Freshers' : `${f.experience_min}${f.experience_max ? `–${f.experience_max}` : '+'} yrs`}</span>
                <span className="chip">{f.openings} opening{f.openings === '1' ? '' : 's'}</span>
                {f.walk_in && <span className="chip bg-amber-50 text-amber-800">Walk-in</span>}
              </div>
            </div>
            <div className="rounded-lg bg-canvas p-4 text-sm whitespace-pre-line text-ink-2">{f.description}</div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-ink-3">Category</dt><dd className="font-medium">{f.category}</dd></div>
              <div><dt className="text-xs text-ink-3">Education</dt><dd className="font-medium">{f.education || 'Any'}</dd></div>
              <div><dt className="text-xs text-ink-3">Skills</dt><dd className="font-medium">{f.skills.join(', ') || '—'}</dd></div>
              <div><dt className="text-xs text-ink-3">Benefits</dt><dd className="font-medium">{f.benefits.join(', ') || '—'}</dd></div>
              <div><dt className="text-xs text-ink-3">Screening questions</dt><dd className="font-medium">{f.screening_questions.length || 'None'}</dd></div>
              <div><dt className="text-xs text-ink-3">HR contact</dt><dd className="font-medium">{[f.contact_name, f.contact_phone].filter(Boolean).join(' · ') || '—'}</dd></div>
            </dl>
            {f.joining_fee && (
              <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" /> Fee of ₹{f.joining_fee_amount} will be shown to candidates as a warning.
              </p>
            )}
            {(!existing || existing.status === 'draft' || existing.status === 'rejected') && (
              <p className="flex gap-2 rounded-lg border border-line bg-canvas p-3 text-sm text-ink-2">
                <Info size={16} className="mt-0.5 shrink-0 text-navy-600" />
                {needsCredit
                  ? `Submitting uses 1 job credit (you have ${credits}). The job goes live after our team reviews it and stays open for ${wallet?.job_duration_days ?? 30} days.`
                  : 'Resubmitting is free. The job goes live after our team reviews it.'}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="sticky bottom-16 z-10 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white/95 p-3 shadow-card backdrop-blur lg:bottom-4">
        <button type="button" onClick={() => setStep((x) => Math.max(0, x - 1))} className="btn btn-ghost" disabled={step === 0}>
          Back
        </button>
        <div className="flex flex-wrap gap-2">
          {(!existing || ['draft', 'rejected', 'pending_review'].includes(existing.status)) && (
            <button type="button" onClick={() => persist('draft')} className="btn btn-outline" disabled={!!busy}>
              {busy === 'draft' ? <Spinner /> : existing?.status === 'pending_review' ? 'Move to drafts' : 'Save draft'}
            </button>
          )}
          {step < 3 ? (
            <button type="button" onClick={next} className="btn btn-navy">Continue</button>
          ) : existing && ['pending_review', 'published'].includes(existing.status) ? (
            <button type="button" onClick={() => persist('save')} className="btn btn-primary" disabled={!!busy}>
              {busy === 'save' ? <Spinner /> : 'Save changes'}
            </button>
          ) : (
            <button type="button" onClick={() => persist('submit')} className="btn btn-primary" disabled={!!busy}>
              {busy === 'submit' ? <Spinner /> : existing?.status === 'rejected' ? 'Resubmit for review' : 'Submit for review'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
