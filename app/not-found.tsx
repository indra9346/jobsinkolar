import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="page-shell" style={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
      <div className="panel" style={{ textAlign: 'center', maxWidth: '520px', padding: '48px 36px' }}>
        <span className="eyebrow" style={{ marginBottom: '16px' }}>404 · PAGE NOT FOUND</span>
        <h1 style={{ fontSize: '32px', margin: '14px 0 10px' }}>Looking for a job in Kolar?</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '28px' }}>
          The page you’re looking for doesn’t exist or has moved. Explore hundreds of verified openings in our jobs directory.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/" className="button button-secondary button-sm">
            <ArrowLeft size={15} /> Back to Home
          </Link>
          <Link href="/jobs" className="button button-primary button-sm">
            <Search size={15} /> Browse Jobs
          </Link>
        </div>
      </div>
    </main>
  )
}
