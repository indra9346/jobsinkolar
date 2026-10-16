'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { EMPLOYMENT_TYPES, TALUKS, WORK_MODES } from '@/lib/constants'
import { cn } from '@/lib/format'
import { Spinner } from '@/components/ui/bits'
import { T, useLang } from '@/lib/i18n'
import { Autocomplete, locationOptions, useLocations, type Suggestion } from '@/components/ui/Autocomplete'

const GROUPS: { key: string; title: string; options: [string, string][] }[] = [
  { key: 'posted', title: 'Date posted', options: [['', 'All'], ['1', 'Last 24 hours'], ['3', 'Last 3 days'], ['7', 'Last 7 days'], ['30', 'Last 30 days']] },
  { key: 'mode', title: 'Work mode', options: [['', 'Any'], ...Object.entries(WORK_MODES)] },
  { key: 'type', title: 'Job type', options: [['', 'Any'], ...EMPLOYMENT_TYPES.map((t) => [t, t] as [string, string])] },
  { key: 'exp', title: 'Experience', options: [['', 'Any'], ['0', 'Fresher'], ['1', 'Up to 1 year'], ['3', 'Up to 3 years'], ['5', 'Up to 5 years'], ['10', 'Up to 10 years']] },
]

const SALARY = [0, 10000, 15000, 20000, 30000, 50000]

export function useFilterNav() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()
  const set = (updates: Record<string, string | null>) => {
    const p = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    p.delete('page')
    start(() => router.push(`${pathname}${p.size ? `?${p}` : ''}`, { scroll: false }))
  }
  return { params, set, pending }
}

function FilterBody({ categories, counts }: { categories: string[]; counts?: Record<string, number> }) {
  const { params, set } = useFilterNav()
  const { t } = useLang()
  const salary = Number(params.get('salary') ?? 0)
  return (
    <div className="divide-y divide-line">
      <fieldset className="pb-5">
        <legend className="mb-2.5 text-[13px] font-semibold text-ink">
          <T>Location</T>
        </legend>
        <LocationFilter />
      </fieldset>
      <fieldset className="py-5">
        <legend className="mb-2.5 text-[13px] font-semibold text-ink">
          <T>Category</T>
        </legend>
        <FilterCombo
          current={params.get('category') ?? ''}
          placeholder={t('All categories')}
          options={categories.map((c) => ({ value: c, type: 'category', hits: counts?.[c] }))}
          onPick={(s) => set({ category: s?.value ?? null })}
        />
      </fieldset>
      <fieldset className="py-5">
        <legend className="mb-2.5 flex w-full justify-between text-[13px] font-semibold text-ink">
          <T>Minimum monthly salary</T>
          <span className="font-medium text-ink-3">{salary ? `₹${salary.toLocaleString('en-IN')}+` : t('Any')}</span>
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {SALARY.map((s) => (
            <button
              key={s}
              onClick={() => set({ salary: s ? String(s) : null })}
              className={cn('rounded-md border px-2.5 py-1 text-[13px] font-medium', salary === s ? 'border-navy-600 bg-navy-50 text-navy-700' : 'border-line text-ink-2 hover:border-ink-4')}
            >
              {s ? `₹${s / 1000}k+` : t('Any')}
            </button>
          ))}
        </div>
      </fieldset>
      {GROUPS.map((g) => {
        const cur = params.get(g.key) ?? ''
        return (
          <fieldset key={g.key} className="py-5 last:pb-0">
            <legend className="mb-2 text-[13px] font-semibold text-ink">
              <T>{g.title}</T>
            </legend>
            <div className="space-y-0.5">
              {g.options.map(([v, l]) => (
                <label key={v || 'any'} className="flex cursor-pointer items-center gap-2.5 rounded-md py-1.5 text-sm text-ink-2 hover:text-ink">
                  <input type="radio" name={g.key} checked={cur === v} onChange={() => set({ [g.key]: v || null })} className="size-4 accent-[var(--color-navy-600)]" />
                  <T>{l}</T>
                </label>
              ))}
            </div>
          </fieldset>
        )
      })}
    </div>
  )
}

