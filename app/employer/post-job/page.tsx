import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/session'
import { JobWizard } from './JobWizard'
import type { Job, Wallet } from '@/lib/types'

export const metadata = { title: 'Post a job' }

export default async function PostJobPage({ searchParams }: { searchParams: Promise<{ id?: string; duplicate?: string }> }) {
  const { sb, user, profile } = await requireRole('employer')
  const sp = await searchParams
  const sourceId = sp.id ?? sp.duplicate
  const [{ data: cats }, { data: areas }, { data: company }, { data: wallet }, src] = await Promise.all([
    sb.from('job_categories').select('name').eq('active', true).order('sort_order'),
    sb.from('areas').select('id,name,taluk,pincode').eq('active', true).eq('verified', true).order('name'),
    sb.from('companies').select('name,verified,address,taluk').eq('id', user.id).maybeSingle(),
    sb.from('employer_wallets').select('*').eq('employer_id', user.id).maybeSingle(),
    sourceId ? sb.from('jobs').select('*').eq('id', sourceId).eq('employer_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  if (sourceId && !src.data) notFound()
  const job = src.data as Job | null
  if (sp.id && job && job.status === 'closed') {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <p className="font-semibold">This job is closed</p>
        <p className="mt-1 text-sm text-ink-3">Reopen it from your jobs list, or post a copy as a new job.</p>
        <Link href={`/employer/post-job?duplicate=${job.id}`} className="btn btn-navy mt-5">Duplicate as new job</Link>
      </div>
    )
  }

  return (
    <JobWizard
      employerId={user.id}
      companyName={company?.name ?? profile.company_name ?? ''}
      companyAddress={company?.address ?? ''}
      contactName={profile.full_name}
      contactPhone={profile.phone ?? ''}
      categories={(cats ?? []).map((c) => c.name)}
      areas={areas ?? []}
      wallet={wallet as Wallet | null}
      existing={sp.id ? job : null}
      template={sp.duplicate ? job : null}
    />
  )
}
