import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { SearchX } from 'lucide-react'
import { searchJobs, getCategories, PAGE_SIZE, type JobFilters as F } from '@/lib/queries'
import { JobCard } from '@/components/jobs/JobCard'
import { SearchBar } from '@/components/jobs/SearchBar'
import { JobFilters, SortSelect } from '@/components/jobs/JobFilters'
import { EmptyState } from '@/components/ui/bits'

type Props = { searchParams: Promise<F & { id?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const f = await searchParams
  const where = f.taluk ? ` in ${f.taluk}` : ' in Kolar district'
  const what = f.q ? `${f.q} jobs` : f.category ? `${f.category} jobs` : 'Jobs'
  return { title: `${what}${where}`, description: `Apply to verified ${what.toLowerCase()}${where}. Updated hourly.` }
}

export default async function JobsPage({ searchParams }: Props) {
  const f = await searchParams
  // Old alert emails linked to /jobs?id=…
  if (f.id && /^[0-9a-f-]{36}$/i.test(f.id)) redirect(`/jobs/${f.id}`)
  const [{ jobs, total, page }, categories] = await Promise.all([searchJobs(f), getCategories()])
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageHref = (n: number) => {
    const p = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][])
    if (n > 1) p.set('page', String(n))
    else p.delete('page')
    return `/jobs${p.size ? `?${p}` : ''}`
  }
  const heading = [f.q && `“${f.q}”`, f.category, f.taluk && `in ${f.taluk}`].filter(Boolean).join(' ')

  return (
    <div className="bg-canvas">
      <div className="border-b border-line bg-white">
        <div className="container-x py-5 sm:py-6">
          <SearchBar initialQ={f.q} initialTaluk={f.taluk} size="md" key={`${f.q}-${f.taluk}`} />
        </div>
      </div>
      <div className="container-x grid grid-cols-1 gap-6 py-6 lg:grid-cols-[264px_1fr]">
        <Suspense>
          <JobFilters categories={categories.map((c) => c.name)} />
        </Suspense>
        <section aria-live="polite" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-[15px] font-medium text-ink-2">
              <span className="font-semibold text-ink">{total.toLocaleString('en-IN')}</span> {total === 1 ? 'job' : 'jobs'}
              {heading ? ` for ${heading}` : ' in Kolar district'}
            </h1>
            <Suspense>
              <SortSelect />
            </Suspense>
          </div>
          {jobs.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<SearchX size={20} />}
                title="No jobs match these filters"
                body="Try a broader keyword, another taluk, or remove some filters. You can also get an email when matching jobs are posted."
                action={
                  <div className="flex gap-2">
                    <Link href="/jobs" className="btn btn-outline">
                      Clear filters
                    </Link>
                    <Link href={`/job-alerts${f.taluk ? `?taluk=${encodeURIComponent(f.taluk)}` : ''}`} className="btn btn-navy">
                      Create job alert
                    </Link>
                  </div>
                }
              />
            </div>
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {jobs.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          )}
          {pages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
              {page > 1 && (
                <Link href={pageHref(page - 1)} className="btn btn-outline btn-sm" scroll>
                  Previous
                </Link>
              )}
              <span className="px-3 text-sm text-ink-3">
                Page {page} of {pages}
              </span>
              {page < pages && (
                <Link href={pageHref(page + 1)} className="btn btn-outline btn-sm" scroll>
                  Next
                </Link>
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  )
}
