import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, Eye, Users } from 'lucide-react'
import { requireRole } from '@/lib/session'
import { PageHeader } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { JobActions } from '@/components/portal/JobActions'
import { ApplicantList, type ApplicantRow } from '@/components/portal/ApplicantList'
import { JOB_STATUS } from '@/lib/constants'
import { formatDate, formatSalary } from '@/lib/format'
import type { Job } from '@/lib/types'

export const metadata = { title: 'Job' }

const SELECT = 'id,status,created_at,viewed_at,interview_at,candidate_snapshot,screening_answers,resume_path,job_id,jobs(title)'

export default async function EmployerJob({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string; q?: string }> }) {
  const { id } = await params
  const sp = await searchParams
  const { sb, user } = await requireRole('employer')
  const { data } = await sb.from('jobs').select('*').eq('id', id).eq('employer_id', user.id).maybeSingle()
  if (!data) notFound()
  const job = data as Job
  const { data: apps } = await sb.from('applications').select(SELECT).eq('job_id', id).order('created_at', { ascending: false })
  const expired = job.status === 'published' && job.expires_at && new Date(job.expires_at) <= new Date()

  return (
    <>
      <PageHeader
        back={{ href: '/employer/jobs', label: 'Jobs' }}
        title={job.title}
        description={`${job.location}${job.taluk ? `, ${job.taluk}` : ''} · ${formatSalary(job.salary_min, job.salary_max, job.salary_period)}`}
        actions={
          <>
            <StatusPill tone={expired ? 'gray' : JOB_STATUS[job.status].tone} className="h-8 px-3 text-[13px]">{expired ? 'Expired' : JOB_STATUS[job.status].label}</StatusPill>
            <JobActions id={job.id} status={job.status} publishedAt={job.published_at} expiresAt={job.expires_at} />
          </>
        }
      />

      {job.status === 'rejected' && (
        <div className="mb-5 flex gap-3 rounded-[10px] border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Changes requested</p>
            <p>{job.rejection_reason}</p>
          </div>
          <Link href={`/employer/post-job?id=${job.id}`} className="btn btn-sm btn-navy self-center">Fix and resubmit</Link>
        </div>
      )}
      {job.status === 'pending_review' && (
        <div className="mb-5 rounded-[10px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          In review since {formatDate(job.submitted_at, true)}. You’ll get a notification as soon as it’s approved.
        </div>
      )}
      {job.status === 'draft' && (
        <div className="mb-5 rounded-[10px] border border-line bg-white p-4 text-sm text-ink-2">
          This is a draft. Submit it for review when you’re ready. Submitting uses one job credit.
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-4"><p className="flex items-center gap-1.5 text-[13px] text-ink-3"><Users size={14} /> Applicants</p><p className="mt-1 text-2xl font-semibold tabular-nums">{job.applications_count}</p></div>
        <div className="card p-4"><p className="flex items-center gap-1.5 text-[13px] text-ink-3"><Eye size={14} /> Views</p><p className="mt-1 text-2xl font-semibold tabular-nums">{job.views}</p></div>
        <div className="card p-4"><p className="text-[13px] text-ink-3">Openings</p><p className="mt-1 text-2xl font-semibold tabular-nums">{job.openings}</p></div>
        <div className="card p-4"><p className="text-[13px] text-ink-3">{job.status === 'published' ? 'Closes on' : 'Posted'}</p><p className="mt-1 text-base font-semibold">{formatDate(job.status === 'published' ? job.expires_at : job.published_at)}</p></div>
      </div>

      <ApplicantList rows={(apps ?? []) as unknown as ApplicantRow[]} basePath={`/employer/jobs/${job.id}`} status={sp.status ?? 'all'} q={sp.q ?? ''} showJob={false} />
    </>
  )
}
