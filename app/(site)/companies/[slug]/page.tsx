import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BadgeCheck, Globe, MapPin, Users } from 'lucide-react'
import { getCompany, searchJobs } from '@/lib/queries'
import { Avatar, EmptyState } from '@/components/ui/bits'
import { JobCard } from '@/components/jobs/JobCard'
import { logoUrl } from '@/lib/storage'

// Rendered on first request, then cached and revalidated (ISR).
export async function generateStaticParams() {
  return []
}

export const revalidate = 120

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCompany((await params).slug)
  return c ? { title: `${c.name} jobs`, description: c.about?.slice(0, 155) ?? `Open jobs at ${c.name} in Kolar district.` } : { title: 'Company not found' }
}

export default async function CompanyPage({ params }: Props) {
  const c = await getCompany((await params).slug)
  if (!c) notFound()
  const { jobs } = await searchJobs({ company: c.id })
  return (
    <div className="bg-canvas">
      <div className="border-b border-line bg-white">
        <div className="container-x flex flex-col gap-5 py-8 sm:flex-row sm:items-center">
          <Avatar name={c.name} src={logoUrl(c.logo_path)} size={72} square />
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl font-semibold sm:text-3xl">{c.name}{c.verified && <BadgeCheck size={24} className="text-navy-500" aria-label="Verified" />}</h1>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-3">
              {c.industry && <span>{c.industry}</span>}
              {c.taluk && <span className="flex items-center gap-1"><MapPin size={14} /> {c.taluk}</span>}
              {c.company_size && <span className="flex items-center gap-1"><Users size={14} /> {c.company_size} employees</span>}
              {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 link"><Globe size={14} /> Website</a>}
            </p>
          </div>
        </div>
      </div>
      <div className="container-x grid gap-6 py-8 lg:grid-cols-[1fr_320px]">
        <section>
          <h2 className="mb-3 font-semibold">Open jobs ({jobs.length})</h2>
          {jobs.length ? (
            <div className="grid gap-3 md:grid-cols-2">{jobs.map((j) => <JobCard key={j.id} job={j} />)}</div>
          ) : (
            <div className="card"><EmptyState title="No open jobs right now" body="Create a job alert to hear when this company hires again." /></div>
          )}
        </section>
        <aside className="card self-start p-5">
          <h2 className="font-semibold">About</h2>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink-2">{c.about || 'This company hasn’t added a description yet.'}</p>
        </aside>
      </div>
    </div>
  )
}
