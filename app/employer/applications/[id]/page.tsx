import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Briefcase, GraduationCap, Languages, MapPin, Wallet } from 'lucide-react'
import { requireRole } from '@/lib/session'
import { Avatar, PageHeader } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { Timeline } from '@/components/portal/Timeline'
import { CandidateFiles } from '@/components/portal/CandidateFiles'
import { ApplicationControls } from './ApplicationControls'
import { NotesPanel } from './NotesPanel'
import { APP_STATUS, AVAILABILITY } from '@/lib/constants'
import { formatDate, formatINR, timeAgo } from '@/lib/format'
import type { Application } from '@/lib/types'

export const metadata = { title: 'Applicant' }

export type CandidateCard = {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  headline: string | null
  bio: string | null
  skills: string[]
  languages: string[]
  experience_years: number | null
  education: string | null
  expected_salary: number | null
  availability: keyof typeof AVAILABILITY | null
  taluk: string | null
  location: string | null
  resume_path: string | null
  unlocked: boolean
  last_active_at: string
  experiences: { id: string; title: string; company: string; start_date: string; end_date: string | null; is_current: boolean; description: string | null }[]
  documents: { id: string; kind: string; file_name: string; file_path: string; status: string }[]
}

export default async function ApplicantDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sb, user } = await requireRole('employer')
  const { data } = await sb.from('applications').select('*,jobs(id,title,location,company_name)').eq('id', id).eq('employer_id', user.id).maybeSingle()
  if (!data) notFound()
  let app = data as Application
  if (!app.viewed_at) {
    const { data: upd } = await sb.from('applications').update({ viewed_at: new Date().toISOString() }).eq('id', id).select('*,jobs(id,title,location,company_name)').single()
    if (upd) app = upd as Application
  }
  const [{ data: card }, { data: events }, { data: notes }] = await Promise.all([
    sb.rpc('candidate_card', { p_candidate: app.candidate_id }),
    sb.from('application_events').select('id,from_status,to_status,note,created_at').eq('application_id', id).order('created_at'),
    sb.from('application_notes').select('id,body,created_at,author_id').eq('application_id', id).order('created_at', { ascending: false }),
  ])
  const c = (card ?? {}) as CandidateCard
  const name = c.full_name || app.candidate_snapshot?.full_name || 'Candidate'
  const resumePath = app.resume_path ?? c.resume_path

  return (
    <>
      <PageHeader back={{ href: `/employer/jobs/${app.job_id}`, label: app.jobs?.title ?? 'Job' }} title={name} description={`Applied ${formatDate(app.created_at)} for ${app.jobs?.title ?? 'a job'}`} actions={<StatusPill tone={APP_STATUS[app.status].tone} className="h-8 px-3 text-[13px]">{APP_STATUS[app.status].label}</StatusPill>} />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="card p-5">
            <div className="flex items-start gap-4">
              <Avatar name={name} size={56} />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold">{name}</p>
                <p className="text-ink-2">{c.headline ?? app.candidate_snapshot?.headline ?? '—'}</p>
                <p className="mt-1 text-xs text-ink-3">Active {timeAgo(c.last_active_at ?? app.created_at)}</p>
              </div>
            </div>
            <dl className="mt-5 grid gap-4 border-t border-line-2 pt-4 text-sm sm:grid-cols-2">
              {(
                [
                  [Briefcase, 'Experience', c.experience_years !== null && c.experience_years !== undefined ? (c.experience_years === 0 ? 'Fresher' : `${c.experience_years} years`) : '—'],
                  [GraduationCap, 'Education', c.education ?? '—'],
                  [MapPin, 'Location', [c.location, c.taluk].filter(Boolean).join(', ') || '—'],
                  [Wallet, 'Expected salary', c.expected_salary ? `${formatINR(c.expected_salary)}/month` : '—'],
                  [Languages, 'Languages', c.languages?.join(', ') || '—'],
                  [Briefcase, 'Can join', c.availability ? AVAILABILITY[c.availability] : '—'],
                ] as const
              ).map(([Icon, k, v]) => (
                <div key={k} className="flex gap-2.5">
                  <Icon size={16} className="mt-0.5 shrink-0 text-ink-4" />
                  <div><dt className="text-xs text-ink-3">{k}</dt><dd className="font-medium">{v}</dd></div>
                </div>
              ))}
            </dl>
            {c.skills?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line-2 pt-4">
                {c.skills.map((s) => <span key={s} className="chip">{s}</span>)}
              </div>
            )}
            {c.bio && <p className="mt-4 border-t border-line-2 pt-4 text-sm leading-relaxed whitespace-pre-line text-ink-2">{c.bio}</p>}
          </section>

          {(app.screening_answers?.length > 0 || app.cover_letter) && (
            <section className="card p-5">
              <h2 className="font-semibold">Application answers</h2>
              <dl className="mt-3 space-y-3 text-sm">
                {app.screening_answers?.map((s, i) => (
                  <div key={i}><dt className="text-ink-3">{s.question}</dt><dd className="font-medium">{s.answer}</dd></div>
                ))}
                {app.cover_letter && <div><dt className="text-ink-3">Message from candidate</dt><dd className="whitespace-pre-line">{app.cover_letter}</dd></div>}
              </dl>
            </section>
          )}

          {c.experiences?.length > 0 && (
            <section className="card p-5">
              <h2 className="font-semibold">Work history</h2>
              <ul className="mt-3 space-y-4">
                {c.experiences.map((x) => (
                  <li key={x.id} className="text-sm">
                    <p className="font-medium">{x.title} · {x.company}</p>
                    <p className="text-xs text-ink-3">{formatDate(x.start_date)} – {x.is_current ? 'Present' : formatDate(x.end_date)}</p>
                    {x.description && <p className="mt-1 text-ink-2">{x.description}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <CandidateFiles resumePath={resumePath} documents={c.documents ?? []} />

          <section className="card p-5">
            <h2 className="font-semibold">Activity</h2>
            <Timeline status={app.status} events={events ?? []} />
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <ApplicationControls app={{ id: app.id, status: app.status, interview_at: app.interview_at, interview_mode: app.interview_mode, interview_location: app.interview_location, interview_note: app.interview_note }} phone={c.phone} email={c.email} name={name} jobTitle={app.jobs?.title ?? ''} company={app.jobs?.company_name ?? ''} />
          <NotesPanel applicationId={app.id} userId={user.id} notes={notes ?? []} />
          <Link href={`/employer/messages?thread=${app.id}`} className="btn btn-outline w-full">Message candidate</Link>
        </aside>
      </div>
    </>
  )
}
