'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { kn } from './kn'
import { timeAgo } from './format'

export type Lang = 'en' | 'kn'

const dict: Record<Lang, Record<string, string>> = { en: {}, kn }

type Vars = Record<string, string | number>
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (s: string, vars?: Vars) => string }

const fill = (s: string, vars?: Vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s)
const LangCtx = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: (s, v) => fill(s, v) })

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('jik-lang')
      if (saved === 'kn') {
        setLangState('kn')
        document.documentElement.lang = 'kn'
      }
    } catch {}
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('jik-lang', l) } catch {}
    document.documentElement.lang = l === 'kn' ? 'kn' : 'en'
  }, [])

  const t = useCallback((s: string, vars?: Vars) => fill(dict[lang][s] ?? s, vars), [lang])

  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>
}

export const useLang = () => useContext(LangCtx)

/** Translatable text. Renders English on the server; swaps after hydration for Kannada readers. */
export function T({ children, vars }: { children: string; vars?: Vars }) {
  const { t } = useLang()
  return <>{t(children, vars)}</>
}

/** Relative time in the reader's language ("3 days ago" / "3 ದಿನಗಳ ಹಿಂದೆ"). */
export function Ago({ iso }: { iso: string }) {
  const { lang } = useLang()
  return <time dateTime={iso} suppressHydrationWarning>{timeAgo(iso, lang)}</time>
}
