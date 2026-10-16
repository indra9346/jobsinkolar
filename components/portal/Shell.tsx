'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Bell, Bookmark, Briefcase, Building2, ClipboardList, CreditCard, FileCheck2, FileText, Gauge, Inbox, LayoutDashboard,
  ListChecks, LogOut, MapPinned, Megaphone, MessageSquare, MoreHorizontal, PlusCircle, ScrollText, Search, Settings, UserRound, Users, X, BarChart3,
} from 'lucide-react'
import { Logo } from '@/components/site/Logo'
import { NotificationBell } from '@/components/NotificationBell'
import { Avatar } from '@/components/ui/bits'
import { getSupabase } from '@/lib/supabase/client'
import { cn } from '@/lib/format'
import { T } from '@/lib/i18n'
import { LangToggle } from '@/components/site/Header'

type Item = { href: string; label: string; icon: typeof Bell; exact?: boolean; mobile?: boolean }

export const NAV: Record<'candidate' | 'employer' | 'admin', { label?: string; items: Item[] }[]> = {
  candidate: [
    {
      items: [
        { href: '/candidate', label: 'Overview', icon: LayoutDashboard, exact: true, mobile: true },
        { href: '/jobs', label: 'Browse jobs', icon: Search, mobile: true },
        { href: '/candidate/applications', label: 'My applications', icon: ClipboardList, mobile: true },
        { href: '/candidate/saved', label: 'Saved jobs', icon: Bookmark },
        { href: '/candidate/messages', label: 'Messages', icon: MessageSquare, mobile: true },
      ],
    },
    {
      label: 'Account',
      items: [
        { href: '/candidate/profile', label: 'Profile', icon: UserRound },
        { href: '/candidate/documents', label: 'Documents', icon: FileText },
        { href: '/candidate/alerts', label: 'Job alerts', icon: Megaphone },
        { href: '/candidate/notifications', label: 'Notifications', icon: Bell },
        { href: '/candidate/settings', label: 'Settings', icon: Settings },
      ],
    },
  ],
  employer: [
    {
      items: [
        { href: '/employer', label: 'Overview', icon: LayoutDashboard, exact: true, mobile: true },
        { href: '/employer/post-job', label: 'Post a job', icon: PlusCircle },
        { href: '/employer/jobs', label: 'Jobs', icon: Briefcase, mobile: true },
        { href: '/employer/applications', label: 'Applicants', icon: Users, mobile: true },
        { href: '/employer/talent', label: 'Candidate database', icon: Search },
        { href: '/employer/messages', label: 'Messages', icon: MessageSquare, mobile: true },
      ],
    },
    {
      label: 'Business',
      items: [
        { href: '/employer/company', label: 'Company profile', icon: Building2 },
        { href: '/employer/billing', label: 'Credits & billing', icon: CreditCard },
        { href: '/employer/reports', label: 'Reports', icon: BarChart3 },
        { href: '/employer/notifications', label: 'Notifications', icon: Bell },
        { href: '/employer/settings', label: 'Settings', icon: Settings },
      ],
    },
  ],
  admin: [
    {
      items: [
        { href: '/admin', label: 'Overview', icon: Gauge, exact: true, mobile: true },
        { href: '/admin/jobs', label: 'Job moderation', icon: ListChecks, mobile: true },
        { href: '/admin/employers', label: 'Employers', icon: Building2, mobile: true },
        { href: '/admin/candidates', label: 'Candidates', icon: Users },
        { href: '/admin/applications', label: 'Applications', icon: ClipboardList },
        { href: '/admin/documents', label: 'Documents', icon: FileCheck2, mobile: true },
      ],
    },
    {
      label: 'Operations',
      items: [
        { href: '/admin/payments', label: 'Payments & credits', icon: CreditCard },
        { href: '/admin/areas', label: 'Areas', icon: MapPinned },
        { href: '/admin/alerts', label: 'Job alert emails', icon: Megaphone },
        { href: '/admin/inbox', label: 'Contact inbox', icon: Inbox },
        { href: '/admin/audit', label: 'Audit log', icon: ScrollText },
        { href: '/admin/notifications', label: 'Notifications', icon: Bell },
      ],
    },
  ],
}

function isActive(pathname: string, item: Item) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/')
}

