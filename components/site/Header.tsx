'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
import { Logo } from './Logo'
import { useAuth } from '@/components/providers'
import { NotificationBell } from '@/components/NotificationBell'
import { Avatar } from '@/components/ui/bits'
import { getSupabase } from '@/lib/supabase/client'
import { T, useLang } from '@/lib/i18n'
import { cn } from '@/lib/format'

const NAV = [
  { href: '/jobs', label: 'Find jobs' },
  { href: '/companies', label: 'Companies' },
  { href: '/employers', label: 'For employers' },
  { href: '/about', label: 'About' },
]

export function portalHome(role?: string, isAdmin?: boolean) {
  if (isAdmin || role === 'admin') return '/admin'
  return role === 'employer' ? '/employer' : '/candidate'
}

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang()
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
      className={cn('rounded-md px-2 py-1 text-[13px] font-medium text-ink-3 hover:bg-canvas hover:text-ink', className)}
      aria-label="Switch language"
    >
      {lang === 'en' ? 'ಕನ್ನಡ' : 'English'}
    </button>
  )
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, ready } = useAuth()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])
  useEffect(() => {
    if (!menu) return
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menu])

  const home = portalHome(profile?.role, profile?.is_admin)
  const isEmployer = profile?.role === 'employer'

  const signOut = async () => {
    await getSupabase().auth.signOut()
    setMenu(false)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="container-x flex h-16 items-center gap-6">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'rounded-md px-3 py-2 text-[14px] font-medium transition-colors',
                pathname.startsWith(n.href) ? 'text-ink' : 'text-ink-3 hover:text-ink',
              )}
            >
              <T>{n.label}</T>
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <LangToggle className="hidden sm:block" />
          {!ready ? (
            <div className="h-9 w-40" />
          ) : user ? (
            <>
              {isEmployer && (
                <Link href="/employer/post-job" className="btn btn-primary btn-sm mr-1 hidden sm:inline-flex">
                  <T>Post a job</T>
                </Link>
              )}
              <NotificationBell allHref={`${home}/notifications`} />
              <div ref={menuRef} className="relative hidden lg:block">
                <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-1.5 rounded-lg p-1 pr-2 hover:bg-canvas" aria-expanded={menu}>
                  <Avatar name={profile?.full_name || user.email} size={30} />
                  <ChevronDown size={15} className="text-ink-3" />
                </button>
                {menu && (
                  <div className="absolute right-0 mt-2 w-60 animate-slide-up rounded-xl border border-line bg-white p-1.5 shadow-pop">
                    <div className="border-b border-line px-3 pt-2 pb-2.5">
                      <p className="truncate text-sm font-semibold">{profile?.full_name || 'Your account'}</p>
                      <p className="truncate text-xs text-ink-3">{user.email}</p>
                    </div>
                    <Link href={home} onClick={() => setMenu(false)} className="mt-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-2 hover:bg-canvas hover:text-ink">
                      <LayoutDashboard size={16} /> <T>Dashboard</T>
                    </Link>
                    <button onClick={signOut} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-2 hover:bg-canvas hover:text-ink">
                      <LogOut size={16} /> <T>Sign out</T>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn btn-ghost btn-sm hidden sm:inline-flex">
                <T>Sign in</T>
              </Link>
              <Link href="/register" className="btn btn-navy btn-sm hidden sm:inline-flex">
                <T>Create account</T>
              </Link>
            </>
          )}
          <button onClick={() => setOpen(true)} className="flex size-9 items-center justify-center rounded-lg text-ink-2 hover:bg-canvas lg:hidden" aria-label="Open menu">
            <Menu size={21} />
          </button>
        </div>
      </div>

      {open && createPortal(
        // Portalled to <body>: the header's backdrop-filter would otherwise trap this fixed overlay inside the 64px header.
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal>
          <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[min(86vw,340px)] animate-fade-in flex-col bg-white shadow-pop">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <Logo />
              <button onClick={() => setOpen(false)} className="flex size-9 items-center justify-center rounded-lg hover:bg-canvas" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            {user && (
              <div className="flex items-center gap-3 border-b border-line px-4 py-4">
                <Avatar name={profile?.full_name || user.email} size={40} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{profile?.full_name || 'Your account'}</p>
                  <p className="truncate text-xs text-ink-3">{user.email}</p>
                </div>
              </div>
            )}
            <nav className="flex-1 overflow-y-auto p-2">
              {user && (
                <Link href={home} className="flex items-center gap-3 rounded-lg px-3 py-3 font-medium text-ink hover:bg-canvas">
                  <LayoutDashboard size={18} className="text-ink-3" /> <T>Dashboard</T>
                </Link>
              )}
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-3 font-medium text-ink-2 hover:bg-canvas hover:text-ink">
                  <T>{n.label}</T>
                </Link>
              ))}
              <Link href="/contact" className="block rounded-lg px-3 py-3 font-medium text-ink-2 hover:bg-canvas hover:text-ink">
                <T>Contact</T>
              </Link>
            </nav>
            <div className="grid gap-2 border-t border-line p-4">
              <LangToggle className="justify-self-start" />
              {user ? (
                <>
                  {isEmployer && (
                    <Link href="/employer/post-job" className="btn btn-primary">
                      <T>Post a job</T>
                    </Link>
                  )}
                  <button onClick={signOut} className="btn btn-outline">
                    <T>Sign out</T>
                  </button>
                </>
              ) : (
                <>
                  <Link href="/register" className="btn btn-navy">
                    <T>Create account</T>
                  </Link>
                  <Link href="/login" className="btn btn-outline">
                    <T>Sign in</T>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </header>
  )
}
