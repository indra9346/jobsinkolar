'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronRight, HelpCircle, Send, X } from 'lucide-react'
import { SITE } from '@/lib/constants'
import { useAuth } from '@/components/providers'
import { cn } from '@/lib/format'
import { useLang } from '@/lib/i18n'

type Lang = 'en' | 'kn'
type Bi = Record<Lang, string>
type Answer = { text: string; links?: [string, string][] }
type Msg = { from: 'me' | 'bot'; text: string; links?: [string, string][] }

const TOPICS: { q: Bi; keys: string[]; a: Bi; links: [Bi, string][] }[] = [
  {
    q: { en: 'How do I apply for a job?', kn: 'ಉದ್ಯೋಗಕ್ಕೆ ಅರ್ಜಿ ಹೇಗೆ ಸಲ್ಲಿಸುವುದು?' },
    keys: ['apply', 'application', 'ಅರ್ಜಿ'],
    a: {
      en: 'Open any job and tap "Apply now". You need a free candidate account. Add your resume to your profile first so employers can see it with your application.',
      kn: 'ಯಾವುದೇ ಉದ್ಯೋಗ ತೆರೆದು "ಈಗ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ" ಒತ್ತಿ. ಇದಕ್ಕೆ ಉಚಿತ ಅಭ್ಯರ್ಥಿ ಖಾತೆ ಬೇಕು. ಮೊದಲು ಪ್ರೊಫೈಲ್‌ಗೆ ರೆಸ್ಯೂಮ್ ಸೇರಿಸಿ, ಉದ್ಯೋಗದಾತರು ಅದನ್ನು ನೋಡುತ್ತಾರೆ.',
    },
    links: [[{ en: 'Browse jobs', kn: 'ಉದ್ಯೋಗ ನೋಡಿ' }, '/jobs'], [{ en: 'Create account', kn: 'ಖಾತೆ ತೆರೆಯಿರಿ' }, '/register']],
  },
  {
    q: { en: 'Where can I see my application status?', kn: 'ನನ್ನ ಅರ್ಜಿಯ ಸ್ಥಿತಿ ಎಲ್ಲಿ ನೋಡಬಹುದು?' },
    keys: ['status', 'track', 'shortlist', 'interview', 'ಸ್ಥಿತಿ', 'ಸಂದರ್ಶನ'],
    a: {
      en: 'Go to My applications. Each application shows its stage: Applied, Under review, Shortlisted, Interview, Offered or Hired. You also get a notification for every change.',
      kn: '"ನನ್ನ ಅರ್ಜಿಗಳು" ವಿಭಾಗಕ್ಕೆ ಹೋಗಿ. ಪ್ರತಿ ಅರ್ಜಿಯ ಹಂತ ಕಾಣುತ್ತದೆ: ಸಲ್ಲಿಸಲಾಗಿದೆ, ಪರಿಶೀಲನೆಯಲ್ಲಿ, ಆಯ್ಕೆಯಾಗಿದೆ, ಸಂದರ್ಶನ, ಆಫರ್ ಅಥವಾ ನೇಮಕ. ಪ್ರತಿ ಬದಲಾವಣೆಗೆ ಅಧಿಸೂಚನೆ ಬರುತ್ತದೆ.',
    },
    links: [[{ en: 'My applications', kn: 'ನನ್ನ ಅರ್ಜಿಗಳು' }, '/candidate/applications']],
  },
  {
    q: { en: 'Is it free for job seekers?', kn: 'ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳಿಗೆ ಇದು ಉಚಿತವೇ?' },
    keys: ['free', 'fee', 'pay', 'money', 'charge', 'ಉಚಿತ', 'ಹಣ', 'ಶುಲ್ಕ'],
    a: {
      en: 'Yes. Jobs in Kolar never charges candidates. If any employer asks you for money to get a job, report it to us immediately.',
      kn: 'ಹೌದು. ಜಾಬ್ಸ್ ಇನ್ ಕೋಲಾರ ಅಭ್ಯರ್ಥಿಗಳಿಂದ ಎಂದಿಗೂ ಹಣ ಪಡೆಯುವುದಿಲ್ಲ. ಯಾರಾದರೂ ಉದ್ಯೋಗಕ್ಕಾಗಿ ಹಣ ಕೇಳಿದರೆ ತಕ್ಷಣ ನಮಗೆ ತಿಳಿಸಿ.',
    },
    links: [[{ en: 'Safety tips', kn: 'ಸುರಕ್ಷತಾ ಸಲಹೆಗಳು' }, '/safety'], [{ en: 'Report a job', kn: 'ಉದ್ಯೋಗ ವರದಿ ಮಾಡಿ' }, '/contact?topic=report']],
  },
  {
    q: { en: 'How do I post a job?', kn: 'ಉದ್ಯೋಗ ಹೇಗೆ ಪ್ರಕಟಿಸುವುದು?' },
    keys: ['post', 'hire', 'employer', 'recruit', 'vacancy', 'ಪ್ರಕಟ', 'ನೇಮಕ'],
    a: {
      en: 'Create an employer account, then use "Post a job". Every new company gets 2 free job posts. Our team reviews each post, usually within a few hours.',
      kn: 'ಉದ್ಯೋಗದಾತ ಖಾತೆ ತೆರೆದು "ಉದ್ಯೋಗ ಪ್ರಕಟಿಸಿ" ಬಳಸಿ. ಪ್ರತಿ ಹೊಸ ಕಂಪನಿಗೆ 2 ಉಚಿತ ಪ್ರಕಟಣೆಗಳು. ನಮ್ಮ ತಂಡ ಸಾಮಾನ್ಯವಾಗಿ ಕೆಲವೇ ಗಂಟೆಗಳಲ್ಲಿ ಪರಿಶೀಲಿಸುತ್ತದೆ.',
    },
    links: [[{ en: 'Employer sign up', kn: 'ಉದ್ಯೋಗದಾತ ನೋಂದಣಿ' }, '/register?role=employer'], [{ en: 'Pricing', kn: 'ದರಗಳು' }, '/employers#pricing']],
  },
  {
    q: { en: 'How do I get verified as an employer?', kn: 'ಉದ್ಯೋಗದಾತರಾಗಿ ಪರಿಶೀಲನೆ ಹೇಗೆ?' },
    keys: ['verify', 'verified', 'badge', 'gst', 'ಪರಿಶೀಲ'],
    a: {
      en: 'Complete your company profile with address, website or GSTIN. Our team checks the details and adds the verified badge. Verified companies can unlock candidates from the database.',
      kn: 'ವಿಳಾಸ, ವೆಬ್‌ಸೈಟ್ ಅಥವಾ GSTIN ಸಹಿತ ಕಂಪನಿ ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ. ನಮ್ಮ ತಂಡ ಪರಿಶೀಲಿಸಿ ಬ್ಯಾಡ್ಜ್ ನೀಡುತ್ತದೆ. ಪರಿಶೀಲಿತ ಕಂಪನಿಗಳು ಡೇಟಾಬೇಸ್‌ನಿಂದ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ಅನ್‌ಲಾಕ್ ಮಾಡಬಹುದು.',
    },
    links: [[{ en: 'Company profile', kn: 'ಕಂಪನಿ ಪ್ರೊಫೈಲ್' }, '/employer/company']],
  },
  {
    q: { en: 'I forgot my password', kn: 'ನಾನು ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿದ್ದೇನೆ' },
    keys: ['password', 'login', 'sign in', 'forgot', 'ಪಾಸ್‌ವರ್ಡ್', 'ಲಾಗಿನ್'],
    a: { en: 'Use "Forgot password" on the sign-in page. We will email you a reset link.', kn: 'ಲಾಗಿನ್ ಪುಟದಲ್ಲಿ "ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?" ಬಳಸಿ. ಮರುಹೊಂದಿಸುವ ಲಿಂಕ್ ಇಮೇಲ್‌ಗೆ ಬರುತ್ತದೆ.' },
    links: [[{ en: 'Reset password', kn: 'ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ' }, '/forgot-password']],
  },
]

