import Link from 'next/link'
import { Logo } from './Logo'
import { SITE, TALUKS } from '@/lib/constants'
import { NewsletterForm } from './NewsletterForm'

const cols = [
  {
    title: 'Job seekers',
    links: [
      ['Browse jobs', '/jobs'],
      ['Companies hiring', '/companies'],
      ['Job alerts', '/job-alerts'],
      ['Create profile', '/register'],
      ['Safety tips', '/safety'],
    ],
  },
  {
    title: 'Employers',
    links: [
      ['Why Jobs in Kolar', '/employers'],
      ['Post a job', '/employer/post-job'],
      ['Search candidates', '/employer/talent'],
      ['Pricing', '/employers#pricing'],
      ['Employer sign up', '/register?role=employer'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About us', '/about'],
      ['Contact', '/contact'],
      ['Suggest an area', '/suggest-area'],
      ['Privacy policy', '/privacy'],
      ['Terms of use', '/terms'],
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-ink-3">
            The local job board for Kolar district. Every employer and every listing is reviewed by our team before it goes live.
          </p>
          <div className="mt-5">
            <p className="mb-2 text-[13px] font-semibold text-ink">Weekly job alerts</p>
            <NewsletterForm />
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-[13px] font-semibold text-ink">{c.title}</p>
            <ul className="mt-3 space-y-2.5">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-ink-3 hover:text-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-3 py-5 text-[13px] text-ink-3 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Jobs in Kolar. Made in Kolar, Karnataka.</p>
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            {TALUKS.map((t) => (
              <Link key={t} href={`/jobs?taluk=${encodeURIComponent(t)}`} className="hover:text-ink">
                Jobs in {t}
              </Link>
            ))}
          </p>
          <a href={`mailto:${SITE.email}`} className="hover:text-ink">
            {SITE.email}
          </a>
        </div>
      </div>
    </footer>
  )
}
