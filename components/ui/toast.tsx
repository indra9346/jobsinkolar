'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type Tone = 'success' | 'error' | 'info'
type Toast = { id: number; tone: Tone; text: string }

const ToastCtx = createContext<(text: string, tone?: Tone) => void>(() => {})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])

  const push = useCallback((text: string, tone: Tone = 'success') => {
    const id = Date.now() + Math.random()
    setItems((t) => [...t.slice(-2), { id, tone, text }])
    setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 6000 : 3500)
  }, [])

  const value = useMemo(() => push, [push])

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:pr-6"
      >
        {items.map((t) => {
          const Icon = t.tone === 'success' ? CheckCircle2 : t.tone === 'error' ? AlertCircle : Info
          return (
            <div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-lg bg-ink px-4 py-3 text-sm text-white shadow-pop"
            >
              <Icon
                size={18}
                className={
                  t.tone === 'success' ? 'mt-px shrink-0 text-emerald-400' : t.tone === 'error' ? 'mt-px shrink-0 text-red-400' : 'mt-px shrink-0 text-sky-300'
                }
              />
              <p className="flex-1 leading-snug">{t.text}</p>
              <button
                aria-label="Dismiss"
                onClick={() => setItems((all) => all.filter((x) => x.id !== t.id))}
                className="-mr-1 rounded p-0.5 text-white/60 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
