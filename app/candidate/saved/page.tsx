import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { requireRole } from '@/lib/session'
import { EmptyState, PageHeader } from '@/components/ui/bits'
import { JobCard } from '@/components/jobs/JobCard'
import { JOB_CARD_COLUMNS } from '@/lib/queries'
import type { Job } from '@/lib/types'

export const metadata = { title: 'Saved jobs' }

export default async function SavedPage() {
  const { sb } = await requireRole('candidate')
  const { data } = await sb.from('saved_jobs').select(`created_at,jobs(${JOB_CARD_COLUMNS},status)`).order('created_at', { ascending: false })
  const rows = ((data ?? []) as unknown as { jobs: (Job & { status: string }) | null }[]).map((r) => r.jobs).filter(Boolean) as (Job & { status: string })[]
  const now = Date.now()
  const live = rows.filter((j) => j.status === 'published' && (!j.expires_at || new Date(j.expires_at).getTime() > now))
  const closed = (data?.length ?? 0) - live.length

  return (
    <>
      <PageHeader title="Saved jobs" description={closed ? `${closed} saved job${closed === 1 ? ' is' : 's are'} no longer accepting applications and hidden.` : 'Jobs you bookmarked to apply later.'} />
      {live.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Bookmark size={20} />} title="No saved jobs" body="Tap the bookmark on any job to save it here." action={<Link href="/jobs" className="btn btn-primary">Browse jobs</Link>} />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {live.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      )}
    </>
  )
}
