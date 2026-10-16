import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarClock, Check, ClipboardCheck, Search, ShieldCheck, Users } from 'lucide-react'
import img from '@/public/images/kolar-manufacturing.jpg'
import { getPublicSupabase } from '@/lib/supabase/server'
import { getStats } from '@/lib/queries'
import { formatINR } from '@/lib/format'
import type { Plan } from '@/lib/types'

export const revalidate = 300
export const metadata: Metadata = { title: 'Hire in Kolar — for employers', description: 'Post jobs, track applicants and search local candidates in Kolar district. First two job posts free.' }

export default async function EmployersPage() {
  const [{ data }, stats] = await Promise.all([getPublicSupabase().from('plans').select('*').eq('active', true).order('sort_order'), getStats()])
  const plans = (data ?? []) as Plan[]

  return (
    <>
      <section className="border-b border-line">
        <div className="container-x grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-16">
          <div>
            <p className="text-sm font-semibold text-brand-700">For employers</p>
            <h1 className="mt-2 text-[34px] leading-tight font-bold tracking-tight sm:text-[44px]">Hire people who live near your workplace.</h1>
            <p className="mt-4 max-w-lg text-[17px] text-ink-3">Jobs in Kolar reaches {stats.candidates > 50 ? `${stats.candidates.toLocaleString('en-IN')} registered job seekers` : 'job seekers'} across all six taluks. Post a job, shortlist in one tap, schedule interviews and message candidates from one place.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register?role=employer" className="btn btn-primary btn-lg">Post a job free</Link>
              <Link href="#pricing" className="btn btn-outline btn-lg">See pricing</Link>
            </div>
            <p className="mt-3 text-[13px] text-ink-3">No card needed. 2 free job posts and 5 profile unlocks for every new company.</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line">
            <Image src={img} alt="Manufacturing floor in Kolar" fill sizes="(min-width:1024px) 560px, 100vw" className="object-cover" placeholder="blur" priority />
          </div>
        </div>
      </section>

      <section className="container-x py-14">
        <h2 className="text-2xl font-semibold">Everything you need to hire locally</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [ClipboardCheck, 'Guided job posts', 'A four-step form that covers salary, shifts, requirements and interview details, so candidates know exactly what to expect.'],
            [Users, 'Applicant tracking', 'Action pending, shortlisted, interview, offered, hired — every applicant in one pipeline with one-tap triage.'],
            [CalendarClock, 'Interview scheduling', 'Send date, mode and address in one step. Candidates are notified instantly and can reply in chat.'],
            [Search, 'Candidate database', 'Filter local job seekers by role, experience, taluk and joining time. Unlock contact details with credits.'],
            [ShieldCheck, 'Verified badge', 'Our team checks every company. Verified employers get more applications and trust from candidates.'],
            [Check, 'Screening questions', 'Ask up to five questions. Answers appear next to each applicant so you can shortlist faster.'],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Users
            return (
              <div key={t as string} className="card p-5">
                <I size={20} className="text-navy-600" />
                <p className="mt-3 font-semibold">{t as string}</p>
                <p className="mt-1 text-sm text-ink-3">{d as string}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section id="pricing" className="scroll-mt-20 border-t border-line bg-canvas py-14">
        <div className="container-x">
          <h2 className="text-2xl font-semibold">Simple pricing</h2>
          <p className="mt-1 text-sm text-ink-3">Prices exclude 18% GST. Every purchase comes with a GST invoice.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((p) => (
              <div key={p.id} className={`card flex flex-col p-5 ${p.highlight ? 'border-navy-600 ring-1 ring-navy-600' : ''}`}>
                <p className="font-semibold">{p.name}</p>
                <p className="text-[13px] text-ink-3">{p.tagline}</p>
                <p className="mt-4 text-3xl font-bold tracking-tight">{p.price_inr ? formatINR(p.price_inr) : 'Free'}</p>
                <p className="text-xs text-ink-3">{p.price_inr ? `valid ${p.validity_days} days` : 'one-time welcome credits'}</p>
                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" /> {p.job_credits} job posts</li>
                  <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" /> {p.unlock_credits} profile unlocks</li>
                  <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" /> Jobs live {p.job_duration_days} days</li>
                  {p.featured_jobs && <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" /> Featured placement</li>}
                </ul>
                <Link href={p.price_inr ? '/employer/billing' : '/register?role=employer'} className={`btn mt-6 w-full ${p.highlight ? 'btn-navy' : 'btn-outline'}`}>{p.price_inr ? 'Choose plan' : 'Start free'}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-14">
        <h2 className="text-2xl font-semibold">Questions employers ask</h2>
        <div className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-2">
          {[
            ['How long does approval take?', 'Most job posts are reviewed within a few working hours. You get a notification as soon as yours is live, or a note explaining what to change.'],
            ['What happens if my job is rejected?', 'You see the reason, edit the post and resubmit. Resubmitting never uses another credit.'],
            ['What is a profile unlock?', 'Unlocking a candidate from the database reveals their phone, email and documents. Candidates who apply to your jobs are always free to contact.'],
            ['Do credits expire?', 'Free welcome credits never expire. Paid credits are valid for the plan period; renewing before expiry carries remaining credits forward.'],
          ].map(([q, a]) => (
            <div key={q}>
              <p className="font-medium">{q}</p>
              <p className="mt-1 text-sm text-ink-3">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
