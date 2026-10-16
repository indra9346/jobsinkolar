import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Building2, CheckCircle2, FileSearch, MapPin, MessageSquareText, ShieldCheck, UserRoundCheck } from 'lucide-react'
import hero from '@/public/images/hero-workforce.jpg'
import employerImg from '@/public/images/employer-banner.jpg'
import { SearchBar } from '@/components/jobs/SearchBar'
import { JobCard } from '@/components/jobs/JobCard'
import { LiveJobs } from '@/components/jobs/LiveJobs'
import { NewsletterForm } from '@/components/site/NewsletterForm'
import { CountUp, Reveal } from '@/components/ui/motion'
import { getCategories, getLatestJobs, getStats } from '@/lib/queries'
import { categoryStyle } from '@/lib/category-style'
import { POPULAR_SEARCHES, TALUKS } from '@/lib/constants'
import { T } from '@/lib/i18n'

export const revalidate = 60

const TALUK_TINT = ['from-rose-500 to-orange-400', 'from-navy-500 to-sky-400', 'from-emerald-500 to-teal-400', 'from-violet-500 to-fuchsia-400', 'from-amber-500 to-yellow-400', 'from-cyan-500 to-blue-400']

export default async function HomePage() {
  const [stats, categories, jobs] = await Promise.all([getStats(), getCategories(), getLatestJobs(9)])

  return (
    <>
      <LiveJobs auto />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-navy-50/70 via-white to-white">
        <div className="mesh" aria-hidden>
          <span className="-top-24 -left-20 size-[420px] bg-navy-200" />
          <span className="top-10 right-[-120px] size-[380px] bg-brand-100 [animation-delay:-6s]" />
          <span className="bottom-[-160px] left-1/3 size-[360px] bg-saffron-100 [animation-delay:-12s]" />
        </div>
        <div className="relative container-x grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:py-20">
          <div className="animate-slide-up">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[13px] font-medium text-emerald-800 shadow-[var(--shadow-card)] backdrop-blur">
              <span className="live-dot" />
              {stats.live_jobs > 0 ? <T vars={{ n: stats.live_jobs }}>{'{n} live jobs · updated live'}</T> : <T>New jobs are reviewed and added every day</T>}
            </p>
            <h1 className="max-w-xl text-[36px] leading-[1.06] font-extrabold tracking-[-0.035em] sm:text-[52px]">
              <span className="text-gradient">
                <T>Jobs across Kolar district, in one place.</T>
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-ink-3 sm:text-[17px]">
              <T>Verified openings from factories, hospitals, schools and shops in Kolar, Malur, Bangarpet, KGF, Mulbagal and Srinivaspur.</T>
            </p>
            <div className="relative z-20 mt-8 max-w-2xl">
              <SearchBar />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
              <span className="text-ink-3">
                <T>Popular:</T>
              </span>
              {POPULAR_SEARCHES.slice(0, 6).map((s) => (
                <Link key={s} href={`/jobs?q=${encodeURIComponent(s)}`} className="rounded-full border border-line bg-white/80 px-3 py-1 text-ink-2 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-navy-200 hover:text-navy-800 hover:shadow-[var(--shadow-card)]">
                  {s}
                </Link>
              ))}
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute -inset-3 rotate-2 rounded-[28px] bg-gradient-to-br from-navy-500 via-brand-500 to-saffron-400 opacity-90" aria-hidden />
            <div className="relative aspect-[4/3.4] overflow-hidden rounded-3xl border-4 border-white shadow-pop">
              <Image src={hero} alt="Professionals from Kolar district" fill priority sizes="(min-width:1024px) 520px, 0px" placeholder="blur" className="object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-8 w-64 animate-float rounded-2xl border border-line bg-white/95 p-4 shadow-pop backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-sm">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    <T>Every job reviewed</T>
                  </p>
                  <p className="text-xs text-ink-3">
                    <T>No fake listings, no middlemen</T>
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 animate-float rounded-2xl border border-line bg-white/95 px-4 py-3 shadow-pop backdrop-blur [animation-delay:-3s]">
              <p className="text-xs text-ink-3">
                <T>Taluks covered</T>
              </p>
              <p className="text-xl font-bold text-navy-700">6 / 6</p>
            </div>
          </div>
        </div>
      </section>

      {/* Numbers (only once there is real activity) */}
      {stats.live_jobs > 0 && (
        <section className="border-b border-line bg-white">
          <div className="container-x grid grid-cols-2 py-6 sm:grid-cols-4 sm:divide-x sm:divide-line">
            {(
              [
                [stats.live_jobs, 'Live jobs', 'text-navy-700'],
                [stats.openings, 'Open positions', 'text-brand-600'],
                [stats.companies, 'Hiring companies', 'text-emerald-700'],
                [TALUKS.length, 'Taluks covered', 'text-saffron-500'],
              ] as const
            ).map(([n, l, c]) => (
              <div key={l} className="px-2 py-3 text-center sm:px-6">
                <p className={`text-3xl font-extrabold tracking-tight ${c}`}>
                  <CountUp value={n} />
                </p>
                <p className="mt-0.5 text-[13px] text-ink-3">
                  <T>{l}</T>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="container-x py-16">
        <Reveal className="mb-8">
          <h2 className="text-[26px] font-bold sm:text-3xl">
            <T>Browse by category</T>
          </h2>
          <p className="mt-1.5 text-ink-3">
            <T>Roles local employers hire for most often.</T>
          </p>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c, i) => {
            const n = stats.by_category?.[c.name] ?? 0
            const st = categoryStyle(c.slug)
            const Icon = st.icon
            return (
              <Reveal key={c.id} delay={i * 50}>
                <Link href={`/jobs?category=${encodeURIComponent(c.name)}`} className={`group card card-hover flex h-full items-center gap-3.5 bg-gradient-to-br p-4 ${st.tile}`}>
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${st.icon_bg}`}>
                    <Icon size={21} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 leading-snug font-semibold">
                      <T>{c.name}</T>
                    </p>
                    <p className="mt-0.5 text-[13px] text-ink-3">{n > 0 ? <T vars={{ n }}>{'{n} open jobs'}</T> : <T>View roles</T>}</p>
                  </div>
                  <ArrowRight size={16} className="hidden shrink-0 text-ink-4 transition-transform group-hover:translate-x-1 group-hover:text-ink sm:block" />
                </Link>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* Latest */}
      <section className="relative border-y border-line bg-gradient-to-b from-canvas to-white py-16">
        <div className="container-x">
          <Reveal className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[26px] font-bold sm:text-3xl">
                <T>Latest jobs</T>
              </h2>
              <p className="mt-1.5 text-ink-3">
                <T>Fresh openings approved by our team.</T>
              </p>
            </div>
            <Link href="/jobs" className="btn btn-outline btn-sm hidden sm:inline-flex">
              <T>View all jobs</T> <ArrowRight size={15} />
            </Link>
          </Reveal>
          {jobs.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((j, i) => (
                <Reveal key={j.id} delay={(i % 3) * 70}>
                  <JobCard job={j} />
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal className="card flex flex-col items-center gap-4 p-10 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-400 to-brand-500 text-white shadow-[var(--shadow-glow-navy)]">
                <FileSearch size={26} />
              </span>
              <p className="max-w-md text-ink-2">
                <T>New jobs are being reviewed. Subscribe below to hear first.</T>
              </p>
              <Link href="/job-alerts" className="btn btn-navy">
                <T>Get job alerts</T>
              </Link>
            </Reveal>
          )}
          <Link href="/jobs" className="btn btn-outline mt-6 w-full sm:hidden">
            <T>View all jobs</T>
          </Link>
        </div>
      </section>

      {/* Taluks */}
      <section className="container-x py-16">
        <Reveal>
          <h2 className="text-[26px] font-bold sm:text-3xl">
            <T>Jobs near you</T>
          </h2>
          <p className="mt-1.5 text-ink-3">
            <T>Every taluk in Kolar district, with verified localities.</T>
          </p>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TALUKS.map((t, i) => (
            <Reveal key={t} delay={i * 60}>
              <Link href={`/jobs?taluk=${encodeURIComponent(t)}`} className="group card card-hover relative flex h-full flex-col gap-4 overflow-hidden p-4">
                <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${TALUK_TINT[i]}`} />
                <span className={`flex size-9 items-center justify-center rounded-lg bg-gradient-to-br text-white ${TALUK_TINT[i]} transition-transform group-hover:scale-110`}>
                  <MapPin size={17} />
                </span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-[13px] text-ink-3">
                    <T vars={{ n: stats.by_taluk?.[t] ?? 0 }}>{'{n} jobs'}</T>
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-line bg-gradient-to-b from-white to-navy-50/40">
        <div className="container-x grid gap-12 py-16 lg:grid-cols-2">
          {[
            {
              title: 'For job seekers',
              accent: 'from-navy-500 to-sky-400',
              cta: ['Create free profile', '/register'],
              steps: [
                [UserRoundCheck, 'Build your profile once', 'Add experience, skills and your resume. It takes about five minutes.'],
                [FileSearch, 'Apply in one tap', 'Answer any screening questions and apply. No agents, no fees.'],
                [MessageSquareText, 'Track every application', 'See when an employer views, shortlists or invites you to interview.'],
              ],
            },
            {
              title: 'For employers',
              accent: 'from-brand-500 to-saffron-400',
              cta: ['Start hiring free', '/register?role=employer'],
              steps: [
                [Building2, 'Set up your company', 'Get a verified badge after a quick check by our team.'],
                [CheckCircle2, 'Post a job', 'Your first two job posts are free. Most are approved within a few hours.'],
                [BadgeCheck, 'Hire from applicants and the database', 'Shortlist, schedule interviews, message candidates and unlock profiles.'],
              ],
            },
          ].map((col, ci) => (
            <Reveal key={col.title} delay={ci * 120}>
              <h2 className="text-2xl font-bold">
                <T>{col.title}</T>
              </h2>
              <ol className="mt-7 space-y-5">
                {col.steps.map(([Icon, t, d], i) => {
                  const I = Icon as typeof Building2
                  return (
                    <li key={t as string} className="group flex gap-4">
                      <span className={`relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform group-hover:scale-105 ${col.accent}`}>
                        <I size={20} />
                        <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-ink shadow">{i + 1}</span>
                      </span>
                      <div>
                        <p className="font-semibold">
                          <T>{t as string}</T>
                        </p>
                        <p className="mt-0.5 text-sm text-ink-3">
                          <T>{d as string}</T>
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
              <Link href={col.cta[1]} className="btn btn-outline mt-7">
                <T>{col.cta[0]}</T> <ArrowRight size={15} />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Employer band */}
      <section className="container-x py-16">
        <Reveal className="relative overflow-hidden rounded-3xl bg-navy-900 text-white shadow-pop">
          <Image src={employerImg} alt="" fill sizes="100vw" className="object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/85 to-brand-700/60" aria-hidden />
          <div className="relative grid gap-8 p-7 sm:p-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                <T>Hiring in Kolar?</T>
              </h2>
              <p className="mt-3 max-w-xl text-white/75">
                <T>Reach candidates who already live near your factory, hospital or store. Fewer no-shows, faster joining, lower attrition.</T>
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/register?role=employer" className="btn btn-primary btn-lg">
                  <T>Post a job free</T>
                </Link>
                <Link href="/employers#pricing" className="btn btn-glass btn-lg">
                  <T>See pricing</T>
                </Link>
              </div>
            </div>
            <ul className="grid gap-3 text-[15px] text-white/85">
              {['2 free job posts for every new company', 'Applicant tracking with interview scheduling', 'Search and unlock local candidates', 'GST invoices for every purchase'].map((x) => (
                <li key={x} className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-400" /> <T>{x}</T>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* Alerts */}
      <section className="border-t border-line bg-gradient-to-r from-navy-50/60 via-white to-brand-50/50">
        <div className="container-x flex flex-col gap-6 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">
              <T>Get job alerts</T>
            </h2>
            <p className="mt-1 text-sm text-ink-3">
              <T>One email when new jobs match. No spam, unsubscribe in one click.</T>
            </p>
          </div>
          <div className="w-full max-w-md">
            <NewsletterForm />
            <Link href="/job-alerts" className="mt-2 inline-block text-[13px] link">
              <T>Choose taluk and category →</T>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
