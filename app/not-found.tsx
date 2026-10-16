import Link from 'next/link'
import { Logo } from '@/components/site/Logo'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo />
      <p className="mt-10 text-sm font-semibold text-brand-700">404</p>
      <h1 className="mt-2 text-2xl font-semibold">This page isn’t here</h1>
      <p className="mt-2 max-w-sm text-ink-3">The job may have closed, or the link may be wrong.</p>
      <div className="mt-6 flex gap-2">
        <Link href="/jobs" className="btn btn-navy">Browse jobs</Link>
        <Link href="/" className="btn btn-outline">Home</Link>
      </div>
    </div>
  )
}
