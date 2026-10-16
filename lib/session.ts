import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getServerSupabase } from './supabase/server'
import type { Profile } from './types'

export const getSessionProfile = cache(async () => {
  const sb = await getServerSupabase()
  const { data } = await sb.auth.getUser()
  if (!data.user) return { sb, user: null, profile: null }
  const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).maybeSingle()
  return { sb, user: data.user, profile: profile as Profile | null }
})

export async function requireRole(role: 'candidate' | 'employer' | 'admin') {
  const s = await getSessionProfile()
  if (!s.user || !s.profile) redirect(role === 'admin' ? '/admin-login' : '/login')
  const actual = s.profile.is_admin ? 'admin' : s.profile.role
  if (actual !== role) redirect(actual === 'admin' ? '/admin' : `/${actual}`)
  return s as { sb: typeof s.sb; user: NonNullable<typeof s.user>; profile: Profile }
}