export function JobFilters({ categories, counts }: { categories: string[]; counts?: Record<string, number> }) {
  const { params, pending } = useFilterNav()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const active = ['taluk', 'area', 'category', 'salary', 'posted', 'mode', 'type', 'exp'].filter((k) => params.get(k)).length
  const clear = () => {
    const q = params.get('q')
    router.push(q ? `/jobs?q=${encodeURIComponent(q)}` : '/jobs', { scroll: false })
  }

  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-20 card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center gap-2 font-semibold">
              <T>Filters</T> {pending && <Spinner size={14} className="text-ink-3" />}
            </p>
            {active > 0 && (
              <button onClick={clear} className="text-[13px] font-medium text-navy-600 hover:underline">
                <T>Clear all</T>
              </button>
            )}
          </div>
          <FilterBody categories={categories} counts={counts} />
        </div>
      </aside>

      <button onClick={() => setOpen(true)} className="btn btn-outline btn-sm lg:hidden">
        <SlidersHorizontal size={15} /> <T>Filters</T>
        {active ? ` (${active})` : ''}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal aria-label="Filters">
          <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] animate-slide-up flex-col rounded-t-2xl bg-white">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-semibold">
                <T>Filters</T>
              </p>
              <button onClick={() => setOpen(false)} className="rounded-md p-1.5 hover:bg-canvas" aria-label="Close filters">
                <X size={19} />
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4">
              <FilterBody categories={categories} counts={counts} />
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-line p-3">
              <button onClick={clear} className="btn btn-outline">
                <T>Clear all</T>
              </button>
              <button onClick={() => setOpen(false)} className="btn btn-navy">
                {pending ? <Spinner /> : <T>Show results</T>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function SortSelect() {
  const { params, set } = useFilterNav()
  const { t } = useLang()
  return (
    <label className="flex items-center gap-2 text-[13px] text-ink-3">
      <T>Sort</T>
      <select value={params.get('sort') ?? ''} onChange={(e) => set({ sort: e.target.value || null })} className="input h-8 w-auto py-0 pr-8 text-[13px]">
        <option value="">{t('Most recent')}</option>
        <option value="salary">{t('Highest salary')}</option>
      </select>
    </label>
  )
}

/** Typeahead filter that shows the applied value and can be cleared. */
function FilterCombo({ current, placeholder, options, onPick }: { current: string; placeholder: string; options: Suggestion[]; onPick: (s: Suggestion | null) => void }) {
  const [text, setText] = useState(current)
  useEffect(() => {
    setText(current)
  }, [current])
  return (
    <div className="relative">
      <Autocomplete
        value={text}
        onChange={setText}
        options={options}
        limit={12}
        placeholder={placeholder}
        ariaLabel={placeholder}
        onSelect={(s) => onPick(s)}
        onEnter={(v) => {
          const hit = options.find((o) => o.value.toLowerCase() === v.trim().toLowerCase()) ?? options.find((o) => o.value.toLowerCase().startsWith(v.trim().toLowerCase()))
          if (!v.trim()) onPick(null)
          else if (hit) onPick(hit)
        }}
        inputClassName="input pr-8"
      />
      {current && (
        <button type="button" onClick={() => { setText(''); onPick(null) }} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-ink-4 hover:text-ink" aria-label={`Clear ${placeholder}`}>
          <X size={14} />
        </button>
      )}
    </div>
  )
}

function LocationFilter() {
  const { params, set } = useFilterNav()
  const { data: areas = [] } = useLocations()
  const { t } = useLang()
  const opts = useMemo(() => locationOptions(areas, TALUKS), [areas])
  const area = params.get('area')
  const current = (area && areas.find((a) => a.id === area)?.name) || params.get('taluk') || ''
  return (
    <FilterCombo
      current={current}
      placeholder={t('Any taluk or locality')}
      options={opts}
      onPick={(s) => (s ? (s.type === 'area' ? set({ area: s.data?.id ?? null, taluk: s.data?.taluk ?? null }) : set({ taluk: s.value, area: null })) : set({ taluk: null, area: null }))}
    />
  )
}
