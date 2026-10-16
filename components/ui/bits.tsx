import Link from 'next/link'
import { cn, initials } from '@/lib/format'

export function Avatar({ name, src, size = 36, square = false, className }: { name?: string | null; src?: string | null; size?: number; square?: boolean; className?: string }) {
  const palette = ['bg-navy-100 text-navy-700', 'bg-brand-100 text-brand-700', 'bg-amber-100 text-amber-800', 'bg-emerald-100 text-emerald-800', 'bg-violet-100 text-violet-800', 'bg-sky-100 text-sky-800']
  const idx = (name ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={cn('shrink-0 border border-line bg-white object-cover', square ? 'rounded-lg' : 'rounded-full', className)}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 items-center justify-center font-semibold', square ? 'rounded-lg' : 'rounded-full', palette[idx], className)}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
    >
      {initials(name)}
    </span>
  )
}

export function EmptyState({ icon, title, body, action }: { icon?: React.ReactNode; title: React.ReactNode; body?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-4 flex size-12 animate-pop items-center justify-center rounded-2xl bg-gradient-to-br from-navy-50 to-brand-50 text-navy-600 ring-1 ring-navy-100">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-ink-3">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function PageHeader({ title, description, actions, back }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-1.5 inline-block text-[13px] font-medium text-ink-3 hover:text-ink">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-[24px] font-bold sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-3">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

const STAT_TONES = ['from-navy-500 to-sky-400', 'from-brand-500 to-saffron-400', 'from-emerald-500 to-teal-400', 'from-violet-500 to-fuchsia-400']

export function Stat({ label, value, sub, href, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; href?: string; tone?: number }) {
  const t = STAT_TONES[(tone ?? [...label].reduce((a, c) => a + c.charCodeAt(0), 0)) % STAT_TONES.length]
  const inner = (
    <>
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${t}`} aria-hidden />
      <span className={`absolute -top-8 -right-8 size-24 rounded-full bg-gradient-to-br opacity-[0.12] blur-xl transition-opacity duration-300 group-hover:opacity-25 ${t}`} aria-hidden />
      <p className="relative text-[13px] font-medium text-ink-3">{label}</p>
      <p className="relative mt-1.5 text-[26px] font-bold tabular-nums tracking-tight">{value}</p>
      {sub && <p className="relative mt-1 text-xs text-ink-3">{sub}</p>}
    </>
  )
  return href ? (
    <Link href={href} className="group card card-hover relative block overflow-hidden p-4">
      {inner}
    </Link>
  ) : (
    <div className="group card relative overflow-hidden p-4">{inner}</div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line-2" aria-busy>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Tabs({ items, value, onChange }: { items: { value: string; label: string; count?: number }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
      <div role="tablist" className="flex min-w-max gap-1 border-b border-line">
        {items.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={value === t.value}
            onClick={() => onChange(t.value)}
            className={cn(
              '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
              value === t.value ? 'border-navy-600 text-ink' : 'border-transparent text-ink-3 hover:text-ink',
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={cn('rounded px-1.5 text-xs tabular-nums', value === t.value ? 'bg-navy-50 text-navy-700' : 'bg-canvas text-ink-3')}>{t.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
