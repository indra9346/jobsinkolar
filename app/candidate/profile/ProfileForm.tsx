'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Briefcase, FileText, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/components/providers'
import { Modal } from '@/components/ui/modal'
import { PageHeader, Spinner } from '@/components/ui/bits'
import { ChipSelect, TagInput } from '@/components/ui/TagInput'
import { AVAILABILITY, EDUCATION, ENGLISH, LANGUAGES, MAX_UPLOAD_BYTES, TALUKS } from '@/lib/constants'
import { safeFileName } from '@/lib/storage'
import { formatDate } from '@/lib/format'
import type { Profile } from '@/lib/types'

type Exp = { id: string; title: string; company: string; start_date: string; end_date: string | null; is_current: boolean; description: string | null }

const SKILL_SUGGESTIONS = ['MS Excel', 'Tally', 'Customer service', 'CNC operation', 'Quality inspection', 'Forklift', 'Welding', 'Computer basics', 'Sales', 'Nursing', 'Teaching', 'Driving (LMV)']

function Section({ id, title, desc, children }: { id: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-24">
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        {desc && <p className="mt-0.5 text-[13px] text-ink-3">{desc}</p>}
      </div>
      <div className="grid gap-4 p-5">{children}</div>
    </section>
  )
}

export function ProfileForm({ profile, experiences, categories, welcome }: { profile: Profile; experiences: Exp[]; categories: string[]; welcome: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const { refreshProfile } = useAuth()
  const [p, setP] = useState({
    full_name: profile.full_name ?? '',
    phone: profile.phone ?? '',
    current_title: profile.current_title ?? profile.headline ?? '',
    taluk: profile.taluk ?? '',
    location: profile.location ?? '',
    bio: profile.bio ?? '',
    gender: profile.gender ?? '',
    experience_years: profile.experience_years?.toString() ?? '',
    education: profile.education ?? '',
    skills: profile.skills ?? [],
    languages: profile.languages ?? [],
    english_level: profile.english_level ?? '',
    preferred_categories: profile.preferred_categories ?? [],
    availability: profile.availability ?? '',
    expected_salary: profile.expected_salary?.toString() ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [exp, setExp] = useState<Partial<Exp> | null>(null)
  const [expBusy, setExpBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof typeof p>(k: K, v: (typeof p)[K]) => setP((s) => ({ ...s, [k]: v }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    if (p.full_name.trim().length < 2) err.full_name = 'Enter your full name'
    const digits = p.phone.replace(/\D/g, '').slice(-10)
    if (p.phone && !/^[6-9]\d{9}$/.test(digits)) err.phone = 'Enter a valid 10-digit mobile number'
    const yrs = p.experience_years === '' ? null : Number(p.experience_years)
    if (yrs !== null && (isNaN(yrs) || yrs < 0 || yrs > 50)) err.experience_years = 'Enter 0–50'
    const sal = p.expected_salary === '' ? null : Number(p.expected_salary)
    if (sal !== null && (isNaN(sal) || sal < 0 || sal > 1000000)) err.expected_salary = 'Enter a monthly amount'
    setErrors(err)
    if (Object.keys(err).length) {
      document.getElementById(Object.keys(err)[0])?.focus()
      return
    }
    setSaving(true)
    const { error } = await getSupabase()
      .from('profiles')
      .update({
        full_name: p.full_name.trim(),
        phone: p.phone ? digits : null,
        current_title: p.current_title.trim() || null,
        taluk: p.taluk || null,
        location: p.location.trim() || null,
        bio: p.bio.trim() || null,
        gender: p.gender || null,
        experience_years: yrs,
        education: p.education || null,
        skills: p.skills,
        languages: p.languages,
        english_level: p.english_level || null,
        preferred_categories: p.preferred_categories,
        availability: p.availability || null,
        expected_salary: sal,
      })
      .eq('id', profile.id)
    setSaving(false)
    if (error) return toast(error.message, 'error')
    toast('Profile saved')
    void refreshProfile()
    router.refresh()
  }

  const uploadResume = async (file: File) => {
    const ok = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!ok.includes(file.type)) return toast('Upload a PDF or Word document', 'error')
    if (file.size > MAX_UPLOAD_BYTES) return toast('File is larger than 5 MB', 'error')
    setUploading(true)
    const sb = getSupabase()
    const path = `${profile.id}/resume-${Date.now()}-${safeFileName(file.name)}`
    const up = await sb.storage.from('candidate-files').upload(path, file, { contentType: file.type })
    if (up.error) {
      setUploading(false)
      return toast(up.error.message, 'error')
    }
    const [r1, r2] = await Promise.all([
      sb.from('profiles').update({ resume_path: path }).eq('id', profile.id),
      sb.from('candidate_documents').insert({ candidate_id: profile.id, kind: 'resume', file_path: path, file_name: file.name, size_bytes: file.size }),
    ])
    if (r1.error || r2.error) {
      await sb.storage.from('candidate-files').remove([path])
      setUploading(false)
      return toast((r1.error ?? r2.error)!.message, 'error')
    }
    // The previous resume file is kept: past applications still reference it.
    setUploading(false)
    toast('Resume uploaded')
    void refreshProfile()
    router.refresh()
  }

  const viewResume = async () => {
    if (!profile.resume_path) return
    const { data, error } = await getSupabase().storage.from('candidate-files').createSignedUrl(profile.resume_path, 120)
    if (error) return toast(error.message, 'error')
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  const saveExp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!exp) return
    if (!exp.title?.trim() || !exp.company?.trim() || !exp.start_date) return toast('Role, company and start date are required', 'error')
    if (!exp.is_current && exp.end_date && exp.end_date < exp.start_date) return toast('End date must be after the start date', 'error')
    setExpBusy(true)
    const row = {
      title: exp.title.trim(),
      company: exp.company.trim(),
      start_date: exp.start_date,
      end_date: exp.is_current ? null : exp.end_date || null,
      is_current: Boolean(exp.is_current),
      description: exp.description?.trim() || null,
    }
    const sb = getSupabase()
    const { error } = exp.id ? await sb.from('candidate_experiences').update(row).eq('id', exp.id) : await sb.from('candidate_experiences').insert({ ...row, candidate_id: profile.id })
    setExpBusy(false)
    if (error) return toast(error.message, 'error')
    setExp(null)
    toast(exp.id ? 'Experience updated' : 'Experience added')
    router.refresh()
  }

  const deleteExp = async (id: string) => {
    if (!confirm('Delete this experience?')) return
    const { error } = await getSupabase().from('candidate_experiences').delete().eq('id', id)
    if (error) return toast(error.message, 'error')
    toast('Experience removed')
    router.refresh()
  }

  const fieldErr = (k: string) => errors[k] && <p className="error-text">{errors[k]}</p>

  return (
    <>
      <PageHeader title="Your profile" description="Employers see this when you apply and in the candidate database." />
      {welcome && (
        <div className="mb-5 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Welcome to Jobs in Kolar. A complete profile with a resume gets far more replies. It takes about five minutes.
        </div>
      )}
      <form onSubmit={save} className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-5">
          <Section id="basics" title="Basic details">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label className="label" htmlFor="full_name">Full name</label>
                <input id="full_name" className="input" value={p.full_name} onChange={(e) => set('full_name', e.target.value)} aria-invalid={!!errors.full_name} />
                {fieldErr('full_name')}
              </div>
              <div className="field">
                <label className="label" htmlFor="phone">Mobile number</label>
                <input id="phone" className="input" inputMode="tel" value={p.phone} onChange={(e) => set('phone', e.target.value)} aria-invalid={!!errors.phone} />
                {fieldErr('phone')}
              </div>
              <div className="field sm:col-span-2">
                <label className="label" htmlFor="current_title">Current or desired role</label>
                <input id="current_title" className="input" placeholder="e.g. CNC Operator, Staff Nurse, Accountant" value={p.current_title} onChange={(e) => set('current_title', e.target.value)} maxLength={80} />
              </div>
              <div className="field">
                <label className="label" htmlFor="taluk">Taluk</label>
                <select id="taluk" className="input" value={p.taluk} onChange={(e) => set('taluk', e.target.value)}>
                  <option value="">Outside Kolar district</option>
                  {TALUKS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="location">Town / locality</label>
                <input id="location" className="input" placeholder="e.g. Robertsonpet" value={p.location} onChange={(e) => set('location', e.target.value)} maxLength={80} />
              </div>
              <div className="field">
                <label className="label" htmlFor="gender">Gender <span className="font-normal text-ink-4">(optional)</span></label>
                <select id="gender" className="input" value={p.gender} onChange={(e) => set('gender', e.target.value as typeof p.gender)}>
                  <option value="">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="bio">Summary</label>
              <textarea id="bio" className="input" rows={4} maxLength={1000} placeholder="Two or three lines about your experience and what you are looking for." value={p.bio} onChange={(e) => set('bio', e.target.value)} />
              <p className="hint">{p.bio.length}/1000</p>
            </div>
          </Section>

          <Section id="work" title="Experience and skills">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="field">
                <label className="label" htmlFor="experience_years">Total experience (years)</label>
                <input id="experience_years" className="input" type="number" min={0} max={50} placeholder="0 for fresher" value={p.experience_years} onChange={(e) => set('experience_years', e.target.value)} aria-invalid={!!errors.experience_years} />
                {fieldErr('experience_years')}
              </div>
              <div className="field">
                <label className="label" htmlFor="education">Highest education</label>
                <select id="education" className="input" value={p.education} onChange={(e) => set('education', e.target.value)}>
                  <option value="">Select</option>
                  {EDUCATION.map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="english_level">English</label>
                <select id="english_level" className="input" value={p.english_level} onChange={(e) => set('english_level', e.target.value as typeof p.english_level)}>
                  <option value="">Select</option>
                  {Object.entries(ENGLISH).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="skills">Skills</label>
              <TagInput id="skills" value={p.skills} onChange={(v) => set('skills', v)} suggestions={SKILL_SUGGESTIONS} />
            </div>
            <div className="field">
              <span className="label">Languages you speak</span>
              <ChipSelect options={LANGUAGES} value={p.languages} onChange={(v) => set('languages', v)} />
            </div>

            <div className="border-t border-line-2 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Work history</p>
                <button type="button" onClick={() => setExp({ is_current: false })} className="btn btn-outline btn-sm">
                  <Plus size={15} /> Add
                </button>
              </div>
              {experiences.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-ink-3">No work history yet. Freshers can skip this.</p>
              ) : (
                <ul className="divide-y divide-line-2 rounded-lg border border-line">
                  {experiences.map((x) => (
                    <li key={x.id} className="flex gap-3 p-3.5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-canvas text-ink-3"><Briefcase size={17} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{x.title}</p>
                        <p className="text-sm text-ink-3">{x.company} · {formatDate(x.start_date)} – {x.is_current ? 'Present' : formatDate(x.end_date)}</p>
                        {x.description && <p className="mt-1 line-clamp-2 text-sm text-ink-2">{x.description}</p>}
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => setExp(x)} className="rounded-md p-1.5 text-ink-3 hover:bg-canvas hover:text-ink" aria-label="Edit"><Pencil size={15} /></button>
                        <button type="button" onClick={() => deleteExp(x.id)} className="rounded-md p-1.5 text-ink-3 hover:bg-canvas hover:text-brand-700" aria-label="Delete"><Trash2 size={15} /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Section>

          <Section id="prefs" title="Job preferences" desc="Used for recommendations, job alerts and employer searches.">
            <div className="field">
              <span className="label">Categories you are interested in</span>
              <ChipSelect options={categories} value={p.preferred_categories} onChange={(v) => set('preferred_categories', v)} max={5} />
              <p className="hint">Pick up to 5.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label className="label" htmlFor="availability">Can join</label>
                <select id="availability" className="input" value={p.availability} onChange={(e) => set('availability', e.target.value as typeof p.availability)}>
                  <option value="">Select</option>
                  {Object.entries(AVAILABILITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="expected_salary">Expected monthly salary (₹)</label>
                <input id="expected_salary" className="input" type="number" min={0} step={500} value={p.expected_salary} onChange={(e) => set('expected_salary', e.target.value)} aria-invalid={!!errors.expected_salary} />
                {fieldErr('expected_salary')}
              </div>
            </div>
          </Section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section id="resume" className="card scroll-mt-24 p-5">
            <p className="font-semibold">Resume</p>
            {profile.resume_path ? (
              <button type="button" onClick={viewResume} className="mt-3 flex w-full items-center gap-3 rounded-lg border border-line p-3 text-left hover:bg-canvas">
                <FileText size={20} className="text-navy-600" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{profile.resume_path.split('/').pop()?.replace(/^resume-\d+-/, '')}</span>
              </button>
            ) : (
              <p className="mt-1 text-sm text-ink-3">PDF or Word, up to 5 MB. It is attached to every application.</p>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => e.target.files?.[0] && uploadResume(e.target.files[0])} />
            <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-outline mt-3 w-full" disabled={uploading}>
              {uploading ? <Spinner /> : <><Upload size={15} /> {profile.resume_path ? 'Replace resume' : 'Upload resume'}</>}
            </button>
          </section>
          <div className="card p-5">
            <button className="btn btn-navy w-full" disabled={saving}>{saving ? <Spinner /> : 'Save profile'}</button>
            <p className="mt-2 text-center text-xs text-ink-3">Changes apply to future applications.</p>
          </div>
        </aside>
      </form>

      <Modal
        open={Boolean(exp)}
        onClose={() => setExp(null)}
        title={exp?.id ? 'Edit experience' : 'Add experience'}
        footer={
          <>
            <button onClick={() => setExp(null)} className="btn btn-outline">Cancel</button>
            <button form="exp-form" className="btn btn-navy" disabled={expBusy}>{expBusy ? <Spinner /> : 'Save'}</button>
          </>
        }
      >
        {exp && (
          <form id="exp-form" onSubmit={saveExp} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label className="label" htmlFor="x-title">Role</label>
                <input id="x-title" className="input" value={exp.title ?? ''} onChange={(e) => setExp({ ...exp, title: e.target.value })} required maxLength={120} />
              </div>
              <div className="field">
                <label className="label" htmlFor="x-company">Company</label>
                <input id="x-company" className="input" value={exp.company ?? ''} onChange={(e) => setExp({ ...exp, company: e.target.value })} required maxLength={120} />
              </div>
              <div className="field">
                <label className="label" htmlFor="x-start">Start date</label>
                <input id="x-start" type="date" className="input" value={exp.start_date ?? ''} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setExp({ ...exp, start_date: e.target.value })} required />
              </div>
              <div className="field">
                <label className="label" htmlFor="x-end">End date</label>
                <input id="x-end" type="date" className="input" value={exp.end_date ?? ''} disabled={exp.is_current} min={exp.start_date} onChange={(e) => setExp({ ...exp, end_date: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(exp.is_current)} onChange={(e) => setExp({ ...exp, is_current: e.target.checked })} className="size-4 accent-[var(--color-navy-600)]" />
              I currently work here
            </label>
            <div className="field">
              <label className="label" htmlFor="x-desc">What did you do?</label>
              <textarea id="x-desc" className="input" rows={3} maxLength={2000} value={exp.description ?? ''} onChange={(e) => setExp({ ...exp, description: e.target.value })} />
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
