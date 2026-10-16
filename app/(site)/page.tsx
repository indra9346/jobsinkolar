import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Building2, CheckCircle2, FileSearch, MapPin, MessageSquareText, ShieldCheck, UserRoundCheck } from 'lucide-react'
import hero from '@/public/images/hero-workforce.jpg'
import employerImg from '@/public/images/employer-banner.jpg'
import { SearchBar } from '@/components/jobs/SearchBar'
import { JobCard } from '@/components/jobs/JobCard'
import { NewsletterForm } from '@/components/site/NewsletterForm'
import { getCategories, getLatestJobs, getStats } from '@/lib/queries'
import { POPULAR_SEARCHES, TALUKS } from '@/lib/constants'
import { T } from '@/lib/i18n'

export const revalidate = 60

export default async function HomePage() {
  const [stats, categories, jobs] = await Promise.all([getStats(), getCategories(), getLatestJobs(9)])

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-gradient-to-b from-white to-canvas">
        <div className="container-x grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.15fr_1fr] lg:py-16">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[13px] font-medium text-ink-2">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {stats.live_jobs} live jobs · updated every hour
            </p>
            <h1 className="max-w-xl text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-ink sm:text-[46px]">
              <T>Jobs across Kolar district, in one place.</T>
            </h1>
            <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-ink-3 sm:text-[17px]">
              <T>Verified openings from factories, hospitals, schools and shops in Kolar, Malur, Bangarpet, KGF, Mulbagal and Srinivaspur.</T>
            </p>
            <div className="mt-7 max-w-2xl">
              <SearchBar />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
              <span className="text-ink-3">
                <T>Popular:</T>
              </span>
              {POPULAR_SEARCHES.slice(0, 6).map((s) => (
                <Link key={s} href={`/jobs?q=${encodeURIComponent(s)}`} className="rounded-full border border-line bg-white px-3 py-1 text-ink-2 hover:border-ink-4 hover:text-ink">
                  {s}
                </Link>
              ))}
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="relative aspect-[4/3.4] overflow-hidden rounded-2xl border border-line">
              <Image src={hero} alt="Professionals from Kolar district" fill priority sizes="(min-width:1024px) 520px, 0px" placeholder="blur" className="object-cover" />
            </div>
            <div className="absolute -bottom-5 -left-6 w-64 rounded-xl border border-line bg-white p-4 shadow-pop">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold">Every job reviewed</p>
                  <p className="text-xs text-ink-3">No fake listings, no middlemen</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="border-b border-line">
        <div className="container-x grid grid-cols-2 divide-line py-6 sm:grid-cols-4 sm:divide-x">
          {[
            [stats.live_jobs, 'Live jobs'],
            [stats.openings, 'Open positions'],
            [stats.companies, 'Hiring companies'],
            [TALUKS.length, 'Taluks covered'],
          ].map(([n, l]) => (
            <div key={l as string} className="px-2 py-3 text-center sm:px-6">
              <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-[28px]">{Number(n).toLocaleString('en-IN')}</p>
              <p className="mt-0.5 text-[13px] text-ink-3">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-x py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">
              <T>Browse by category</T>
            </h2>
            <p className="mt-1 text-sm text-ink-3">Roles local employers hire for most often.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => {
            const n = stats.by_category?.[c.name] ?? 0
            return (
              <Link key={c.id} href={`/jobs?category=${encodeURIComponent(c.name)}`} className="group card flex items-center justify-between gap-3 p-4 transition-colors hover:border-ink-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="mt-0.5 text-[13px] text-ink-3">{n > 0 ? `${n} open job${n === 1 ? '' : 's'}` : 'View roles'}</p>
                </div>
                <ArrowRight size={17} className="shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
              </Link>
            )
          })}
        </div>
      </section>

      {/* Latest */}
      <section className="border-y border-line bg-canvas py-14">
        <div className="container-x">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">
                <T>Latest jobs</T>
              </h2>
              <p className="mt-1 text-sm text-ink-3">Fresh openings approved by our team.</p>
            </div>
            <Link href="/jobs" className="btn btn-outline btn-sm hidden sm:inline-flex">
              <T>View all jobs</T> <ArrowRight size={15} />
            </Link>
          </div>
          {jobs.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          ) : (
            <p className="card p-10 text-center text-ink-3">New jobs are being reviewed. Subscribe below to hear first.</p>
          )}
          <Link href="/jobs" className="btn btn-outline mt-6 w-full sm:hidden">
            <T>View all jobs</T>
          </Link>
        </div>
      </section>

      {/* Taluks */}
      <section className="container-x py-14">
        <h2 className="text-2xl font-semibold">Jobs near you</h2>
        <p className="mt-1 text-sm text-ink-3">Every taluk in Kolar district, with verified localities.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TALUKS.map((t) => (
            <Link key={t} href={`/jobs?taluk=${encodeURIComponent(t)}`} className="card flex flex-col gap-3 p-4 transition-colors hover:border-ink-4">
              <MapPin size={18} className="text-brand-600" />
              <div>
                <p className="font-medium">{t}</p>
                <p className="text-[13px] text-ink-3">{stats.by_taluk?.[t] ?? 0} jobs</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-line">
        <div className="container-x grid gap-12 py-14 lg:grid-cols-2">
          {[
            {
              title: 'For job seekers',
              cta: ['Create free profile', '/register'],
              steps: [
                [UserRoundCheck, 'Build your profile once', 'Add experience, skills and your resume. It takes about five minutes.'],
                [FileSearch, 'Apply in one tap', 'Answer any screening questions and apply. No agents, no fees.'],
                [MessageSquareText, 'Track every application', 'See when an employer views, shortlists or invites you to interview.'],
              ],
            },
            {
              title: 'For employers',
              cta: ['Start hiring free', '/register?role=employer'],
              steps: [
                [Building2, 'Set up your company', 'Get a verified badge after a quick check by our team.'],
                [CheckCircle2, 'Post a job', 'Your first two job posts are free. Most are approved within a few hours.'],
                [BadgeCheck, 'Hire from applicants and the database', 'Shortlist, schedule interviews, message candidates and unlock profiles.'],
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h2 className="text-xl font-semibold">{col.title}</h2>
              <ol className="mt-6 space-y-5">
                {col.steps.map(([Icon, t, d], i) => {
                  const I = Icon as typeof Building2
                  return (
                    <li key={t as string} className="flex gap-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-navy-700">
                        <I size={19} />
                      </span>
                      <div>
                        <p className="font-medium">
                          <span className="mr-1.5 text-ink-4 tabular-nums">{i + 1}.</span>
                          {t as string}
                        </p>
                        <p className="mt-0.5 text-sm text-ink-3">{d as string}</p>
                      </div>
                    </li>
                  )
                })}
              </ol>
              <Link href={col.cta[1]} className="btn btn-outline mt-7">
                {col.cta[0]} <ArrowRight size={15} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Employer band */}
      <section className="container-x pb-14">
        <div className="relative overflow-hidden rounded-2xl bg-navy-900 text-white">
          <Image src={employerImg} alt="" fill sizes="100vw" className="object-cover opacity-25" />
          <div className="relative grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                <T>Hiring in Kolar?</T>
              </h2>
              <p className="mt-3 max-w-xl text-white/75">
                Reach candidates who already live near your factory, hospital or store. Fewer no-shows, faster joining, lower attrition.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/register?role=employer" className="btn btn-primary btn-lg">
                  Post a job free
                </Link>
                <Link href="/employers#pricing" className="btn btn-lg border border-white/25 text-white hover:bg-white/10">
                  See pricing
                </Link>
              </div>
            </div>
            <ul className="grid gap-3 text-[15px] text-white/85">
              {['2 free job posts for every new company', 'Applicant tracking with interview scheduling', 'Search and unlock local candidates', 'GST invoices for every purchase'].map((x) => (
                <li key={x} className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-400" /> {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Alerts */}
      <section className="border-t border-line bg-canvas">
        <div className="container-x flex flex-col gap-6 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              <T>Get job alerts</T>
            </h2>
            <p className="mt-1 text-sm text-ink-3">One email when new jobs match. No spam, unsubscribe in one click.</p>
          </div>
          <div className="w-full max-w-md">
            <NewsletterForm />
            <Link href="/job-alerts" className="mt-2 inline-block text-[13px] link">
              Choose taluk and category →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
