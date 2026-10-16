'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Search } from 'lucide-react'
import { Spinner } from '@/components/ui/bits'

export function ApplicantSearch({ initial, placeholder = 'Search name, role, skill or location' }: { initial: string; placeholder?: string }) {
  const [q, setQ] = useState(initial)
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()

  useEffect(() => {
    if (q === (params.get('q') ?? '')) return
    const t = setTimeout(() => {
      const p = new URLSearchParams(params.toString())
      if (q.trim()) p.set('q', q.trim())
      else p.delete('q')
      start(() => router.replace(`${pathname}${p.size ? `?${p}` : ''}`, { scroll: false }))
    }, 300)
    return () => clearTimeout(t)
  }, [q, params, pathname, router])

  return (
    <label className="relative block w-full sm:max-w-xs">
      <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-4" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="input pl-9" aria-label="Search" />
      {pending && <Spinner size={14} className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-3" />}
    </label>
  )
}
