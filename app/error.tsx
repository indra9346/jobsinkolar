'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-ink-3">Please try again. If it keeps happening, check your connection or contact us.</p>
      <div className="mt-6 flex gap-2">
        <button onClick={reset} className="btn btn-navy">Try again</button>
        <Link href="/" className="btn btn-outline">Home</Link>
      </div>
    </div>
  )
}
