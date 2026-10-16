import Link from 'next/link'
import { ArrowRight, CalendarClock, CheckCircle2, Circle } from 'lucide-react'
import { requireRole } from '@/lib/session'
import { profileScore } from '@/lib/profile-score'
import { ProgressRing } from '@/components/portal/ProgressRing'
import { Stat, EmptyState } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { JobCard } from '@/components/jobs/JobCard'
import { APP_STATUS, INTERVIEW_MODE } from '@/lib/constants'
import { JOB_CARD_COLUMNS } from '@/lib/queries'
import { formatDate, timeAgo } from '@/lib/format'
import type { Application, Job } from '@/lib/types'

export const metadata = { title: 'Overview' }

export default async function CandidateHome() {
  const { sb, profile } = await requireRole('candidate')
  const now = new Date().toISOString()

  const [apps, saved, docs, unlocks] = await Promise.all([
    sb.from('applications').select('id,status,created_at,interview_at,interview_mode,interview_location,job_id,jobs(id,title,company_name,location)').order('updated_at', { ascending: false }),
    sb.from('saved_jobs').select('job_id', { count: 'exact', head: true }),
    sb.from('candidate_documents').select('status,kind'),
    sb.from('notifications').select('id', { count: 'exact', head: true }).eq('kind', 'system').ilike('title', '%viewed your profile%'),
  ])
  const applications = (apps.data ?? []) as unknown as Application[]
  const appliedIds = new Set(applications.map((a) => a.job_id))

  let recQ = sb.from('jobs').select(JOB_CARD_COLUMNS).eq('status', 'published').or(`expires_at.is.null,expires_at.gt.${now}`)
  if (profile.preferred_categories?.length) recQ = recQ.in('category', profile.preferred_categories)
  else if (profile.taluk) recQ = recQ.eq('taluk', profile.taluk)
  const { data: recData } = await recQ.order('published_at', { ascending: false }).limit(12)
  let recommended = ((recData ?? []) as unknown as Job[]).filter((j) => !appliedIds.has(j.id)).slice(0, 4)
  if (recommended.length < 2) {
    const { data } = await sb.from('jobs').select(JOB_CARD_COLUMNS).eq('status', 'published').order('published_at', { ascending: false }).limit(8)
    recommended = ((data ?? []) as unknown as Job[]).filter((j) => !appliedIds.has(j.id)).slice(0, 4)
  }

  const { score, checks } = profileScore(profile, docs.data ?? [])
  const active = applications.filter((a) => !['rejected', 'withdrawn', 'hired'].includes(a.status))
  const progressed = applications.filter((a) => ['shortlisted', 'interview', 'offered', 'hired'].includes(a.status))
  const interviews = applications
    .filter((a) => a.status === 'interview' && a.interview_at && a.interview_at > now)
    .sort((a, b) => a.interview_at!.localeCompare(b.interview_at!))

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold sm:text-2xl">Hello{profile.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}</h1>
        <p className="mt-1 text-sm text-ink-3">Here&apos;s where your job search stands today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Applications" value={applications.length} sub={`${active.length} active`} href="/candidate/applications" />
        <Stat label="Shortlisted or better" value={progressed.length} href="/candidate/applications?tab=progress" />
        <Stat label="Saved jobs" value={saved.count ?? 0} href="/candidate/saved" />
        <Stat label="Employer profile views" value={unlocks.count ?? 0} sub="From the candidate database" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {interviews.length > 0 && (
            <section className="card border-violet-200 bg-violet-50/40 p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <CalendarClock size={18} className="text-violet-700" /> Upcoming interviews
              </h2>
              <ul className="mt-3 divide-y divide-violet-100">
                {interviews.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-medium">{a.jobs?.title}</p>
                      <p className="text-sm text-ink-3">
                        {a.jobs?.company_name} · {formatDate(a.interview_at, true)} · {a.interview_mode ? INTERVIEW_MODE[a.interview_mode] : ''}
                        {a.interview_location ? ` · ${a.interview_location}` : ''}
                      </p>
                    </div>
                    <Link href={`/candidate/applications/${a.id}`} className="btn btn-outline btn-sm">Details</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold">Recent applications</h2>
              <Link href="/candidate/applications" className="text-[13px] link">View all</Link>
            </div>
            {applications.length === 0 ? (
              <EmptyState title="No applications yet" body="Find a job you like and apply in one tap." action={<Link href="/jobs" className="btn btn-primary">Browse jobs</Link>} />
            ) : (
              <ul className="divide-y divide-line-2">
                {applications.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <Link href={`/candidate/applications/${a.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-canvas">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{a.jobs?.title ?? 'Job removed'}</p>
                        <p className="truncate text-sm text-ink-3">{a.jobs?.company_name} · Applied {timeAgo(a.created_at)}</p>
                      </div>
                      <StatusPill tone={APP_STATUS[a.status].tone}>{APP_STATUS[a.status].label}</StatusPill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Recommended for you</h2>
              <Link href="/jobs" className="text-[13px] link">Browse all</Link>
            </div>
            {recommended.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {recommended.map((j) => (
                  <JobCard key={j.id} job={j} compact />
                ))}
              </div>
            ) : (
              <p className="card p-6 text-sm text-ink-3">No new matches right now. Set your job preferences to improve recommendations.</p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <div className="flex items-center gap-4">
              <ProgressRing value={score} />
              <div>
                <p className="font-semibold">Profile strength</p>
                <p className="text-[13px] text-ink-3">{score >= 80 ? 'Strong profile. Employers can find you.' : 'Complete your profile to appear in employer searches.'}</p>
              </div>
            </div>
            <ul className="mt-4 space-y-1">
              {checks.map((c) => (
                <li key={c.key}>
                  <Link href={c.href} className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 text-sm hover:bg-canvas">
                    {c.done ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600" /> : <Circle size={16} className="shrink-0 text-ink-4" />}
                    <span className={c.done ? 'text-ink-3 line-through decoration-ink-4' : 'text-ink'}>{c.label}</span>
                    {!c.done && <span className="ml-auto text-xs text-ink-4">+{c.weight}%</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section className="card p-5">
            <p className="font-semibold">Visible to employers</p>
            <p className="mt-1 text-sm text-ink-3">
              {profile.talent_visible ? 'Verified employers can find your profile in the candidate database. Your contact details stay hidden until they unlock them.' : 'Your profile is hidden from the candidate database. You can still apply to jobs.'}
            </p>
            <Link href="/candidate/settings" className="mt-3 inline-flex items-center gap-1 text-sm link">
              Change visibility <ArrowRight size={14} />
            </Link>
          </section>
        </aside>
      </div>
    </>
  )
}
