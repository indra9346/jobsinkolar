'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AlertTriangle, BadgeCheck, ChevronDown, ExternalLink, Star } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Modal } from '@/components/ui/modal'
import { EmptyState, PageHeader, Spinner } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { ApplicantSearch } from '@/components/portal/ApplicantSearch'
import { JOB_STATUS, PAY_TYPES, SHIFTS, WORK_MODES } from '@/lib/constants'
import { cn, formatDate, formatSalary, timeAgo } from '@/lib/format'
import type { Job } from '@/lib/types'

type Row = Job & { companies: { name: string; slug: string; verified: boolean; industry: string | null; website: string | null } | null }

const REASONS = [
  'Salary is missing or unrealistic for this role.',
  'Description is too short or unclear. Add duties, timings and requirements.',
  'Job title does not match the description.',
  'Contact details or links are not allowed in the description.',
  'The fee charged to candidates is not acceptable.',
  'Duplicate of an existing live job.',
]

const TABS = [
  ['pending', 'Pending review'],
  ['live', 'Live'],
  ['rejected', 'Changes requested'],
  ['closed', 'Closed'],
  ['all', 'All'],
] as const

export function ModerationQueue({ jobs, tab, counts, focus, q }: { jobs: Row[]; tab: string; counts: Record<string, number>; focus: string | null; q: string }) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState<string | null>(focus ?? (tab === 'pending' ? jobs[0]?.id ?? null : null))
  const [busy, setBusy] = useState<string | null>(null)
  const [reject, setReject] = useState<Row | null>(null)
  const [reason, setReason] = useState('')

  const update = async (id: string, patch: Partial<Job>, msg: string) => {
    setBusy(id)
    const { error } = await getSupabase().from('jobs').update(patch).eq('id', id)
    setBusy(null)
    if (error) return toast(error.message, 'error')
    toast(msg)
    const idx = jobs.findIndex((j) => j.id === id)
    if (tab === 'pending') setOpen(jobs[idx + 1]?.id ?? null)
    router.refresh()
  }

  const submitReject = async () => {
    if (!reject || reason.trim().length < 10) return toast('Write a clear reason (at least 10 characters)', 'error')
    await update(reject.id, { status: 'rejected', rejection_reason: reason.trim() }, 'Sent back to employer with your note')
    setReject(null)
    setReason('')
  }

  return (
    <>
      <PageHeader title="Job moderation" description="Every job is reviewed before it goes live. Approve, request changes or close." actions={<ApplicantSearch initial={q} placeholder="Search title or company" kind="job" />} />
      <div className="-mx-4 mb-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-1 border-b border-line">
          {TABS.map(([k, l]) => (
            <Link key={k} href={`/admin/jobs?tab=${k}`} className={cn('-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium', tab === k ? 'border-navy-600 text-ink' : 'border-transparent text-ink-3 hover:text-ink')}>
              {l} <span className={cn('rounded px-1.5 text-xs tabular-nums', k === 'pending' && counts[k] ? 'bg-brand-50 text-brand-700' : 'bg-canvas text-ink-3')}>{counts[k] ?? 0}</span>
            </Link>
          ))}
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="card"><EmptyState title={tab === 'pending' ? 'Queue is empty' : 'No jobs here'} body={tab === 'pending' ? 'New submissions will appear here.' : undefined} /></div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((j) => {
            const isOpen = open === j.id
            const expired = j.status === 'published' && j.expires_at && new Date(j.expires_at) <= new Date()
            return (
              <li key={j.id} className={cn('card overflow-hidden', isOpen && 'border-ink-4')}>
                <button onClick={() => setOpen(isOpen ? null : j.id)} className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-canvas/60" aria-expanded={isOpen}>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-medium">
                      <span className="truncate">{j.title}</span>
                      {j.featured && <Star size={14} className="shrink-0 fill-amber-400 text-amber-500" />}
                      {j.joining_fee && <AlertTriangle size={14} className="shrink-0 text-amber-600" aria-label="Charges a fee" />}
                    </p>
                    <p className="flex items-center gap-1 truncate text-sm text-ink-3">
                      {j.companies?.name ?? j.company_name}
                      {j.companies?.verified && <BadgeCheck size={14} className="text-navy-500" />}
                      <span>· {j.location}{j.taluk ? `, ${j.taluk}` : ''} · {j.status === 'pending_review' ? `submitted ${j.submitted_at ? timeAgo(j.submitted_at) : ''}` : `updated ${timeAgo(j.updated_at)}`}</span>
                    </p>
                  </div>
                  <StatusPill tone={expired ? 'gray' : JOB_STATUS[j.status].tone}>{expired ? 'Expired' : JOB_STATUS[j.status].label}</StatusPill>
                  <ChevronDown size={18} className={cn('shrink-0 text-ink-4 transition-transform', isOpen && 'rotate-180')} />
                </button>
                {isOpen && (
                  <div className="border-t border-line px-5 py-5">
                    <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
                      <div className="space-y-4 text-sm">
                        <dl className="grid gap-3 sm:grid-cols-3">
                          <div><dt className="text-xs text-ink-3">Salary</dt><dd className="font-medium">{formatSalary(j.salary_min, j.salary_max, j.salary_period)} · {PAY_TYPES[j.pay_type]}</dd></div>
                          <div><dt className="text-xs text-ink-3">Type</dt><dd className="font-medium">{j.employment_type} · {WORK_MODES[j.work_mode]} · {SHIFTS[j.shift]}</dd></div>
                          <div><dt className="text-xs text-ink-3">Category / openings</dt><dd className="font-medium">{j.category} · {j.openings}</dd></div>
                          <div><dt className="text-xs text-ink-3">Experience</dt><dd className="font-medium">{j.experience_min}{j.experience_max ? `–${j.experience_max}` : '+'} yrs</dd></div>
                          <div><dt className="text-xs text-ink-3">Education</dt><dd className="font-medium">{j.education || 'Any'}</dd></div>
                          <div><dt className="text-xs text-ink-3">Interview</dt><dd className="font-medium">{j.walk_in ? 'Walk-in' : 'Employer calls'}{j.contact_phone ? ` · ${j.contact_phone}` : ''}</dd></div>
                        </dl>
                        {j.joining_fee && (
                          <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> Declares a fee of ₹{j.joining_fee_amount}: {j.joining_fee_reason}
                          </p>
                        )}
                        <div className="rounded-lg bg-canvas p-4 whitespace-pre-line text-ink-2">{j.description}</div>
                        {j.requirements?.length > 0 && <ul className="list-disc pl-5 text-ink-2">{j.requirements.map((r) => <li key={r}>{r}</li>)}</ul>}
                        {j.screening_questions?.length > 0 && <p className="text-ink-3">Screening: {j.screening_questions.join(' · ')}</p>}
                        {j.rejection_reason && j.status === 'rejected' && <p className="text-brand-700">Last note: {j.rejection_reason}</p>}
                      </div>
                      <div className="space-y-2">
                        {j.status === 'pending_review' && (
                          <>
                            <button onClick={() => update(j.id, { status: 'published' }, 'Approved and live')} disabled={busy === j.id} className="btn btn-navy w-full">{busy === j.id ? <Spinner /> : 'Approve and publish'}</button>
                            <button onClick={() => { setReject(j); setReason('') }} className="btn btn-outline w-full">Request changes</button>
                          </>
                        )}
                        {j.status === 'published' && (
                          <>
                            <button onClick={() => update(j.id, { featured: !j.featured }, j.featured ? 'Removed from featured' : 'Marked as featured')} disabled={busy === j.id} className="btn btn-outline w-full"><Star size={15} /> {j.featured ? 'Unfeature' : 'Feature'}</button>
                            <button onClick={() => confirm('Close this job? The employer will be notified.') && update(j.id, { status: 'closed' }, 'Job closed')} disabled={busy === j.id} className="btn btn-danger w-full">Close job</button>
                          </>
                        )}
                        {j.status === 'rejected' && <p className="text-sm text-ink-3">Waiting for the employer to edit and resubmit.</p>}
                        {j.status === 'closed' && <button onClick={() => update(j.id, { status: 'published' }, 'Republished')} className="btn btn-outline w-full">Republish</button>}
                        <div className="rounded-lg border border-line p-3 text-xs text-ink-3">
                          <p>Company: {j.companies?.verified ? 'verified' : 'not verified'}{j.companies?.industry ? ` · ${j.companies.industry}` : ''}</p>
                          <p>Created {formatDate(j.created_at, true)}</p>
                          {j.published_at && <p>Published {formatDate(j.published_at)}{j.expires_at ? ` · expires ${formatDate(j.expires_at)}` : ''}</p>}
                          <p>{j.applications_count} applications · {j.views} views</p>
                          <div className="mt-2 flex flex-wrap gap-3">
                            <Link href={`/admin/employers?focus=${j.employer_id}`} className="link">Employer</Link>
                            {j.status === 'published' && <Link href={`/jobs/${j.id}`} target="_blank" className="link inline-flex items-center gap-0.5">Public page <ExternalLink size={11} /></Link>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Modal open={Boolean(reject)} onClose={() => setReject(null)} title="Request changes" description={reject?.title} footer={<><button onClick={() => setReject(null)} className="btn btn-outline">Cancel</button><button onClick={submitReject} className="btn btn-primary" disabled={busy === reject?.id}>{busy === reject?.id ? <Spinner /> : 'Send to employer'}</button></>}>
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-1.5">
            {REASONS.map((r) => (
              <button key={r} type="button" onClick={() => setReason((x) => (x ? `${x} ${r}` : r))} className="rounded-md border border-line px-2 py-1 text-left text-xs text-ink-2 hover:border-ink-4">{r}</button>
            ))}
          </div>
          <div className="field">
            <label className="label" htmlFor="rej">Note to the employer</label>
            <textarea id="rej" className="input" rows={4} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
            <p className="hint">The employer sees this note and can resubmit for free.</p>
          </div>
        </div>
      </Modal>
    </>
  )
}
