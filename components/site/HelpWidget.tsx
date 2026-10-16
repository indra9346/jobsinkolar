'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRight, ChevronRight, HelpCircle, RotateCcw, Send, X } from 'lucide-react'
import { SITE } from '@/lib/constants'
import { useAuth } from '@/components/providers'
import { cn } from '@/lib/format'
import { useLang } from '@/lib/i18n'

type Lang = 'en' | 'kn'
type Bi = Record<Lang, string>
type Role = 'guest' | 'candidate' | 'employer' | 'admin'
type LinkFor = { label: Bi; href: string | Partial<Record<Role, string>> }
type Topic = { id: string; q: Bi; keys: string[]; a: Bi; links: LinkFor[]; next: string[] }
type Msg = { from: 'me' | 'bot'; text: string; links?: { label: string; href: string }[]; next?: string[] }

// Links can depend on who is asking, so every follow-up lands on a page that works for them.
const TOPICS: Topic[] = [
  {
    id: 'apply',
    q: { en: 'How do I apply for a job?', kn: 'ಉದ್ಯೋಗಕ್ಕೆ ಅರ್ಜಿ ಹೇಗೆ ಸಲ್ಲಿಸುವುದು?' },
    keys: ['apply', 'application', 'ಅರ್ಜಿ'],
    a: {
      en: 'Open any job and tap "Apply now". You need a free job-seeker account. Add your resume to your profile first so employers see it with your application.',
      kn: 'ಯಾವುದೇ ಉದ್ಯೋಗ ತೆರೆದು "ಈಗ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ" ಒತ್ತಿ. ಇದಕ್ಕೆ ಉಚಿತ ಖಾತೆ ಬೇಕು. ಮೊದಲು ಪ್ರೊಫೈಲ್‌ಗೆ ರೆಸ್ಯೂಮ್ ಸೇರಿಸಿ.',
    },
    links: [
      { label: { en: 'Browse jobs', kn: 'ಉದ್ಯೋಗ ನೋಡಿ' }, href: '/jobs' },
      { label: { en: 'Create account', kn: 'ಖಾತೆ ತೆರೆಯಿರಿ' }, href: { guest: '/register' } },
      { label: { en: 'Add my resume', kn: 'ರೆಸ್ಯೂಮ್ ಸೇರಿಸಿ' }, href: { candidate: '/candidate/profile#resume' } },
    ],
    next: ['status', 'free', 'alerts'],
  },
  {
    id: 'status',
    q: { en: 'Where can I see my application status?', kn: 'ನನ್ನ ಅರ್ಜಿಯ ಸ್ಥಿತಿ ಎಲ್ಲಿ ನೋಡಬಹುದು?' },
    keys: ['status', 'track', 'shortlist', 'ಸ್ಥಿತಿ'],
    a: {
      en: 'Go to My applications. Each application shows its stage — Applied, Under review, Shortlisted, Interview, Offered or Hired — and you get a notification for every change.',
      kn: '"ನನ್ನ ಅರ್ಜಿಗಳು" ವಿಭಾಗದಲ್ಲಿ ಪ್ರತಿ ಅರ್ಜಿಯ ಹಂತ ಕಾಣುತ್ತದೆ. ಪ್ರತಿ ಬದಲಾವಣೆಗೆ ಅಧಿಸೂಚನೆ ಬರುತ್ತದೆ.',
    },
    links: [{ label: { en: 'My applications', kn: 'ನನ್ನ ಅರ್ಜಿಗಳು' }, href: { candidate: '/candidate/applications', guest: '/login?next=/candidate/applications' } }],
    next: ['interview', 'withdraw', 'messages'],
  },
  {
    id: 'interview',
    q: { en: 'Where are my interview details?', kn: 'ನನ್ನ ಸಂದರ್ಶನದ ವಿವರ ಎಲ್ಲಿದೆ?' },
    keys: ['interview', 'ಸಂದರ್ಶನ'],
    a: {
      en: 'When an employer schedules an interview you get a notification. The date, time, mode and address appear at the top of that application and on your dashboard.',
      kn: 'ಸಂದರ್ಶನ ನಿಗದಿಯಾದಾಗ ಅಧಿಸೂಚನೆ ಬರುತ್ತದೆ. ದಿನಾಂಕ, ಸಮಯ ಮತ್ತು ವಿಳಾಸ ಆ ಅರ್ಜಿಯಲ್ಲಿ ಮತ್ತು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಕಾಣುತ್ತದೆ.',
    },
    links: [{ label: { en: 'My dashboard', kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' }, href: { candidate: '/candidate', guest: '/login?next=/candidate' } }],
    next: ['messages', 'status'],
  },
  {
    id: 'messages',
    q: { en: 'Can I message the employer?', kn: 'ಉದ್ಯೋಗದಾತರಿಗೆ ಸಂದೇಶ ಕಳುಹಿಸಬಹುದೇ?' },
    keys: ['message', 'chat', 'contact employer', 'ಸಂದೇಶ'],
    a: {
      en: 'Yes — once an employer shortlists you or writes to you first, you can reply in Messages. HR contact details also appear after you apply.',
      kn: 'ಹೌದು — ಉದ್ಯೋಗದಾತರು ನಿಮ್ಮನ್ನು ಆಯ್ಕೆ ಮಾಡಿದ ನಂತರ ಅಥವಾ ಮೊದಲು ಬರೆದ ನಂತರ "ಸಂದೇಶಗಳು" ವಿಭಾಗದಲ್ಲಿ ಉತ್ತರಿಸಬಹುದು.',
    },
    links: [{ label: { en: 'Open messages', kn: 'ಸಂದೇಶಗಳು' }, href: { candidate: '/candidate/messages', employer: '/employer/messages', guest: '/login' } }],
    next: ['status', 'free'],
  },
  {
    id: 'withdraw',
    q: { en: 'How do I withdraw an application?', kn: 'ಅರ್ಜಿಯನ್ನು ಹಿಂಪಡೆಯುವುದು ಹೇಗೆ?' },
    keys: ['withdraw', 'cancel application', 'ಹಿಂಪಡೆ'],
    a: {
      en: 'Open the application in My applications and choose "Withdraw application". The employer is told, and you can’t re-apply to that job.',
      kn: '"ನನ್ನ ಅರ್ಜಿಗಳು"ನಲ್ಲಿ ಅರ್ಜಿ ತೆರೆದು "ಅರ್ಜಿ ಹಿಂಪಡೆಯಿರಿ" ಆಯ್ಕೆಮಾಡಿ. ಆ ಉದ್ಯೋಗಕ್ಕೆ ಮತ್ತೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗುವುದಿಲ್ಲ.',
    },
    links: [{ label: { en: 'My applications', kn: 'ನನ್ನ ಅರ್ಜಿಗಳು' }, href: { candidate: '/candidate/applications', guest: '/login?next=/candidate/applications' } }],
    next: ['status'],
  },
  {
    id: 'free',
    q: { en: 'Is it free for job seekers?', kn: 'ಉದ್ಯೋಗಾಕಾಂಕ್ಷಿಗಳಿಗೆ ಇದು ಉಚಿತವೇ?' },
    keys: ['free', 'fee', 'pay', 'money', 'charge', 'ಉಚಿತ', 'ಹಣ', 'ಶುಲ್ಕ'],
    a: {
      en: 'Yes. Jobs in Kolar never charges candidates. If any employer asks you for money to get a job, report it to us immediately.',
      kn: 'ಹೌದು. ಜಾಬ್ಸ್ ಇನ್ ಕೋಲಾರ ಅಭ್ಯರ್ಥಿಗಳಿಂದ ಎಂದಿಗೂ ಹಣ ಪಡೆಯುವುದಿಲ್ಲ. ಯಾರಾದರೂ ಹಣ ಕೇಳಿದರೆ ತಕ್ಷಣ ತಿಳಿಸಿ.',
    },
    links: [
      { label: { en: 'Safety tips', kn: 'ಸುರಕ್ಷತಾ ಸಲಹೆಗಳು' }, href: '/safety' },
      { label: { en: 'Report a job', kn: 'ಉದ್ಯೋಗ ವರದಿ ಮಾಡಿ' }, href: '/contact?topic=report' },
    ],
    next: ['report', 'apply'],
  },
  {
    id: 'report',
    q: { en: 'How do I report a fake job?', kn: 'ನಕಲಿ ಉದ್ಯೋಗವನ್ನು ವರದಿ ಮಾಡುವುದು ಹೇಗೆ?' },
    keys: ['report', 'fake', 'fraud', 'scam', 'ವರದಿ', 'ನಕಲಿ'],
    a: {
      en: 'Use "Report this job" on the job page, or the contact form with the topic "Report a job". Our team reviews every report and removes fraudulent employers.',
      kn: 'ಉದ್ಯೋಗ ಪುಟದಲ್ಲಿ "ಈ ಉದ್ಯೋಗವನ್ನು ವರದಿ ಮಾಡಿ" ಬಳಸಿ, ಅಥವಾ ಸಂಪರ್ಕ ಫಾರ್ಮ್‌ನಲ್ಲಿ "ಉದ್ಯೋಗ ವರದಿ" ಆಯ್ಕೆಮಾಡಿ.',
    },
    links: [{ label: { en: 'Report a job', kn: 'ಉದ್ಯೋಗ ವರದಿ ಮಾಡಿ' }, href: '/contact?topic=report' }],
    next: ['free'],
  },
  {
    id: 'alerts',
    q: { en: 'Can I get new jobs by email?', kn: 'ಹೊಸ ಉದ್ಯೋಗಗಳು ಇಮೇಲ್‌ನಲ್ಲಿ ಬರಬಹುದೇ?' },
    keys: ['alert', 'email', 'notify', 'subscribe', 'ಎಚ್ಚರಿಕೆ'],
    a: {
      en: 'Yes. Create a job alert for a taluk and category — we email you once when a matching job is approved. Unsubscribe from any email in one click.',
      kn: 'ಹೌದು. ತಾಲೂಕು ಮತ್ತು ವರ್ಗಕ್ಕೆ ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆ ರಚಿಸಿ — ಹೊಂದುವ ಉದ್ಯೋಗ ಬಂದಾಗ ಇಮೇಲ್ ಬರುತ್ತದೆ.',
    },
    links: [{ label: { en: 'Create job alert', kn: 'ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆ ರಚಿಸಿ' }, href: { candidate: '/candidate/alerts', guest: '/job-alerts', employer: '/job-alerts' } }],
    next: ['apply'],
  },
  {
    id: 'post',
    q: { en: 'How do I post a job?', kn: 'ಉದ್ಯೋಗ ಹೇಗೆ ಪ್ರಕಟಿಸುವುದು?' },
    keys: ['post', 'hire', 'employer', 'recruit', 'vacancy', 'ಪ್ರಕಟ', 'ನೇಮಕ'],
    a: {
      en: 'Create an employer account, then use "Post a job". Every new company gets 2 free job posts. Our team reviews each post, usually within a few hours.',
      kn: 'ಉದ್ಯೋಗದಾತ ಖಾತೆ ತೆರೆದು "ಉದ್ಯೋಗ ಪ್ರಕಟಿಸಿ" ಬಳಸಿ. ಪ್ರತಿ ಹೊಸ ಕಂಪನಿಗೆ 2 ಉಚಿತ ಪ್ರಕಟಣೆಗಳು.',
    },
    links: [
      { label: { en: 'Post a job', kn: 'ಉದ್ಯೋಗ ಪ್ರಕಟಿಸಿ' }, href: { employer: '/employer/post-job', guest: '/register?role=employer' } },
      { label: { en: 'Pricing', kn: 'ದರಗಳು' }, href: '/employers#pricing' },
    ],
    next: ['verify', 'credits', 'database'],
  },
  {
    id: 'verify',
    q: { en: 'How do I get verified as an employer?', kn: 'ಉದ್ಯೋಗದಾತರಾಗಿ ಪರಿಶೀಲನೆ ಹೇಗೆ?' },
    keys: ['verify', 'verified', 'badge', 'gst', 'ಪರಿಶೀಲ'],
    a: {
      en: 'Complete your company profile with address, industry and a short description; a GSTIN or website speeds it up. Our team checks it and adds the verified badge.',
      kn: 'ವಿಳಾಸ, ಉದ್ಯಮ ಮತ್ತು ವಿವರಣೆ ಸಹಿತ ಕಂಪನಿ ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ. ನಮ್ಮ ತಂಡ ಪರಿಶೀಲಿಸಿ ಬ್ಯಾಡ್ಜ್ ನೀಡುತ್ತದೆ.',
    },
    links: [{ label: { en: 'Company profile', kn: 'ಕಂಪನಿ ಪ್ರೊಫೈಲ್' }, href: { employer: '/employer/company', guest: '/register?role=employer' } }],
    next: ['database', 'post'],
  },
  {
    id: 'database',
    q: { en: 'How does the candidate database work?', kn: 'ಅಭ್ಯರ್ಥಿ ಡೇಟಾಬೇಸ್ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?' },
    keys: ['database', 'unlock', 'search candidates', 'ಡೇಟಾಬೇಸ್', 'ಅನ್‌ಲಾಕ್'],
    a: {
      en: 'Verified employers can search local job seekers by role, experience, taluk and joining time. Unlocking a profile uses 1 credit and reveals phone, email and documents. Applicants to your jobs are always free to contact.',
      kn: 'ಪರಿಶೀಲಿತ ಉದ್ಯೋಗದಾತರು ಸ್ಥಳೀಯ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ಹುಡುಕಬಹುದು. ಪ್ರೊಫೈಲ್ ಅನ್‌ಲಾಕ್‌ಗೆ 1 ಕ್ರೆಡಿಟ್ ಬೇಕು.',
    },
    links: [{ label: { en: 'Candidate database', kn: 'ಅಭ್ಯರ್ಥಿ ಡೇಟಾಬೇಸ್' }, href: { employer: '/employer/talent', guest: '/register?role=employer' } }],
    next: ['credits', 'verify'],
  },
  {
    id: 'credits',
    q: { en: 'How do credits and plans work?', kn: 'ಕ್ರೆಡಿಟ್ ಮತ್ತು ಪ್ಲಾನ್‌ಗಳು ಹೇಗೆ?' },
    keys: ['credit', 'plan', 'price', 'invoice', 'billing', 'ಕ್ರೆಡಿಟ್', 'ದರ'],
    a: {
      en: 'Submitting a job uses 1 job credit (resubmitting after changes is free). Unlocking a candidate uses 1 unlock credit. Paid plans add credits with a GST invoice.',
      kn: 'ಉದ್ಯೋಗ ಸಲ್ಲಿಕೆಗೆ 1 ಕ್ರೆಡಿಟ್, ಅಭ್ಯರ್ಥಿ ಅನ್‌ಲಾಕ್‌ಗೆ 1 ಕ್ರೆಡಿಟ್. ಪಾವತಿಸಿದ ಪ್ಲಾನ್‌ಗಳಿಗೆ GST ಇನ್‌ವಾಯ್ಸ್ ಸಿಗುತ್ತದೆ.',
    },
    links: [{ label: { en: 'Credits & billing', kn: 'ಕ್ರೆಡಿಟ್ ಮತ್ತು ಬಿಲ್ಲಿಂಗ್' }, href: { employer: '/employer/billing', guest: '/employers#pricing' } }],
    next: ['post', 'database'],
  },
  {
    id: 'password',
    q: { en: 'I forgot my password', kn: 'ನಾನು ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿದ್ದೇನೆ' },
    keys: ['password', 'login', 'sign in', 'forgot', 'ಪಾಸ್‌ವರ್ಡ್', 'ಲಾಗಿನ್'],
    a: { en: 'Use "Forgot password" on the sign-in page. We will email you a reset link.', kn: 'ಲಾಗಿನ್ ಪುಟದಲ್ಲಿ "ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?" ಬಳಸಿ. ಮರುಹೊಂದಿಸುವ ಲಿಂಕ್ ಇಮೇಲ್‌ಗೆ ಬರುತ್ತದೆ.' },
    links: [{ label: { en: 'Reset password', kn: 'ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ' }, href: '/forgot-password' }],
    next: ['apply', 'post'],
  },
]

const STARTERS: Record<Role, string[]> = {
  guest: ['apply', 'free', 'post', 'alerts', 'password'],
  candidate: ['status', 'interview', 'messages', 'alerts', 'free'],
  employer: ['post', 'verify', 'database', 'credits', 'messages'],
  admin: ['post', 'database', 'credits'],
}

const byId = (id: string) => TOPICS.find((t) => t.id === id)
const STORE = 'jik-help-v1'

export function HelpWidget() {
  const { profile, user } = useAuth()
  const { lang, t } = useLang()
  const pathname = usePathname()
  const onJob = /^\/jobs\/[^/]+$/.test(pathname)
  const role: Role = !user ? 'guest' : profile?.is_admin ? 'admin' : (profile?.role as Role) ?? 'candidate'
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const end = useRef<HTMLDivElement>(null)

  // Keep the conversation across page changes in this tab.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORE)
      if (saved) setMsgs(JSON.parse(saved))
    } catch {}
  }, [])
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-30)))
    } catch {}
  }, [msgs])
  useEffect(() => {
    if (open) end.current?.scrollIntoView({ block: 'end' })
  }, [msgs, open])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const linkFor = (l: LinkFor) => {
    if (typeof l.href === 'string') return l.href
    return l.href[role] ?? l.href.guest ?? null
  }

  const reply = (topic: Topic | undefined, asked: string): Msg => {
    if (topic) {
      return {
        from: 'bot',
        text: topic.a[lang],
        links: topic.links.flatMap((l) => {
          const href = linkFor(l)
          return href ? [{ label: l.label[lang], href }] : []
        }),
        next: topic.next,
      }
    }
    return {
      from: 'bot',
      text:
        lang === 'kn'
          ? `ಇದಕ್ಕೆ ನಿಖರ ಉತ್ತರ ಸಿಗಲಿಲ್ಲ. ನೇರವಾಗಿ ಹುಡುಕಬಹುದು, ಅಥವಾ ${SITE.email} ಗೆ ಬರೆಯಿರಿ — ಒಂದು ಕೆಲಸದ ದಿನದಲ್ಲಿ ಉತ್ತರಿಸುತ್ತೇವೆ.`
          : `I couldn't find an exact answer. You can search directly, or write to ${SITE.email} — we reply within one working day.`,
      links: [
        { label: lang === 'kn' ? 'ಉದ್ಯೋಗ ಹುಡುಕಿ' : 'Search jobs', href: `/jobs?q=${encodeURIComponent(asked.slice(0, 60))}` },
        { label: lang === 'kn' ? 'ಸಂಪರ್ಕಿಸಿ' : 'Contact us', href: '/contact' },
      ],
      next: STARTERS[role].slice(0, 3),
    }
  }

  const askTopic = (id: string) => {
    const topic = byId(id)
    if (!topic) return
    setMsgs((m) => [...m, { from: 'me', text: topic.q[lang] }, reply(topic, topic.q[lang])])
  }

  const askText = (q: string) => {
    const text = q.trim()
    if (!text) return
    const s = text.toLowerCase()
    const topic = TOPICS.find((tp) => tp.keys.some((k) => s.includes(k)))
    setMsgs((m) => [...m, { from: 'me', text }, reply(topic, text)])
    setInput('')
  }

  const lastBot = [...msgs].reverse().find((m) => m.from === 'bot')

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close help' : 'Open help'}
        aria-expanded={open}
        className={cn(
          'fixed right-4 bottom-4 z-40 h-12 items-center gap-2 rounded-full bg-gradient-to-b from-navy-600 to-navy-800 pr-4 pl-3.5 text-sm font-semibold text-white shadow-pop transition-transform hover:-translate-y-0.5 active:scale-95 sm:right-6 sm:bottom-6',
          onJob ? 'hidden lg:flex' : 'flex',
        )}
      >
        {open ? <X size={20} /> : <HelpCircle size={20} />}
        <span className="hidden sm:inline">{open ? t('Close') : t('Help')}</span>
      </button>
      {open && (
        <div role="dialog" aria-label={t('Help centre')} className="fixed inset-x-3 bottom-20 z-40 flex max-h-[72vh] animate-slide-up flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-pop sm:inset-x-auto sm:right-6 sm:bottom-22 sm:w-[390px]">
          <div className="relative overflow-hidden bg-gradient-to-br from-navy-700 to-navy-900 px-4 py-3.5 text-white">
            <span className="absolute -top-10 -right-8 size-28 rounded-full bg-brand-500/30 blur-2xl" aria-hidden />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{t('Help centre')}</p>
                <p className="text-[13px] text-white/70">{t('Quick answers. Our team replies on email for anything else.')}</p>
              </div>
              {msgs.length > 0 && (
                <button onClick={() => setMsgs([])} className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Start over" title="Start over">
                  <RotateCcw size={15} />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.length === 0 && (
              <div className="space-y-1.5">
                <p className="mb-2 text-[13px] text-ink-3">{t('Common questions')}</p>
                {STARTERS[role].map((id) => {
                  const tp = byId(id)!
                  return (
                    <button key={id} onClick={() => askTopic(id)} className="flex w-full items-center justify-between rounded-xl border border-line px-3 py-2.5 text-left text-sm text-ink-2 transition-all hover:-translate-y-px hover:border-navy-200 hover:bg-navy-50/50 hover:text-ink">
                      {tp.q[lang]} <ChevronRight size={15} className="shrink-0 text-ink-4" />
                    </button>
                  )
                })}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={cn('flex animate-slide-up', m.from === 'me' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm', m.from === 'me' ? 'rounded-br-md bg-navy-700 text-white' : 'rounded-bl-md bg-canvas text-ink')}>
                  <p className="leading-relaxed">{m.text}</p>
                  {m.links && m.links.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {m.links.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center gap-1 rounded-lg border border-navy-100 bg-white px-2.5 py-1 text-xs font-semibold text-navy-700 transition-all hover:-translate-y-px hover:border-navy-300 hover:shadow-sm"
                        >
                          {l.label} <ArrowRight size={12} />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {lastBot?.next && lastBot.next.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {lastBot.next.map((id) => {
                  const tp = byId(id)
                  return tp ? (
                    <button key={id} onClick={() => askTopic(id)} className="rounded-full border border-line bg-white px-3 py-1 text-xs text-ink-2 transition-colors hover:border-navy-200 hover:bg-navy-50 hover:text-navy-800">
                      {tp.q[lang]}
                    </button>
                  ) : null
                })}
              </div>
            )}
            <div ref={end} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              askText(input)
            }}
            className="flex gap-2 border-t border-line p-3"
          >
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('Type your question')} className="input" aria-label={t('Type your question')} />
            <button className="btn btn-navy w-10 shrink-0 px-0" aria-label="Send" disabled={!input.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
