'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, Building2, Hash, MapPin, Search, Tag, UserRound } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { cn } from '@/lib/format'

export type Suggestion = { value: string; type: string; hint?: string; hits?: number; data?: Record<string, string> }
export type SuggestKind = 'job' | 'title' | 'skill' | 'company' | 'talent' | 'candidate'

const ICONS: Record<string, typeof Search> = {
  title: Briefcase,
  role: Briefcase,
  company: Building2,
  category: Tag,
  skill: Hash,
  taluk: MapPin,
  area: MapPin,
  candidate: UserRound,
}
const LABEL: Record<string, string> = { title: 'Job title', role: 'Role', company: 'Company', category: 'Category', skill: 'Skill', taluk: 'Taluk', area: 'Locality', candidate: 'Candidate' }

function useDebounced<T>(v: T, ms = 160) {
  const [d, setD] = useState(v)
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms)
    return () => clearTimeout(t)
  }, [v, ms])
  return d
}

/** Server suggestions from the search_suggest RPC, cached per query. */
export function useServerSuggest(kind: SuggestKind | undefined, q: string, enabled: boolean, limit = 8) {
  const dq = useDebounced(q.trim())
  return useQuery({
    queryKey: ['suggest', kind, dq, limit],
    enabled: Boolean(kind) && enabled,
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const { data } = await getSupabase().rpc('search_suggest', { p_q: dq, p_kind: kind, p_limit: limit })
      return ((data ?? []) as { value: string; type: string; hits: number }[]).map((r): Suggestion => ({ value: r.value, type: r.type, hits: r.hits }))
    },
  })
}

function Highlight({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-semibold text-ink">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

/**
 * Text input with a suggestion list. Suggestions come from `kind` (server) and/or
 * `options` (local, filtered as you type). Enter on free text submits it as typed.
 */
export function Autocomplete({
  value,
  onChange,
  onSelect,
  onEnter,
  kind,
  options,
  placeholder,
  id,
  className,
  inputClassName,
  icon,
  limit = 8,
  openOnFocus = true,
  ariaLabel,
  showType = true,
}: {
  value: string
  onChange: (v: string) => void
  onSelect?: (s: Suggestion) => void
  onEnter?: (v: string) => void
  kind?: SuggestKind
  options?: Suggestion[]
  placeholder?: string
  id?: string
  className?: string
  inputClassName?: string
  icon?: React.ReactNode
  limit?: number
  openOnFocus?: boolean
  ariaLabel?: string
  showType?: boolean
}) {
  const auto = useId()
  const listId = `${id ?? auto}-list`
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const wrap = useRef<HTMLDivElement>(null)
  const server = useServerSuggest(kind, value, open, limit)

  const items = useMemo(() => {
    const q = value.trim().toLowerCase()
    const local = (options ?? [])
      .filter((o) => !q || o.value.toLowerCase().includes(q) || o.hint?.toLowerCase().includes(q))
      .sort((a, b) => Number(b.value.toLowerCase().startsWith(q)) - Number(a.value.toLowerCase().startsWith(q)))
    const seen = new Set<string>()
    const out: Suggestion[] = []
    for (const s of [...local, ...(server.data ?? [])]) {
      const k = s.value.toLowerCase() + '|' + (s.data?.id ?? '')
      if (seen.has(k) || (q && s.value.toLowerCase() === q && !s.data)) continue
      seen.add(k)
      out.push(s)
      if (out.length >= limit) break
    }
    return out
  }, [options, server.data, value, limit])

  useEffect(() => {
    setActive(-1)
  }, [value])
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const choose = (s: Suggestion) => {
    onChange(s.value)
    onSelect?.(s)
    setOpen(false)
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((a) => Math.min(items.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(-1, a - 1))
    } else if (e.key === 'Enter') {
      if (open && active >= 0 && items[active]) {
        e.preventDefault()
        choose(items[active])
      } else if (onEnter) {
        e.preventDefault()
        setOpen(false)
        onEnter(value)
      } else setOpen(false)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const q = value.trim()
  return (
    <div ref={wrap} className={cn('relative', className)}>
      <div className="relative flex h-full items-center">
        {icon && <span className="pointer-events-none absolute left-3 text-ink-4">{icon}</span>}
        <input
          id={id}
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-label={ariaLabel}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => openOnFocus && setOpen(true)}
          onKeyDown={onKey}
          className={cn(inputClassName ?? 'input', Boolean(icon) && !inputClassName && 'pl-9')}
        />
      </div>
      {open && items.length > 0 && (
        <ul id={listId} role="listbox" className="absolute top-full right-0 left-0 z-50 mt-1 max-h-80 animate-fade-in overflow-y-auto rounded-lg border border-line bg-white py-1 text-left shadow-pop">
          {items.map((s, i) => {
            const Icon = ICONS[s.type] ?? Search
            return (
              <li
                key={`${s.type}-${s.value}-${s.data?.id ?? ''}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(s)
                }}
                onMouseEnter={() => setActive(i)}
                className={cn('flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-ink-2', i === active && 'bg-canvas text-ink')}
              >
                <Icon size={15} className="shrink-0 text-ink-4" />
                <span className="min-w-0 flex-1 truncate">
                  <Highlight text={s.value} q={q} />
                  {s.hint && <span className="ml-1.5 text-xs text-ink-4">{s.hint}</span>}
                </span>
                {showType && (
                  <span className="shrink-0 text-[11px] text-ink-4">
                    {s.hits ? `${s.hits} job${s.hits === 1 ? '' : 's'}` : LABEL[s.type] ?? ''}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** Taluks + verified localities, loaded once and shared by every location box. */
export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    staleTime: 60 * 60_000,
    queryFn: async () => {
      const { data } = await getSupabase().from('areas').select('id,name,taluk,pincode').eq('active', true).eq('verified', true).order('name')
      return (data ?? []) as { id: string; name: string; taluk: string; pincode: string | null }[]
    },
  })
}

export function locationOptions(areas: { id: string; name: string; taluk: string; pincode: string | null }[], taluks: readonly string[]): Suggestion[] {
  return [
    ...taluks.map((t) => ({ value: t, type: 'taluk', hint: 'whole taluk', data: { taluk: t } })),
    ...areas.map((a) => ({ value: a.name, type: 'area', hint: [a.taluk, a.pincode].filter(Boolean).join(' · '), data: { id: a.id, taluk: a.taluk } })),
  ]
}
