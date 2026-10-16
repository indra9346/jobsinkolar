'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import { TALUKS } from '@/lib/constants'
import { T, useLang } from '@/lib/i18n'
import { Autocomplete, locationOptions, useLocations, type Suggestion } from '@/components/ui/Autocomplete'

type Loc = { taluk?: string; area?: string; label: string }

export function SearchBar({
  initialQ = '',
  initialTaluk = '',
  initialArea = '',
  initialCategory = '',
  size = 'lg',
}: {
  initialQ?: string
  initialTaluk?: string
  initialArea?: string
  initialCategory?: string
  size?: 'lg' | 'md'
}) {
  const router = useRouter()
  const { t } = useLang()
  const { data: areas = [] } = useLocations()
  const initialAreaName = areas.find((a) => a.id === initialArea)?.name
  const [q, setQ] = useState(initialQ || initialCategory)
  const [category, setCategory] = useState(initialCategory)
  const [locText, setLocText] = useState<string | null>(null)
  const [loc, setLoc] = useState<Loc>({ taluk: initialTaluk || undefined, area: initialArea || undefined, label: initialTaluk })
  const opts = useMemo(() => locationOptions(areas, TALUKS), [areas])
  const locValue = locText ?? (initialAreaName ?? loc.label ?? '')

  const go = (over?: { q?: string; category?: string; loc?: Loc }) => {
    const p = new URLSearchParams()
    const cat = over?.category ?? category
    const kw = over?.q ?? q
    if (cat) p.set('category', cat)
    else if (kw.trim()) p.set('q', kw.trim())
    let l = over?.loc ?? loc
    // Free-typed location: resolve to a taluk or locality when it matches.
    if (!over?.loc && locText !== null) {
      const typed = locText.trim().toLowerCase()
      const hit = typed ? opts.find((o) => o.value.toLowerCase() === typed) ?? opts.find((o) => o.value.toLowerCase().startsWith(typed)) : undefined
      l = hit ? { label: hit.value, taluk: hit.data?.taluk, area: hit.type === 'area' ? hit.data?.id : undefined } : { label: '' }
    }
    if (l.area) p.set('area', l.area)
    else if (l.taluk) p.set('taluk', l.taluk)
    router.push(`/jobs${p.size ? `?${p}` : ''}`)
  }

  const onKeywordSelect = (s: Suggestion) => {
    if (s.type === 'category') {
      setCategory(s.value)
      go({ category: s.value, q: '' })
    } else {
      setCategory('')
      go({ q: s.value, category: '' })
    }
  }

  const onLocSelect = (s: Suggestion) => {
    const next = { label: s.value, taluk: s.data?.taluk, area: s.type === 'area' ? s.data?.id : undefined }
    setLoc(next)
    setLocText(null)
  }

  const h = size === 'lg' ? 'h-12 sm:h-14' : 'h-11'
  const inputCls = `h-full w-full min-w-0 bg-transparent pl-10 pr-3 text-[15px] text-ink placeholder:text-ink-4 focus:outline-none`
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        go()
      }}
      role="search"
      className="flex flex-col gap-2 rounded-xl border border-line bg-white p-1.5 shadow-card sm:flex-row sm:items-center sm:gap-0"
    >
      <Autocomplete
        kind="job"
        value={q}
        onChange={(v) => {
          setQ(v)
          setCategory('')
        }}
        onSelect={onKeywordSelect}
        onEnter={() => go()}
        placeholder={t('Job title, skill or company')}
        ariaLabel="Job title, skill or company"
        icon={<Search size={19} />}
        className={`flex-1 ${h}`}
        inputClassName={inputCls}
      />
      <span className="hidden h-7 w-px bg-line sm:block" />
      <Autocomplete
        value={locValue}
        onChange={(v) => setLocText(v)}
        onSelect={onLocSelect}
        options={opts}
        limit={10}
        placeholder={t('All taluks')}
        ariaLabel="Taluk or locality"
        icon={<MapPin size={19} />}
        className={`border-t border-line-2 sm:w-60 sm:border-0 ${h}`}
        inputClassName={inputCls}
        showType={false}
      />
      <button className={`btn btn-primary ${size === 'lg' ? 'h-12 px-7 text-[15px]' : 'h-11 px-5'}`}>
        <T>Search</T>
      </button>
    </form>
  )
}
