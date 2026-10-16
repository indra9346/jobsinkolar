import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BadgeCheck, Briefcase, CalendarClock, Clock, GraduationCap, Languages, MapPin, Users, Wallet, AlertTriangle } from 'lucide-react'
import { getJob, getSimilarJobs } from '@/lib/queries'
import { Avatar } from '@/components/ui/bits'
import { JobCard, ExperienceText } from '@/components/jobs/JobCard'
import { ApplyPanel } from '@/components/jobs/ApplyPanel'
import { formatDate, formatSalary } from '@/lib/format'
import { ENGLISH, PAY_TYPES, SHIFTS, SITE, WORK_MODES } from '@/lib/constants'
import { logoUrl } from '@/lib/storage'
import { Ago, T } from '@/lib/i18n'

// Rendered on first request, then cached and revalidated (ISR).
export async function generateStaticParams() {
  return []
}

export const revalidate = 60

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await getJob((await params).id)
  if (!job) return { title: 'Job not found' }
  return {
    title: `${job.title} at ${job.company_name}, ${job.location}`,
    description: `${formatSalary(job.salary_min, job.salary_max, job.salary_period)} · ${job.employment_type} · ${job.description.slice(0, 140)}`,
  }
}

export default async function JobDetailPage({ params }: Props) {
  const job = await getJob((await params).id)
  if (!job) notFound()
  const similar = await getSimilarJobs(job)
  const c = job.companies
  const companyName = c?.name ?? job.company_name

  const facts: [typeof Wallet, string, React.ReactNode][] = [
    [Wallet, 'Salary', `${formatSalary(job.salary_min, job.salary_max, job.salary_period)}${job.pay_type !== 'fixed' ? ` · ${PAY_TYPES[job.pay_type]}${job.incentive_max ? ` (up to ₹${job.incentive_max.toLocaleString('en-IN')} incentive)` : ''}` : ''}`],
    [Briefcase, 'Experience', <ExperienceText key="e" min={job.experience_min} max={job.experience_max} />],
    [Clock, 'Job type', <span key="t"><T>{job.employment_type}</T> · {SHIFTS[job.shift]}</span>],
    [MapPin, 'Work mode', <T key="w">{WORK_MODES[job.work_mode]}</T>],
    [GraduationCap, 'Education', job.education || 'Any'],
    [Languages, 'English', ENGLISH[job.english_level ?? 'none']],
    [Users, 'Openings', `${job.openings}`],
    ...(job.deadline ? [[CalendarClock, 'Apply by', formatDate(job.deadline)] as [typeof Wallet, string, React.ReactNode]] : []),
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.published_at ?? job.created_at,
    validThrough: job.expires_at ?? undefined,
    employmentType: job.employment_type.toUpperCase().replace('-', '_'),
    hiringOrganization: { '@type': 'Organization', name: companyName, logo: logoUrl(c?.logo_path) ?? undefined },
    jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: job.location, addressRegion: 'Karnataka', addressCountry: 'IN' } },
    baseSalary: job.salary_min
      ? { '@type': 'MonetaryAmount', currency: 'INR', value: { '@type': 'QuantitativeValue', minValue: job.salary_min, maxValue: job.salary_max ?? job.salary_min, unitText: job.salary_period.toUpperCase() } }
      : undefined,
  }

  return (
    <div className="bg-canvas pb-20 lg:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="container-x py-6 sm:py-8">
        <nav className="mb-4 text-[13px] text-ink-3" aria-label="Breadcrumb">
          <Link href="/jobs" className="hover:text-ink">Jobs</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/jobs?category=${encodeURIComponent(job.category)}`} className="hover:text-ink">{job.category}</Link>
        </nav>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <section className="card relative overflow-hidden p-5 sm:p-6">
              <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy-600 via-brand-500 to-saffron-400" aria-hidden />
              <div className="flex items-start gap-4">
                <Avatar name={companyName} src={logoUrl(c?.logo_path)} size={56} square />
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl leading-tight font-semibold sm:text-2xl">{job.title}</h1>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[15px] text-ink-2">
                    {c?.slug ? (
                      <Link href={`/companies/${c.slug}`} className="hover:underline">{companyName}</Link>
                    ) : (
                      companyName
                    )}
                    {c?.verified && (
                      <span className="inline-flex items-center gap-1 text-[13px] font-medium text-navy-600">
                        <BadgeCheck size={16} /> <T>Verified</T>
                      </span>
                    )}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-3">
                    <MapPin size={15} /> {job.location}
                    {job.taluk && !job.location.includes(job.taluk) ? `, ${job.taluk} taluk` : ''}
                  </p>
                </div>
              </div>
              <dl className="mt-6 grid gap-x-6 gap-y-4 border-t border-line-2 pt-5 sm:grid-cols-2">
                {facts.map(([Icon, k, v]) => (
                  <div key={k} className="flex gap-3">
                    <Icon size={18} className="mt-0.5 shrink-0 text-ink-4" />
                    <div className="min-w-0">
                      <dt className="text-xs text-ink-3">
                        <T>{k}</T>
                      </dt>
                      <dd className="text-sm font-medium text-ink">{v}</dd>
                    </div>
                  </div>
                ))}
              </dl>
              <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 border-t border-line-2 pt-4 text-xs text-ink-3">
                <Ago iso={job.published_at ?? job.created_at} />
                <span>{job.applications_count} applicant{job.applications_count === 1 ? '' : 's'}</span>
                {job.expires_at && <span>Closes {formatDate(job.expires_at)}</span>}
              </p>
            </section>

            {job.joining_fee && (
              <section className="flex gap-3 rounded-[10px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <p>
                  This employer has declared a fee of ₹{job.joining_fee_amount?.toLocaleString('en-IN')} ({job.joining_fee_reason}). Jobs in Kolar never charges candidates. Never pay before receiving a written offer.{' '}
                  <Link href="/safety" className="font-medium underline">Safety tips</Link>
                </p>
              </section>
            )}

            <section className="card p-5 sm:p-6">
              <h2 className="text-base font-semibold">
                <T>Job description</T>
              </h2>
              <div className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-ink-2">{job.description}</div>
              {job.requirements?.length > 0 && (
                <>
                  <h3 className="mt-6 text-sm font-semibold">
                    <T>Requirements</T>
                  </h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-ink-2">
                    {job.requirements.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </>
              )}
              {job.skills?.length > 0 && (
                <>
                  <h3 className="mt-6 text-sm font-semibold">
                    <T>Skills</T>
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {job.skills.map((s) => (
                      <span key={s} className="chip">{s}</span>
                    ))}
                  </div>
                </>
              )}
              {job.benefits?.length > 0 && (
                <>
                  <h3 className="mt-6 text-sm font-semibold">
                    <T>Benefits</T>
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {job.benefits.map((s) => (
                      <span key={s} className="chip bg-emerald-50 text-emerald-800">{s}</span>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section className="card p-5 sm:p-6">
              <h2 className="text-base font-semibold">
                <T>Interview details</T>
              </h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-ink-3">
                    <T>Interview type</T>
                  </dt>
                  <dd className="font-medium">{job.walk_in ? <T>Walk-in interview</T> : <T>Employer will contact shortlisted candidates</T>}</dd>
                </div>
                {job.interview_timings && (
                  <div>
                    <dt className="text-xs text-ink-3">
                      <T>Timings</T>
                    </dt>
                    <dd className="font-medium">{job.interview_timings}</dd>
                  </div>
                )}
                {job.interview_address && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-ink-3">
                      <T>Address</T>
                    </dt>
                    <dd className="font-medium">{job.interview_address}</dd>
                  </div>
                )}
              </dl>
              <p className="mt-4 text-xs text-ink-3">
                <T>Contact details are shared with you after you apply.</T>
              </p>
            </section>

            {c?.about && (
              <section className="card p-5 sm:p-6">
                <h2 className="text-base font-semibold">About {companyName}</h2>
                <p className="mt-2 line-clamp-5 text-[15px] leading-relaxed text-ink-2">{c.about}</p>
                {c.slug && (
                  <Link href={`/companies/${c.slug}`} className="link mt-3 inline-block text-sm">
                    View company and all jobs →
                  </Link>
                )}
              </section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <ApplyPanel
              job={{
                id: job.id,
                title: job.title,
                company: companyName,
                employer_id: job.employer_id,
                screening_questions: job.screening_questions ?? [],
                deadline: job.deadline,
                walk_in: job.walk_in,
                contact_phone: job.contact_phone,
                contact_name: job.contact_name,
              }}
            />
            <div className="card p-4 text-[13px] text-ink-3">
              <p className="font-medium text-ink">
                <T>Stay safe</T>
              </p>
              <p className="mt-1">
                <T>Never pay to get a job.</T> {SITE.email}
              </p>
              <Link href={`/contact?topic=report&job=${job.id}`} className="link mt-2 inline-block">
                <T>Report this job</T>
              </Link>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold">
              <T>Similar jobs</T>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((j) => (
                <JobCard key={j.id} job={j} compact />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
