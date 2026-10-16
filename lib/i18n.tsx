'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type Lang = 'en' | 'kn'

const kn: Record<string, string> = {
  'Find jobs': 'ಉದ್ಯೋಗ ಹುಡುಕಿ',
  Jobs: 'ಉದ್ಯೋಗಗಳು',
  Companies: 'ಕಂಪನಿಗಳು',
  'For employers': 'ಉದ್ಯೋಗದಾತರಿಗೆ',
  'Post a job': 'ಉದ್ಯೋಗ ಪ್ರಕಟಿಸಿ',
  'Sign in': 'ಲಾಗಿನ್',
  'Create account': 'ಖಾತೆ ತೆರೆಯಿರಿ',
  Dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
  'Sign out': 'ಲಾಗ್ ಔಟ್',
  About: 'ನಮ್ಮ ಬಗ್ಗೆ',
  Contact: 'ಸಂಪರ್ಕಿಸಿ',
  'Jobs across Kolar district, in one place.': 'ಕೋಲಾರ ಜಿಲ್ಲೆಯ ಎಲ್ಲಾ ಉದ್ಯೋಗಗಳು, ಒಂದೇ ಕಡೆ.',
  'Verified openings from factories, hospitals, schools and shops in Kolar, Malur, Bangarpet, KGF, Mulbagal and Srinivaspur.':
    'ಕೋಲಾರ, ಮಾಲೂರು, ಬಂಗಾರಪೇಟೆ, ಕೆಜಿಎಫ್, ಮುಳಬಾಗಿಲು ಮತ್ತು ಶ್ರೀನಿವಾಸಪುರದ ಕಾರ್ಖಾನೆ, ಆಸ್ಪತ್ರೆ, ಶಾಲೆ ಮತ್ತು ಅಂಗಡಿಗಳ ಪರಿಶೀಲಿತ ಉದ್ಯೋಗಗಳು.',
  'Job title, skill or company': 'ಹುದ್ದೆ, ಕೌಶಲ್ಯ ಅಥವಾ ಕಂಪನಿ',
  'All taluks': 'ಎಲ್ಲಾ ತಾಲೂಕುಗಳು',
  Search: 'ಹುಡುಕಿ',
  'Popular:': 'ಜನಪ್ರಿಯ:',
  Apply: 'ಅರ್ಜಿ ಸಲ್ಲಿಸಿ',
  'Apply now': 'ಈಗ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ',
  Applied: 'ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ',
  Save: 'ಉಳಿಸಿ',
  Saved: 'ಉಳಿಸಲಾಗಿದೆ',
  'Browse by category': 'ವರ್ಗದ ಪ್ರಕಾರ ನೋಡಿ',
  'Latest jobs': 'ಇತ್ತೀಚಿನ ಉದ್ಯೋಗಗಳು',
  'View all jobs': 'ಎಲ್ಲಾ ಉದ್ಯೋಗಗಳು',
  'Hiring in Kolar?': 'ಕೋಲಾರದಲ್ಲಿ ನೇಮಕಾತಿ ಮಾಡುತ್ತಿದ್ದೀರಾ?',
  'Get job alerts': 'ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆ ಪಡೆಯಿರಿ',
  'My applications': 'ನನ್ನ ಅರ್ಜಿಗಳು',
  'Saved jobs': 'ಉಳಿಸಿದ ಉದ್ಯೋಗಗಳು',
  Profile: 'ಪ್ರೊಫೈಲ್',
  Documents: 'ದಾಖಲೆಗಳು',
  Messages: 'ಸಂದೇಶಗಳು',
  Notifications: 'ಅಧಿಸೂಚನೆಗಳು',
  Settings: 'ಸೆಟ್ಟಿಂಗ್ಸ್',
  'Job alerts': 'ಉದ್ಯೋಗ ಎಚ್ಚರಿಕೆಗಳು',
  Overview: 'ಸಾರಾಂಶ',
  'Browse jobs': 'ಉದ್ಯೋಗ ನೋಡಿ',
}

const dict: Record<Lang, Record<string, string>> = { en: {}, kn }

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (s: string) => string }
const LangCtx = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: (s) => s })

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('jik-lang')
      if (saved === 'kn') setLangState('kn')
    } catch {}
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('jik-lang', l) } catch {}
    document.documentElement.lang = l === 'kn' ? 'kn' : 'en'
  }, [])

  const t = useCallback((s: string) => dict[lang][s] ?? s, [lang])

  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>
}

export const useLang = () => useContext(LangCtx)

/** Translatable text. Renders English on the server; swaps after hydration for Kannada readers. */
export function T({ children }: { children: string }) {
  const { t } = useLang()
  return <>{t(children)}</>
}
