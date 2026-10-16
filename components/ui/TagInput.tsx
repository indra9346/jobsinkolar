'use client'

import { useState } from 'react'
import { Hash, X } from 'lucide-react'
import { useServerSuggest, type SuggestKind } from './Autocomplete'
import { cn } from '@/lib/format'

export function TagInput({
  value,
  onChange,
  placeholder = 'Type and press Enter',
  suggestions = [],
  max = 20,
  id,
  kind,
}: {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  suggestions?: readonly string[]
  max?: number
  id?: string
  /** Live suggestions from search_suggest while typing (e.g. 'skill'). */
  kind?: SuggestKind
}) {
  const [text, setText] = useState('')
  const [focus, setFocus] = useState(false)
  const [active, setActive] = useState(-1)
  const server = useServerSuggest(kind, text, focus, 8)
  const has = (s: string) => value.some((v) => v.toLowerCase() === s.toLowerCase())

  const add = (raw: string) => {
    const items = raw.split(',').map((s) => s.trim()).filter(Boolean)
    if (!items.length) return
    const next = [...value]
    for (const it of items) {
      if (next.length >= max) break
      if (!next.some((v) => v.toLowerCase() === it.toLowerCase())) next.push(it.slice(0, 40))
    }
    onChange(next)
    setText('')
    setActive(-1)
  }

  const live = (server.data ?? []).map((s) => s.value).filter((s) => !has(s))
  const typed = text.trim().toLowerCase()
  const localMatches = suggestions.filter((s) => !has(s) && (!typed || s.toLowerCase().includes(typed)))
  const dropdown = Array.from(new Set([...localMatches.filter(() => typed), ...live])).slice(0, 8)
  const chips = suggestions.filter((s) => !has(s)).slice(0, 8)
  const showDrop = focus && kind && dropdown.length > 0 && value.length < max

  return (
    <div className="relative">
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-line bg-white px-2 py-1.5 focus-within:border-navy-500 focus-within:ring-3 focus-within:ring-navy-100">
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-md bg-navy-50 py-0.5 pr-1 pl-2 text-[13px] font-medium text-navy-800">
            {v}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} className="rounded p-0.5 text-navy-600 hover:bg-navy-100" aria-label={`Remove ${v}`}>
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={text}
          role={kind ? 'combobox' : undefined}
          aria-expanded={kind ? Boolean(showDrop) : undefined}
          autoComplete="off"
          onChange={(e) => {
            setText(e.target.value)
            setActive(-1)
          }}
          onFocus={() => setFocus(true)}
          onKeyDown={(e) => {
            if (showDrop && e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => Math.min(dropdown.length - 1, a + 1))
            } else if (showDrop && e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(-1, a - 1))
            } else if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add(showDrop && active >= 0 ? dropdown[active] : text)
            } else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1))
            else if (e.key === 'Escape') setFocus(false)
          }}
          onBlur={() => {
            setFocus(false)
            if (text) add(text)
          }}
          placeholder={value.length ? '' : placeholder}
          className="h-7 min-w-[120px] flex-1 bg-transparent px-1 text-sm focus:outline-none"
        />
      </div>
      {showDrop && (
        <ul role="listbox" className="absolute top-full right-0 left-0 z-40 mt-1 max-h-64 overflow-y-auto rounded-lg border border-line bg-white py-1 shadow-pop">
          {dropdown.map((s, i) => (
            <li
              key={s}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault()
                add(s)
              }}
              onMouseEnter={() => setActive(i)}
              className={cn('flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-ink-2', i === active && 'bg-canvas text-ink')}
            >
              <Hash size={14} className="text-ink-4" /> {s}
            </li>
          ))}
        </ul>
      )}
      {!kind && chips.length > 0 && value.length < max && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="rounded-md border border-dashed border-line px-2 py-0.5 text-xs text-ink-3 hover:border-ink-4 hover:text-ink">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ChipSelect({ options, value, onChange, max }: { options: readonly string[]; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o)
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== o) : max && value.length >= max ? value : [...value, o])}
            className={
              on
                ? 'rounded-full border border-navy-600 bg-navy-50 px-3 py-1 text-[13px] font-medium text-navy-800'
                : 'rounded-full border border-line px-3 py-1 text-[13px] text-ink-2 hover:border-ink-4'
            }
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}