function answer(input: string, lang: Lang): Answer {
  const s = input.toLowerCase()
  const hit = TOPICS.find((t) => t.keys.some((k) => s.includes(k)) || t.q.en.toLowerCase() === s || t.q.kn === input)
  if (hit) return { text: hit.a[lang], links: hit.links.map(([l, h]) => [l[lang], h]) }
  return lang === 'kn'
    ? {
        text: `ಇದಕ್ಕೆ ಉತ್ತರ ಸಿಗಲಿಲ್ಲ. ನೇರವಾಗಿ ಉದ್ಯೋಗ ಹುಡುಕಬಹುದು, ಅಥವಾ ${SITE.email} ಗೆ ಬರೆಯಿರಿ — ಒಂದು ಕೆಲಸದ ದಿನದಲ್ಲಿ ಉತ್ತರಿಸುತ್ತೇವೆ.`,
        links: [['ಉದ್ಯೋಗ ಹುಡುಕಿ', `/jobs?q=${encodeURIComponent(input.slice(0, 60))}`], ['ಸಂಪರ್ಕಿಸಿ', '/contact']],
      }
    : {
        text: `I couldn't find an answer to that. You can search jobs directly, or write to our team at ${SITE.email} and we'll reply within one working day.`,
        links: [['Search jobs', `/jobs?q=${encodeURIComponent(input.slice(0, 60))}`], ['Contact us', '/contact']],
      }
}

export function HelpWidget() {
  const { profile } = useAuth()
  const { lang, t } = useLang()
  const pathname = usePathname()
  const onJob = /^\/jobs\/[^/]+$/.test(pathname)
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [msgs])

  const ask = (q: string) => {
    if (!q.trim()) return
    const a = answer(q, lang)
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
        <span className="hidden sm:inline">{open ? t('Close') : t('Help')}</span>
      </button>
      {open && (
        <div className="fixed inset-x-3 bottom-20 z-40 flex max-h-[70vh] animate-slide-up flex-col overflow-hidden rounded-xl border border-line bg-white shadow-pop sm:inset-x-auto sm:right-6 sm:bottom-22 sm:w-[380px]">
          <div className="border-b border-line bg-navy-800 px-4 py-3.5 text-white">
            <p className="font-semibold">{t('Help centre')}</p>
            <p className="text-[13px] text-white/70">{t('Quick answers. Our team replies on email for anything else.')}</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.length === 0 && (
              <div className="space-y-1.5">
                <p className="mb-2 text-[13px] text-ink-3">{t('Common questions')}</p>
                {TOPICS.map((t) => (
                  <button key={t.q.en} onClick={() => ask(t.q[lang])} className="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2.5 text-left text-sm text-ink-2 hover:border-ink-4 hover:text-ink">
                    {t.q[lang]} <ChevronRight size={15} className="shrink-0 text-ink-4" />
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
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('Type your question')} className="input" aria-label="Your question" />
            <button className="btn btn-navy w-10 shrink-0 px-0" aria-label="Send">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