export function Shell({
  role,
  name,
  email,
  badges = {},
  banner,
  children,
}: {
  role: 'candidate' | 'employer' | 'admin'
  name: string
  email: string
  badges?: Record<string, number>
  banner?: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [more, setMore] = useState(false)
  const groups = NAV[role]
  const all = groups.flatMap((g) => g.items)
  const mobile = all.filter((i) => i.mobile).slice(0, 4)

  useEffect(() => setMore(false), [pathname])

  const signOut = async () => {
    await getSupabase().auth.signOut()
    window.location.assign('/')
  }

  const roleLabel = role === 'admin' ? 'Admin console' : role === 'employer' ? 'Employer' : 'Job seeker'

  const navList = (onClick?: () => void) =>
    groups.map((g, gi) => (
      <div key={gi} className={gi ? 'mt-6' : ''}>
        {g.label && <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-ink-4 uppercase">{g.label}</p>}
        <ul className="space-y-0.5">
          {g.items.map((it) => {
            const active = isActive(pathname, it)
            const Icon = it.icon
            const n = badges[it.href]
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  onClick={onClick}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors',
                    active ? 'bg-navy-50 text-navy-800' : 'text-ink-2 hover:bg-canvas hover:text-ink',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={18} className={active ? 'text-navy-600' : 'text-ink-4'} />
                  <span className="flex-1 truncate">
                    <T>{it.label}</T>
                  </span>
                  {n ? <span className="rounded-full bg-brand-600 px-1.5 text-[11px] leading-[18px] font-semibold text-white tabular-nums">{n > 99 ? '99+' : n}</span> : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    ))

  return (
    <div className="min-h-dvh bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-line px-5">
          <Logo href={role === 'admin' ? '/admin' : '/'} />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Portal">
          {navList()}
        </nav>
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar name={name || email} size={34} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name || 'Your account'}</p>
              <p className="truncate text-xs text-ink-3">{roleLabel}</p>
            </div>
            <button onClick={signOut} className="rounded-md p-1.5 text-ink-3 hover:bg-canvas hover:text-ink" aria-label="Sign out" title="Sign out">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6 lg:h-16">
          <div className="lg:hidden">
            <Logo compact href={role === 'admin' ? '/admin' : '/'} />
          </div>
          <p className="hidden text-sm text-ink-3 lg:block">{roleLabel}</p>
          <div className="ml-auto flex items-center gap-1">
            {role === 'employer' && (
              <Link href="/employer/post-job" className="btn btn-primary btn-sm mr-1 hidden sm:inline-flex">
                <PlusCircle size={15} /> <T>Post a job</T>
              </Link>
            )}
            <LangToggle className="hidden sm:block" />
            {role !== 'admin' && (
              <Link href="/" className="btn btn-ghost btn-sm hidden md:inline-flex">
                View site
              </Link>
            )}
            <NotificationBell allHref={`/${role}/notifications`} />
          </div>
        </header>
        {banner}
        <main className="mx-auto w-full max-w-[1160px] px-4 pt-6 pb-28 sm:px-6 lg:pb-12">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Portal">
        {mobile.map((it) => {
          const Icon = it.icon
          const active = isActive(pathname, it)
          return (
            <Link key={it.href} href={it.href} className={cn('relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium', active ? 'text-navy-700' : 'text-ink-3')}>
              <Icon size={20} />
              <span className="max-w-full truncate px-1">
                <T>{it.label.replace('My applications', 'Applied').replace('Candidate database', 'Database').replace('Job moderation', 'Moderate')}</T>
              </span>
              {badges[it.href] ? <span className="absolute top-1.5 left-1/2 ml-2 size-2 rounded-full bg-brand-600" /> : null}
            </Link>
          )
        })}
        <button onClick={() => setMore(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-ink-3">
          <MoreHorizontal size={20} />
          More
        </button>
      </nav>

      {more && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal>
          <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={() => setMore(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] animate-slide-up overflow-y-auto rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <Avatar name={name || email} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{name || 'Your account'}</p>
                <p className="truncate text-xs text-ink-3">{email}</p>
              </div>
              <button onClick={() => setMore(false)} className="rounded-md p-1.5 hover:bg-canvas" aria-label="Close">
                <X size={19} />
              </button>
            </div>
            <nav className="p-3">{navList(() => setMore(false))}</nav>
            <div className="flex items-center justify-between border-t border-line p-3">
              <LangToggle />
              <button onClick={signOut} className="btn btn-outline btn-sm">
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
