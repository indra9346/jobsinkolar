import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarClock, MapPin, MessageSquare, Phone, Video } from 'lucide-react'
import { requireRole } from '@/lib/session'
import { PageHeader } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { Timeline } from '@/components/portal/Timeline'
import { WithdrawButton } from './WithdrawButton'
import { APP_STATUS, INTERVIEW_MODE } from '@/lib/constants'
import { formatDate, formatSalary } from '@/lib/format'
import type { Application } from '@/lib/types'

export const metadata = { title: 'Application' }

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sb } = await requireRole('candidate')
  const { data } = await sb
    .from('applications')
    .select('*,jobs(id,title,company_name,location,salary_min,salary_max,salary_period,status,contact_phone,contact_name,walk_in,interview_address,interview_timings)')
    .eq('id', id)
    .maybeSingle()
  if (!data) notFound()
  const a = data as Application & { jobs: Application['jobs'] & { contact_phone: string | null; contact_name: string | null; walk_in: boolean; interview_address: string | null; interview_timings: string | null } }
  const [{ data: events }, { count: msgCount }] = await Promise.all([
    sb.from('application_events').select('id,from_status,to_status,note,created_at').eq('application_id', id).order('created_at'),
    sb.from('messages').select('id', { count: 'exact', head: true }).eq('application_id', id),
  ])
  const st = APP_STATUS[a.status]
  const ModeIcon = a.interview_mode === 'video' ? Video : a.interview_mode === 'phone' ? Phone : MapPin
  const canWithdraw = !['hired', 'withdrawn', 'rejected'].includes(a.status)
  const canMessage = (msgCount ?? 0) > 0 || ['shortlisted', 'interview', 'offered', 'hired'].includes(a.status)

  return (
    <>
      <PageHeader
        back={{ href: '/candidate/applications', label: 'My applications' }}
        title={a.jobs?.title ?? 'Application'}
        description={`${a.jobs?.company_name ?? ''} · ${a.jobs?.location ?? ''}`}
        actions={<StatusPill tone={st.tone} className="h-7 px-3 text-[13px]">{st.label}</StatusPill>}
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {a.status === 'interview' && a.interview_at && (
            <section className="card border-violet-200 bg-violet-50/50 p-5">
              <h2 className="flex items-center gap-2 font-semibold"><CalendarClock size={18} className="text-violet-700" /> Interview scheduled</h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-ink-3">When</dt><dd className="font-medium">{formatDate(a.interview_at, true)}</dd></div>
                <div><dt className="text-xs text-ink-3">Mode</dt><dd className="flex items-center gap-1.5 font-medium"><ModeIcon size={15} /> {a.interview_mode ? INTERVIEW_MODE[a.interview_mode] : '—'}</dd></div>
                {a.interview_location && <div className="sm:col-span-2"><dt className="text-xs text-ink-3">Where / link</dt><dd className="font-medium break-words">{a.interview_location}</dd></div>}
                {a.interview_note && <div className="sm:col-span-2"><dt className="text-xs text-ink-3">Note from employer</dt><dd>{a.interview_note}</dd></div>}
              </dl>
            </section>
          )}
          {a.status === 'offered' && (
            <section className="card border-emerald-200 bg-emerald-50/60 p-5 text-sm text-emerald-900">
              <p className="font-semibold">You have an offer</p>
              <p className="mt-1">The employer will share the offer letter and joining details. Message them below if you have questions.</p>
            </section>
          )}
          <section className="card p-5">
            <h2 className="font-semibold">Progress</h2>
            <Timeline status={a.status} events={events ?? []} />
          </section>
          {(a.screening_answers?.length > 0 || a.cover_letter) && (
            <section className="card p-5">
              <h2 className="font-semibold">What you sent</h2>
              {a.screening_answers?.map((s, i) => (
                <div key={i} className="mt-3 text-sm">
                  <p className="text-ink-3">{s.question}</p>
                  <p className="font-medium">{s.answer}</p>
                </div>
              ))}
              {a.cover_letter && (
                <div className="mt-3 text-sm">
                  <p className="text-ink-3">Message</p>
                  <p className="whitespace-pre-line">{a.cover_letter}</p>
                </div>
              )}
            </section>
          )}
        </div>
        <aside className="space-y-4">
          <section className="card p-5 text-sm">
            <p className="font-semibold">Job</p>
            <p className="mt-2 text-ink-2">{formatSalary(a.jobs?.salary_min, a.jobs?.salary_max, a.jobs?.salary_period)}</p>
            <p className="text-ink-3">Applied {formatDate(a.created_at)}</p>
            {a.viewed_at && <p className="text-ink-3">Viewed by employer {formatDate(a.viewed_at)}</p>}
            {a.jobs?.status === 'published' && <Link href={`/jobs/${a.job_id}`} className="link mt-3 inline-block">View job post</Link>}
            {a.status !== 'withdrawn' && (a.jobs?.contact_phone || a.jobs?.walk_in) && (
              <div className="mt-4 rounded-lg bg-canvas p-3">
                <p className="font-medium">HR contact</p>
                {a.jobs.contact_name && <p className="text-ink-2">{a.jobs.contact_name}</p>}
                {a.jobs.contact_phone && <a href={`tel:${a.jobs.contact_phone}`} className="font-medium text-navy-700">{a.jobs.contact_phone}</a>}
                {a.jobs.walk_in && a.jobs.interview_address && <p className="mt-1 text-ink-3">Walk-in: {a.jobs.interview_address}{a.jobs.interview_timings ? ` · ${a.jobs.interview_timings}` : ''}</p>}
              </div>
            )}
          </section>
          <section className="card p-5 text-sm">
            <p className="font-semibold">Messages</p>
            {canMessage ? (
              <Link href={`/candidate/messages?thread=${a.id}`} className="btn btn-outline mt-3 w-full"><MessageSquare size={15} /> Open conversation</Link>
            ) : (
              <p className="mt-1 text-ink-3">You can message the employer once they shortlist you or write to you first.</p>
            )}
          </section>
          {canWithdraw && <WithdrawButton id={a.id} />}
        </aside>
      </div>
    </>
  )
}
