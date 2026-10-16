import { requireRole } from '@/lib/session'
import { PageHeader } from '@/components/ui/bits'
import { ApplicantList, type ApplicantRow } from '@/components/portal/ApplicantList'
import { JobFilterSelect } from './JobFilterSelect'

export const metadata = { title: 'Applicants' }

const APPLICANT_SELECT = 'id,status,created_at,viewed_at,interview_at,candidate_snapshot,screening_answers,resume_path,job_id,jobs(title)'

export default async function ApplicantsPage({ searchParams }: { searchParams: Promise<{ job?: string; status?: string; q?: string }> }) {
  const { sb, user } = await requireRole('employer')
  const sp = await searchParams
  let q = sb.from('applications').select(APPLICANT_SELECT).eq('employer_id', user.id).order('created_at', { ascending: false }).limit(1000)
  if (sp.job) q = q.eq('job_id', sp.job)
  const [{ data }, { data: jobs }] = await Promise.all([q, sb.from('jobs').select('id,title,status').eq('employer_id', user.id).neq('status', 'draft').order('created_at', { ascending: false })])
  return (
    <>
      <PageHeader title="Applicants" description="Review, shortlist and schedule interviews across all your jobs." actions={<JobFilterSelect jobs={jobs ?? []} value={sp.job ?? ''} />} />
      <ApplicantList rows={(data ?? []) as unknown as ApplicantRow[]} basePath={sp.job ? `/employer/applications?job=${sp.job}` : '/employer/applications'} status={sp.status ?? 'all'} q={sp.q ?? ''} showJob={!sp.job} />
    </>
  )
}
