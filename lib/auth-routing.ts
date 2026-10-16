import type { Role } from './types'

export function homeFor(role?: Role | string | null, isAdmin?: boolean) {
  if (isAdmin || role === 'admin') return '/admin'
  return role === 'employer' ? '/employer' : '/candidate'
}

const PUBLIC_OK = [/^\/$/, /^\/jobs(\/|$)/, /^\/companies(\/|$)/, /^\/job-alerts/, /^\/about$/, /^\/contact$/, /^\/employers$/]

/** Only follow a ?next= that stays on this site and suits the signed-in role. */
export function safeNext(next: string | null | undefined, role: string, isAdmin: boolean) {
  const home = homeFor(role, isAdmin)
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return home
  const path = next.split('?')[0]
  if (path.startsWith(home)) return next
  if (PUBLIC_OK.some((r) => r.test(path))) return next
  return home
}
