import Link from 'next/link'
import { ArrowRight, BadgeCheck, CalendarClock, Plus, ShieldAlert } from 'lucide-react'
import { requireRole } from '@/lib/session'
import { Avatar, EmptyState, Stat } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { APP_STATUS, INTERVIEW_MODE, JOB_STATUS } from '@/lib/constants'
import { formatDate, timeAgo } from '@/lib/format'
import type { AppStatus, JobStatus, Wallet } from '@/lib/types'

export const metadata = { title: 'Overview' }

export default async function EmployerHome() {
  const { sb, user, profile } = await requireRole('employer')
  const now = new Date().toISOString()
  const [{ data: company }, { data: wallet }, { data: jobs }, { data: apps }] = await Promise.all([
    sb.from('companies').select('name,verified,about,logo_path,address,industry').eq('id', user.id).maybeSingle(),
    sb.from('employer_wallets').select('*').eq('employer_id', user.id).maybeSingle(),
    sb.from('jobs').select('id,title,status,applications_count,expires_at,created_at').eq('employer_id', user.id).order('created_at', { ascending: false }),
    sb.from('applications').select('id,status,created_at,interview_at,interview_mode,candidate_snapshot,job_id,jobs(title)').eq('employer_id', user.id).order('created_at', { ascending: false }).limit(300),
  ])
  const w = wallet as Wallet | null
  const allJobs = (jobs ?? []) as { id: string; title: string; status: JobStatus; applications_count: number; expires_at: string | null }[]
  const allApps = (apps ?? []) as unknown as { id: string; status: AppStatus; created_at: string; interview_at: string | null; interview_mode: keyof typeof INTERVIEW_MODE | null; candidate_snapshot: { full_name?: string; headline?: string }; jobs: { title: string } | null }[]
  const live = allJobs.filter((j) => j.status === 'published' && (!j.expires_at || j.expires_at > now))
  const pending = allApps.filter((a) => a.status === 'submitted')
  const interviews = allApps.filter((a) => a.status === 'interview' && a.interview_at && a.interview_at > now).sort((a, b) => a.interview_at!.localeCompare(b.interview_at!))
  const hires = allApps.filter((a) => a.status === 'hired').length
  const companyIncomplete = !company?.about || !company?.address || !company?.industry
  const expiredPlan = w?.expires_at && w.plan_id !== 'free' && new Date(w.expires_at) < new Date()

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold sm:text-2xl">{company?.name ?? 'Your company'}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-3">
            {company?.verified ? <><BadgeCheck size={16} className="text-navy-600" /> Verified employer</> : 'Verification pending'}
            <span className="text-ink-4">·</span> Hi {profile.full_name.split(' ')[0]}
          </p>
        </div>
        <Link href="/employer/post-job" className="btn btn-primary"><Plus size={16} /> Post a job</Link>
      </div>

      {!company?.verified && (
        <div className="mb-5 flex flex-col gap-3 rounded-[10px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center">
          <ShieldAlert size={18} className="shrink-0" />
          <p className="flex-1">
            {companyIncomplete ? 'Complete your company profile so our team can verify you. ' : 'Our team is reviewing your company. '}
            Verified companies get a badge on every job and can unlock candidates from the database.
          </p>
          {companyIncomplete && <Link href="/employer/company" className="btn btn-sm btn-navy shrink-0">Complete profile</Link>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Live jobs" value={live.length} sub={`${allJobs.filter((j) => j.status === 'pending_review').length} in review`} href="/employer/jobs?tab=live" />
        <Stat label="Action pending" value={pending.length} sub="New applicants to review" href="/employer/applications?status=submitted" />
        <Stat label="Interviews" value={interviews.length} sub="Upcoming" href="/employer/applications?status=interview" />
        <Stat label="Hired" value={hires} sub="Through Jobs in Kolar" href="/employer/applications?status=offered" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="card">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold">New applicants</h2>
              <Link href="/employer/applications" className="text-[13px] link">View all</Link>
            </div>
            {pending.length === 0 ? (
              <EmptyState title="You’re up to date" body={live.length ? 'New applicants will appear here.' : 'Post a job to start receiving applicants.'} action={!live.length && <Link href="/employer/post-job" className="btn btn-primary">Post a job</Link>} />
            ) : (
              <ul className="divide-y divide-line-2">
                {pending.slice(0, 6).map((a) => (
                  <li key={a.id}>
                    <Link href={`/employer/applications/${a.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-canvas">
                      <Avatar name={a.candidate_snapshot?.full_name} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{a.candidate_snapshot?.full_name || 'Candidate'}</p>
                        <p className="truncate text-sm text-ink-3">{a.jobs?.title} · {timeAgo(a.created_at)}</p>
                      </div>
                      <ArrowRight size={16} className="text-ink-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold">Your jobs</h2>
              <Link href="/employer/jobs" className="text-[13px] link">Manage</Link>
            </div>
            {allJobs.length === 0 ? (
              <EmptyState title="No jobs yet" body="Your first two job posts are free." action={<Link href="/employer/post-job" className="btn btn-primary">Post a job</Link>} />
            ) : (
              <ul className="divide-y divide-line-2">
                {allJobs.slice(0, 6).map((j) => (
                  <li key={j.id}>
                    <Link href={`/employer/jobs/${j.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-canvas">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{j.title}</p>
                        <p className="text-sm text-ink-3">{j.applications_count} applicant{j.applications_count === 1 ? '' : 's'}</p>
                      </div>
                      <StatusPill tone={JOB_STATUS[j.status].tone}>{JOB_STATUS[j.status].label}</StatusPill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Credits</p>
              <span className="chip capitalize">{w?.plan_id ?? 'free'} plan</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-canvas p-3"><dt className="text-xs text-ink-3">Job posts</dt><dd className="text-xl font-semibold tabular-nums">{w?.job_credits ?? 0}</dd></div>
              <div className="rounded-lg bg-canvas p-3"><dt className="text-xs text-ink-3">Profile unlocks</dt><dd className="text-xl font-semibold tabular-nums">{w?.unlock_credits ?? 0}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-ink-3">
              {expiredPlan ? <span className="font-medium text-brand-700">Plan expired on {formatDate(w!.expires_at)}. Renew to use remaining credits.</span> : w?.expires_at && w.plan_id !== 'free' ? `Valid until ${formatDate(w.expires_at)}` : 'Free credits do not expire.'}
            </p>
            <Link href="/employer/billing" className="btn btn-outline mt-4 w-full">Buy more credits</Link>
          </section>

          <section className="card p-5">
            <p className="flex items-center gap-2 font-semibold"><CalendarClock size={17} className="text-violet-700" /> Upcoming interviews</p>
            {interviews.length === 0 ? (
              <p className="mt-2 text-sm text-ink-3">None scheduled.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {interviews.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <Link href={`/employer/applications/${a.id}`} className="block text-sm hover:underline">
                      <span className="font-medium">{a.candidate_snapshot?.full_name}</span>
                      <span className="block text-ink-3">{formatDate(a.interview_at, true)} · {a.interview_mode ? INTERVIEW_MODE[a.interview_mode] : ''}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <p className="font-semibold">Find candidates faster</p>
            <p className="mt-1 text-sm text-ink-3">Search people in Kolar district who are open to work and unlock their contact details.</p>
            <Link href="/employer/talent" className="mt-3 inline-flex items-center gap-1 text-sm link">Open candidate database <ArrowRight size={14} /></Link>
          </section>
        </aside>
      </div>
    </>
  )
}
