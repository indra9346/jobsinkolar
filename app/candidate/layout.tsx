import type { Metadata } from 'next'
import { Shell } from '@/components/portal/Shell'
import { AccountBanner } from '@/components/portal/AccountBanner'
import { requireRole } from '@/lib/session'

export const metadata: Metadata = { title: { default: 'Dashboard', template: '%s · Jobs in Kolar' }, robots: { index: false } }

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { sb, user, profile } = await requireRole('candidate')
  void sb.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', user.id).then(() => {})
  return (
    <Shell role="candidate" name={profile.full_name} email={user.email ?? ''} banner={<AccountBanner status={profile.account_status} />}>
      {children}
    </Shell>
  )
}
