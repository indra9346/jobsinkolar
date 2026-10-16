import { cn } from '@/lib/format'
import type { Tone } from '@/lib/constants'

const tones: Record<Tone, string> = {
  gray: 'bg-canvas text-ink-2 ring-line',
  blue: 'bg-navy-50 text-navy-700 ring-navy-100',
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-800 ring-amber-100',
  red: 'bg-brand-50 text-brand-700 ring-brand-100',
  violet: 'bg-violet-50 text-violet-800 ring-violet-100',
}

export function StatusPill({ tone = 'gray', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset', tones[tone], className)}>
      {children}
    </span>
  )
}
