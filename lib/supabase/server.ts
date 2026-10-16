import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** Request-scoped client that acts as the signed-in user (reads auth cookies). */
export async function getServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(URL, KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component; middleware keeps the session fresh.
        }
      },
    },
  })
}

/**
 * Anonymous client with no cookie access. Used for public, cacheable pages
 * (home, job listings, company pages) so they can be statically revalidated.
 */
export const getPublicSupabase = cache(() =>
  createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } }),
)
