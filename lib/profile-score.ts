import type { Profile } from './types'

type Check = { key: string; label: string; weight: number; done: boolean; href: string }

/** Weighted, verification-aware profile strength (DriverHub counted any upload, even rejected ones). */
export function profileScore(p: Profile | null, docs: { status: string; kind: string }[] = []) {
  if (!p) return { score: 0, checks: [] as Check[], next: null as Check | null }
  const checks: Check[] = [
    { key: 'name', label: 'Add your full name', weight: 8, done: p.full_name.trim().length > 1, href: '/candidate/profile#basics' },
    { key: 'phone', label: 'Add a mobile number', weight: 10, done: Boolean(p.phone), href: '/candidate/profile#basics' },
    { key: 'title', label: 'Add your current or desired role', weight: 10, done: Boolean(p.current_title || p.headline), href: '/candidate/profile#basics' },
    { key: 'taluk', label: 'Choose your taluk', weight: 5, done: Boolean(p.taluk), href: '/candidate/profile#basics' },
    { key: 'exp', label: 'Add years of experience', weight: 8, done: p.experience_years !== null, href: '/candidate/profile#work' },
    { key: 'edu', label: 'Add your education', weight: 8, done: Boolean(p.education), href: '/candidate/profile#work' },
    { key: 'skills', label: 'Add at least 3 skills', weight: 12, done: (p.skills?.length ?? 0) >= 3, href: '/candidate/profile#work' },
    { key: 'prefs', label: 'Set job preferences', weight: 7, done: (p.preferred_categories?.length ?? 0) > 0 && Boolean(p.availability), href: '/candidate/profile#prefs' },
    { key: 'about', label: 'Write a short summary', weight: 5, done: (p.bio?.trim().length ?? 0) >= 30, href: '/candidate/profile#basics' },
    { key: 'resume', label: 'Upload your resume', weight: 17, done: Boolean(p.resume_path), href: '/candidate/profile#resume' },
    { key: 'verified', label: 'Get a document verified', weight: 10, done: docs.some((d) => d.status === 'verified'), href: '/candidate/documents' },
  ]
  const score = checks.reduce((s, c) => s + (c.done ? c.weight : 0), 0)
  return { score, checks, next: checks.find((c) => !c.done) ?? null }
}
