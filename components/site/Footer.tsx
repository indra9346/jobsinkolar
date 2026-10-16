import Link from 'next/link'
import { Logo } from './Logo'
import { SITE, TALUKS } from '@/lib/constants'
import { NewsletterForm } from './NewsletterForm'
import { T } from '@/lib/i18n'
import { MadeBy } from './MadeBy'

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
    <footer className="relative border-t border-line bg-gradient-to-b from-canvas to-navy-50/50">
      <div className="h-1 bg-gradient-to-r from-navy-600 via-brand-500 to-saffron-400" aria-hidden />
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-ink-3">
            <T>The local job board for Kolar district. Every employer and every listing is reviewed by our team before it goes live.</T>
          </p>
          <div className="mt-5">
            <p className="mb-2 text-[13px] font-semibold text-ink">
              <T>Weekly job alerts</T>
            </p>
            <NewsletterForm />
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-[13px] font-semibold text-ink">
              <T>{c.title}</T>
            </p>
            <ul className="mt-3 space-y-2.5">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-ink-3 transition-colors hover:text-navy-700">
                    <T>{label}</T>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-3 py-5 text-[13px] text-ink-3 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} Jobs in Kolar. <T>Made in Kolar, Karnataka.</T>
          </p>
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            {TALUKS.map((t) => (
              <Link key={t} href={`/jobs?taluk=${encodeURIComponent(t)}`} className="hover:text-navy-700">
                <T vars={{ t }}>{'Jobs in {t}'}</T>
              </Link>
            ))}
          </p>
          <a href={`mailto:${SITE.email}`} className="hover:text-ink">
            {SITE.email}
          </a>
        </div>
      </div>
      <div className="relative overflow-hidden bg-[#07070b]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_120%_at_50%_100%,rgba(255,59,92,0.22),transparent_70%)]" aria-hidden />
        <div className="relative container-x flex justify-center py-6">
          <MadeBy />
        </div>
      </div>
    </footer>
  )
}
