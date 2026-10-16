import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicSupabase } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Unsubscribe', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? ''
  let ok = false
  if (/^[0-9a-f-]{36}$/i.test(token)) {
    const { data } = await getPublicSupabase().rpc('unsubscribe_job_alert', { p_token: token })
    ok = Boolean(data)
  }
  return (
    <div className="container-x py-20">
      <div className="card mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold">{ok ? 'You’re unsubscribed' : 'Link already used or invalid'}</h1>
        <p className="mt-2 text-sm text-ink-3">{ok ? 'You won’t receive this job alert any more.' : 'This alert may already be turned off. Signed-in users can manage alerts from their dashboard.'}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/jobs" className="btn btn-outline">Browse jobs</Link>
          <Link href="/job-alerts" className="btn btn-navy">New alert</Link>
        </div>
      </div>
    </div>
  )
}
