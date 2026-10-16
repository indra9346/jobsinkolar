import { NextResponse, type NextRequest } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

/** Exchanges an email link code (confirmation or password recovery) for a session. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const safe = next.startsWith('/') && !next.startsWith('//') ? next : '/'

  if (code) {
    const sb = await getServerSupabase()
    const { error } = await sb.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${safe}`)
  }
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('That link is invalid or has expired.')}`)
}
