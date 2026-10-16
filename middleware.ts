import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { homeFor, safeNext } from '@/lib/auth-routing'

const PORTALS = { '/candidate': 'candidate', '/employer': 'employer', '/admin': 'admin' } as const

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // Validates the JWT and refreshes an expired session through the cookie adapter.
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  let role = (claims?.app_metadata as { role?: string } | undefined)?.role

  // Tokens minted before the role claim existed: fall back to the profile row once.
  if (claims && !role) {
    const { data: p } = await supabase.from('profiles').select('role,is_admin').eq('id', claims.sub).maybeSingle()
    role = p?.is_admin ? 'admin' : (p?.role ?? 'candidate')
  }

  const path = request.nextUrl.pathname
  const portal = (Object.keys(PORTALS) as (keyof typeof PORTALS)[]).find((p) => path === p || path.startsWith(p + '/'))

  const redirect = (to: string) => {
    const url = request.nextUrl.clone()
    const [p, q] = to.split('?')
    url.pathname = p
    url.search = q ? `?${q}` : ''
    const res = NextResponse.redirect(url)
    response.cookies.getAll().forEach((c) => res.cookies.set(c))
    return res
  }

  if (portal) {
    if (!claims) return redirect(`/login?next=${encodeURIComponent(path + request.nextUrl.search)}`)
    if (role !== PORTALS[portal]) return redirect(homeFor(role))
  }

  if (claims && (path === '/login' || path === '/register')) {
    return redirect(safeNext(request.nextUrl.searchParams.get('next'), role ?? 'candidate', role === 'admin'))
  }

  return response
}

export const config = {
  matcher: ['/candidate/:path*', '/employer/:path*', '/admin/:path*', '/login', '/register'],
}
