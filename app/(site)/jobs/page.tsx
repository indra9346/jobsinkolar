import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { SearchX } from 'lucide-react'
import { searchJobs, getCategories, getAreas, getStats, PAGE_SIZE, type JobFilters as F } from '@/lib/queries'
import { JobCard } from '@/components/jobs/JobCard'
import { SearchBar } from '@/components/jobs/SearchBar'
import { JobFilters, SortSelect } from '@/components/jobs/JobFilters'
import { EmptyState } from '@/components/ui/bits'
import { LiveJobs } from '@/components/jobs/LiveJobs'
import { Reveal } from '@/components/ui/motion'
import { T } from '@/lib/i18n'

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
  const [{ jobs, total, page }, categories, areas, stats] = await Promise.all([searchJobs(f), getCategories(), getAreas(), getStats()])
  const areaName = f.area ? areas.find((a) => a.id === f.area)?.name : undefined
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageHref = (n: number) => {
    const p = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][])
    if (n > 1) p.set('page', String(n))
    else p.delete('page')
    return `/jobs${p.size ? `?${p}` : ''}`
  }
  const heading = [f.q && `“${f.q}”`, f.category, areaName ? `in ${areaName}` : f.taluk && `in ${f.taluk}`].filter(Boolean).join(' ')

  return (
    <div className="bg-canvas">
      <LiveJobs />
      <div className="border-b border-line bg-gradient-to-r from-navy-50/80 via-white to-brand-50/60">
        <div className="container-x py-5 sm:py-6">
          <SearchBar initialQ={f.q} initialTaluk={f.taluk} initialArea={f.area} initialCategory={f.category} size="md" key={`${f.q}-${f.taluk}-${f.area}-${f.category}`} />
        </div>
      </div>
      <div className="container-x grid grid-cols-1 gap-6 py-6 lg:grid-cols-[264px_1fr]">
        <Suspense>
          <JobFilters categories={categories.map((c) => c.name)} counts={stats.by_category} />
        </Suspense>
        <section aria-live="polite" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-[15px] font-medium text-ink-2">
              {heading ? (
                <>
                  <span className="font-semibold text-ink">{total.toLocaleString('en-IN')}</span> · {heading}
                </>
              ) : (
                <T vars={{ n: total.toLocaleString('en-IN') }}>{'{n} jobs in Kolar district'}</T>
              )}
            </h1>
            <Suspense>
              <SortSelect />
            </Suspense>
          </div>
          {jobs.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<SearchX size={20} />}
                title={<T>No jobs match these filters</T>}
                body={<T>Try a broader keyword, another taluk, or remove some filters. You can also get an email when matching jobs are posted.</T>}
                action={
                  <div className="flex gap-2">
                    <Link href="/jobs" className="btn btn-outline">
                      <T>Clear filters</T>
                    </Link>
                    <Link href={`/job-alerts${f.taluk ? `?taluk=${encodeURIComponent(f.taluk)}` : ''}`} className="btn btn-navy">
                      <T>Create job alert</T>
                    </Link>
                  </div>
                }
              />
            </div>
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {jobs.map((j, i) => (
                <Reveal key={j.id} delay={Math.min(i, 6) * 40}>
                  <JobCard job={j} />
                </Reveal>
              ))}
            </div>
          )}
          {pages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
              {page > 1 && (
                <Link href={pageHref(page - 1)} className="btn btn-outline btn-sm" scroll>
                  <T>Previous</T>
                </Link>
              )}
              <span className="px-3 text-sm text-ink-3">
                <T vars={{ a: page, b: pages }}>{'Page {a} of {b}'}</T>
              </span>
              {page < pages && (
                <Link href={pageHref(page + 1)} className="btn btn-outline btn-sm" scroll>
                  <T>Next</T>
                </Link>
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  )
}
