import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Mail, MessageCircle, Phone } from 'lucide-react'
import { ContactForm } from './ContactForm'
import { SITE } from '@/lib/constants'

export const metadata: Metadata = { title: 'Contact us' }

export default function ContactPage() {
  return (
    <div className="container-x grid gap-10 py-12 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="text-3xl font-semibold">Contact us</h1>
        <p className="mt-2 text-ink-3">We reply within one working day, Monday to Saturday.</p>
        <div className="mt-8 max-w-2xl">
          <Suspense>
            <ContactForm />
          </Suspense>
        </div>
      </div>
      <aside className="space-y-4">
        <div className="card p-5">
          <p className="font-semibold">Other ways to reach us</p>
          <ul className="mt-3 space-y-3 text-sm">
            <li><a href={`mailto:${SITE.email}`} className="flex items-center gap-2.5 link"><Mail size={16} /> {SITE.email}</a></li>
            {SITE.phone && <li><a href={`tel:${SITE.phone}`} className="flex items-center gap-2.5 link"><Phone size={16} /> {SITE.phone}</a></li>}
            {SITE.whatsapp && <li><a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 link"><MessageCircle size={16} /> WhatsApp</a></li>}
          </ul>
        </div>
        <div className="card p-5 text-sm text-ink-2">
          <p className="font-semibold text-ink">Report a fake job</p>
          <p className="mt-1">If anyone asks you for money to get a job, choose “Report a job” in the form. We investigate every report and remove fraudulent employers.</p>
        </div>
      </aside>
    </div>
  )
}
