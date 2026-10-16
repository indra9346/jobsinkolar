'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Search } from 'lucide-react'
import { Spinner } from '@/components/ui/bits'
import { Autocomplete, type SuggestKind, type Suggestion } from '@/components/ui/Autocomplete'

/** URL-backed search box with typeahead (local options and/or a server suggestion kind). */
export function ApplicantSearch({
  initial,
  placeholder = 'Search name, role, skill or location',
  kind,
  options,
}: {
  initial: string
  placeholder?: string
  kind?: SuggestKind
  options?: Suggestion[]
}) {
  const [q, setQ] = useState(initial)
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()

  const apply = (v: string) => {
    const p = new URLSearchParams(params.toString())
    if (v.trim()) p.set('q', v.trim())
    else p.delete('q')
    p.delete('page')
    start(() => router.replace(`${pathname}${p.size ? `?${p}` : ''}`, { scroll: false }))
  }

  useEffect(() => {
    if (q === (params.get('q') ?? '')) return
    const t = setTimeout(() => apply(q), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  return (
    <div className="relative w-full sm:max-w-xs">
      <Autocomplete
        value={q}
        onChange={setQ}
        onSelect={(s) => apply(s.value)}
        onEnter={apply}
        kind={kind}
        options={options}
        placeholder={placeholder}
        ariaLabel={placeholder}
        icon={<Search size={16} />}
        openOnFocus={Boolean(kind) || Boolean(options?.length)}
      />
      {pending && <Spinner size={14} className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-3" />}
    </div>
  )
}
