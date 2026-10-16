const inr = new Intl.NumberFormat('en-IN')

export function formatSalary(min?: number | null, max?: number | null, period: string = 'month') {
  if (!min && !max) return 'Salary not disclosed'
  const unit = period === 'year' ? '/yr' : period === 'day' ? '/day' : '/mo'
  const short = (n: number) => {
    if (period === 'year' && n >= 100000) return `${(n / 100000).toFixed(n % 100000 ? 1 : 0)}L`
    if (n >= 1000) return `${inr.format(Math.round(n / 1000))}k`
    return inr.format(n)
  }
  if (min && max && min !== max) return `₹${short(min)} – ${short(max)}${unit}`
  return `₹${short((min || max)!)}${unit}`
}

export function formatINR(n: number) {
  return `₹${inr.format(n)}`
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
export function timeAgo(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  const s = Math.round((d.getTime() - Date.now()) / 1000)
  const abs = Math.abs(s)
  if (abs < 60) return 'just now'
  if (abs < 3600) return rtf.format(Math.round(s / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(s / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(s / 86400), 'day')
  if (abs < 86400 * 365) return rtf.format(Math.round(s / (86400 * 30)), 'month')
  return rtf.format(Math.round(s / (86400 * 365)), 'year')
}

export function formatDate(iso?: string | null, withTime = false) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  })
}

export function initials(name?: string | null) {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0][0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export function slugify(s: string) {
  return s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').slice(0, 60)
}

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export function plural(n: number, one: string, many = one + 's') {
  return `${inr.format(n)} ${n === 1 ? one : many}`
}
