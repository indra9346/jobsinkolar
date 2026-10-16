'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronRight, HelpCircle, Send, X } from 'lucide-react'
import { SITE } from '@/lib/constants'
import { useAuth } from '@/components/providers'
import { cn } from '@/lib/format'

type Answer = { text: string; links?: [string, string][] }
type Msg = { from: 'me' | 'bot'; text: string; links?: [string, string][] }

const TOPICS: { q: string; keys: string[]; a: Answer }[] = [
  {
    q: 'How do I apply for a job?',
    keys: ['apply', 'application', 'ಅರ್ಜಿ'],
    a: {
      text: 'Open any job and tap "Apply now". You need a free candidate account. Add your resume to your profile first so employers can see it with your application.',
      links: [['Browse jobs', '/jobs'], ['Create account', '/register']],
    },
  },
  {
    q: 'Where can I see my application status?',
    keys: ['status', 'track', 'shortlist', 'interview'],
    a: { text: 'Go to My applications. Each application shows its stage: Applied, Under review, Shortlisted, Interview, Offered or Hired. You also get a notification for every change.', links: [['My applications', '/candidate/applications']] },
  },
  {
    q: 'Is it free for job seekers?',
    keys: ['free', 'fee', 'pay', 'money', 'charge'],
    a: { text: 'Yes. Jobs in Kolar never charges candidates. If any employer asks you for money to get a job, report it to us immediately.', links: [['Safety tips', '/safety'], ['Report a job', '/contact?topic=report']] },
  },
  {
    q: 'How do I post a job?',
    keys: ['post', 'hire', 'employer', 'recruit', 'vacancy'],
    a: { text: 'Create an employer account, then use "Post a job". Every new company gets 2 free job posts. Our team reviews each post, usually within a few hours.', links: [['Employer sign up', '/register?role=employer'], ['Pricing', '/employers#pricing']] },
  },
  {
    q: 'How do I get verified as an employer?',
    keys: ['verify', 'verified', 'badge', 'gst'],
    a: { text: 'Complete your company profile with address, website or GSTIN. Our team checks the details and adds the verified badge. Verified companies can unlock candidates from the database.', links: [['Company profile', '/employer/company']] },
  },
  {
    q: 'I forgot my password',
    keys: ['password', 'login', 'sign in', 'forgot'],
    a: { text: 'Use "Forgot password" on the sign-in page. We will email you a reset link.', links: [['Reset password', '/forgot-password']] },
  },
]

function answer(input: string): Answer {
  const s = input.toLowerCase()
  const hit = TOPICS.find((t) => t.keys.some((k) => s.includes(k)))
  if (hit) return hit.a
  return {
    text: `I couldn't find an answer to that. You can search jobs directly, or write to our team at ${SITE.email} and we'll reply within one working day.`,
    links: [['Search jobs', `/jobs?q=${encodeURIComponent(input.slice(0, 60))}`], ['Contact us', '/contact']],
  }
}

export function HelpWidget() {
  const { profile } = useAuth()
  const pathname = usePathname()
  const onJob = /^\/jobs\/[^/]+$/.test(pathname)
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [msgs])

  const ask = (q: string) => {
    if (!q.trim()) return
    const a = answer(q)
    setMsgs((m) => [...m, { from: 'me', text: q }, { from: 'bot', ...a }])
    setInput('')
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close help' : 'Open help'}
        className={cn('fixed right-4 bottom-4 z-40 h-12 items-center gap-2 rounded-full bg-navy-800 pr-4 pl-3.5 text-sm font-semibold text-white shadow-pop hover:bg-navy-900 sm:right-6 sm:bottom-6', onJob ? 'hidden lg:flex' : 'flex')}
      >
        {open ? <X size={20} /> : <HelpCircle size={20} />}
        <span className="hidden sm:inline">{open ? 'Close' : 'Help'}</span>
      </button>
      {open && (
        <div className="fixed inset-x-3 bottom-20 z-40 flex max-h-[70vh] animate-slide-up flex-col overflow-hidden rounded-xl border border-line bg-white shadow-pop sm:inset-x-auto sm:right-6 sm:bottom-22 sm:w-[380px]">
          <div className="border-b border-line bg-navy-800 px-4 py-3.5 text-white">
            <p className="font-semibold">Help centre</p>
            <p className="text-[13px] text-white/70">Quick answers{profile?.full_name ? ` for ${profile.full_name.split(' ')[0]}` : ''}. Our team replies on email for anything else.</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.length === 0 && (
              <div className="space-y-1.5">
                <p className="mb-2 text-[13px] text-ink-3">Common questions</p>
                {TOPICS.map((t) => (
                  <button key={t.q} onClick={() => ask(t.q)} className="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2.5 text-left text-sm text-ink-2 hover:border-ink-4 hover:text-ink">
                    {t.q} <ChevronRight size={15} className="shrink-0 text-ink-4" />
                  </button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={cn('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm', m.from === 'me' ? 'bg-navy-700 text-white' : 'bg-canvas text-ink')}>
                  <p className="leading-relaxed">{m.text}</p>
                  {m.links && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.links.map(([l, h]) => (
                        <Link key={h} href={h} onClick={() => setOpen(false)} className="rounded-md border border-line bg-white px-2.5 py-1 text-xs font-medium text-navy-700 hover:border-navy-200">
                          {l}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={end} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              ask(input)
            }}
            className="flex gap-2 border-t border-line p-3"
          >
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your question" className="input" aria-label="Your question" />
            <button className="btn btn-navy w-10 shrink-0 px-0" aria-label="Send">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
