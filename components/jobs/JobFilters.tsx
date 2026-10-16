'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { EMPLOYMENT_TYPES, TALUKS, WORK_MODES } from '@/lib/constants'
import { cn } from '@/lib/format'
import { Spinner } from '@/components/ui/bits'

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

function FilterBody({ categories }: { categories: string[] }) {
  const { params, set } = useFilterNav()
  const salary = Number(params.get('salary') ?? 0)
  return (
    <div className="divide-y divide-line">
      <fieldset className="pb-5">
        <legend className="mb-2.5 text-[13px] font-semibold text-ink">Taluk</legend>
        <select value={params.get('taluk') ?? ''} onChange={(e) => set({ taluk: e.target.value })} className="input">
          <option value="">All taluks</option>
          {TALUKS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </fieldset>
      <fieldset className="py-5">
        <legend className="mb-2.5 text-[13px] font-semibold text-ink">Category</legend>
        <select value={params.get('category') ?? ''} onChange={(e) => set({ category: e.target.value })} className="input">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </fieldset>
      <fieldset className="py-5">
        <legend className="mb-2.5 flex w-full justify-between text-[13px] font-semibold text-ink">
          Minimum monthly salary
          <span className="font-medium text-ink-3">{salary ? `₹${salary.toLocaleString('en-IN')}+` : 'Any'}</span>
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {SALARY.map((s) => (
            <button
              key={s}
              onClick={() => set({ salary: s ? String(s) : null })}
              className={cn('rounded-md border px-2.5 py-1 text-[13px] font-medium', salary === s ? 'border-navy-600 bg-navy-50 text-navy-700' : 'border-line text-ink-2 hover:border-ink-4')}
            >
              {s ? `₹${s / 1000}k+` : 'Any'}
            </button>
          ))}
        </div>
      </fieldset>
      {GROUPS.map((g) => {
        const cur = params.get(g.key) ?? ''
        return (
          <fieldset key={g.key} className="py-5 last:pb-0">
            <legend className="mb-2 text-[13px] font-semibold text-ink">{g.title}</legend>
            <div className="space-y-0.5">
              {g.options.map(([v, l]) => (
                <label key={v || 'any'} className="flex cursor-pointer items-center gap-2.5 rounded-md py-1.5 text-sm text-ink-2 hover:text-ink">
                  <input type="radio" name={g.key} checked={cur === v} onChange={() => set({ [g.key]: v || null })} className="size-4 accent-[var(--color-navy-600)]" />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
        )
      })}
    </div>
  )
}

export function JobFilters({ categories }: { categories: string[] }) {
  const { params, pending } = useFilterNav()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const active = ['taluk', 'category', 'salary', 'posted', 'mode', 'type', 'exp'].filter((k) => params.get(k)).length
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
              Filters {pending && <Spinner size={14} className="text-ink-3" />}
            </p>
            {active > 0 && (
              <button onClick={clear} className="text-[13px] font-medium text-navy-600 hover:underline">
                Clear all
              </button>
            )}
          </div>
          <FilterBody categories={categories} />
        </div>
      </aside>

      <button onClick={() => setOpen(true)} className="btn btn-outline btn-sm lg:hidden">
        <SlidersHorizontal size={15} /> Filters{active ? ` (${active})` : ''}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal aria-label="Filters">
          <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] animate-slide-up flex-col rounded-t-2xl bg-white">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-semibold">Filters</p>
              <button onClick={() => setOpen(false)} className="rounded-md p-1.5 hover:bg-canvas" aria-label="Close filters">
                <X size={19} />
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4">
              <FilterBody categories={categories} />
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-line p-3">
              <button onClick={clear} className="btn btn-outline">
                Clear all
              </button>
              <button onClick={() => setOpen(false)} className="btn btn-navy">
                {pending ? <Spinner /> : 'Show results'}
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
  return (
    <label className="flex items-center gap-2 text-[13px] text-ink-3">
      Sort
      <select value={params.get('sort') ?? ''} onChange={(e) => set({ sort: e.target.value || null })} className="input h-8 w-auto py-0 pr-8 text-[13px]">
        <option value="">Most recent</option>
        <option value="salary">Highest salary</option>
      </select>
    </label>
  )
}
