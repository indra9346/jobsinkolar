'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export function TagInput({
  value,
  onChange,
  placeholder = 'Type and press Enter',
  suggestions = [],
  max = 20,
  id,
}: {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  suggestions?: readonly string[]
  max?: number
  id?: string
}) {
  const [text, setText] = useState('')
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
  }
  const remaining = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())).slice(0, 8)
  return (
    <div>
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
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add(text)
            } else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1))
          }}
          onBlur={() => text && add(text)}
          placeholder={value.length ? '' : placeholder}
          className="h-7 min-w-[120px] flex-1 bg-transparent px-1 text-sm focus:outline-none"
        />
      </div>
      {remaining.length > 0 && value.length < max && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {remaining.map((s) => (
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
