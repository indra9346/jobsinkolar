import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import img from '@/public/images/kolar-tech.jpg'
import { getStats } from '@/lib/queries'
import { TALUKS } from '@/lib/constants'

export const revalidate = 3600
export const metadata: Metadata = { title: 'About us', description: 'Jobs in Kolar is the local job board for Kolar district, Karnataka.' }

export default async function AboutPage() {
  const s = await getStats()
  return (
    <>
      <section className="container-x grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-16">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">A job board built for Kolar district</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
            Kolar has grown fast — industrial parks in Narasapura and Vemagal, the BEML and KGF belt, hospitals, colleges and thousands of shops. Yet most hiring still happens through word of mouth and agents who charge job seekers. Jobs in Kolar puts every genuine local opening in one place, free for candidates.
          </p>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
            Every employer is checked and every job is read by a person before it goes live. Locations are tied to verified localities in {TALUKS.join(', ')}, so “near me” really means near you.
          </p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line">
          <Image src={img} alt="" fill sizes="(min-width:1024px) 560px, 100vw" className="object-cover" placeholder="blur" />
        </div>
      </section>
      <section className="border-y border-line bg-canvas">
        <div className="container-x grid grid-cols-2 gap-6 py-10 sm:grid-cols-4">
          {[[s.live_jobs, 'Live jobs'], [s.companies, 'Hiring companies'], [s.candidates, 'Registered job seekers'], [TALUKS.length, 'Taluks covered']].map(([n, l]) => (
            <div key={l as string}><p className="text-3xl font-bold tabular-nums">{Number(n).toLocaleString('en-IN')}</p><p className="text-sm text-ink-3">{l}</p></div>
          ))}
        </div>
      </section>
      <section className="container-x grid gap-10 py-14 md:grid-cols-3">
        {[
          ['Free for job seekers', 'Candidates never pay — not to register, apply or be contacted. Jobs that charge fees must declare them, and we warn candidates clearly.'],
          ['Reviewed, not scraped', 'We don’t copy listings from other sites. Each job is submitted by the employer and approved by our moderation team.'],
          ['Private by default', 'Candidate contact details are shared only with employers they apply to, or verified employers who unlock their profile with credits.'],
        ].map(([t, d]) => (
          <div key={t}><h2 className="font-semibold">{t}</h2><p className="mt-2 text-sm text-ink-3">{d}</p></div>
        ))}
      </section>
      <section className="container-x pb-14">
        <div className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium">Have a question, partnership idea or feedback?</p>
          <Link href="/contact" className="btn btn-navy">Contact us</Link>
        </div>
      </section>
    </>
  )
}
