'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import { TALUKS } from '@/lib/constants'
import { T, useLang } from '@/lib/i18n'

export function SearchBar({ initialQ = '', initialTaluk = '', size = 'lg' }: { initialQ?: string; initialTaluk?: string; size?: 'lg' | 'md' }) {
  const router = useRouter()
  const { t } = useLang()
  const [q, setQ] = useState(initialQ)
  const [taluk, setTaluk] = useState(initialTaluk)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (q.trim()) p.set('q', q.trim())
    if (taluk) p.set('taluk', taluk)
    router.push(`/jobs${p.size ? `?${p}` : ''}`)
  }

  const h = size === 'lg' ? 'h-12 sm:h-14' : 'h-11'
  return (
    <form onSubmit={submit} role="search" className="flex flex-col gap-2 rounded-xl border border-line bg-white p-1.5 shadow-card sm:flex-row sm:items-center sm:gap-0">
      <label className={`flex flex-1 items-center gap-2.5 px-3 ${h}`}>
        <Search size={19} className="shrink-0 text-ink-4" />
        <span className="sr-only">Keyword</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('Job title, skill or company')}
          className="h-full w-full min-w-0 bg-transparent text-[15px] text-ink placeholder:text-ink-4 focus:outline-none"
          enterKeyHint="search"
        />
      </label>
      <span className="hidden h-7 w-px bg-line sm:block" />
      <label className={`flex items-center gap-2.5 border-t border-line-2 px-3 sm:w-52 sm:border-0 ${h}`}>
        <MapPin size={19} className="shrink-0 text-ink-4" />
        <span className="sr-only">Taluk</span>
        <select value={taluk} onChange={(e) => setTaluk(e.target.value)} className="h-full w-full cursor-pointer bg-transparent text-[15px] text-ink focus:outline-none">
          <option value="">{t('All taluks')}</option>
          {TALUKS.map((tk) => (
            <option key={tk} value={tk}>
              {tk}
            </option>
          ))}
        </select>
      </label>
      <button className={`btn btn-primary ${size === 'lg' ? 'h-12 px-7 text-[15px]' : 'h-11 px-5'}`}>
        <T>Search</T>
      </button>
    </form>
  )
}
