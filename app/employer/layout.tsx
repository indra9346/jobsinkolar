import type { Metadata } from 'next'
import { Shell } from '@/components/portal/Shell'
import { AccountBanner } from '@/components/portal/AccountBanner'
import { requireRole } from '@/lib/session'

export const metadata: Metadata = { title: { default: 'Employer', template: '%s · Jobs in Kolar' }, robots: { index: false } }

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const { sb, user, profile } = await requireRole('employer')
  const { count } = await sb.from('applications').select('id', { count: 'exact', head: true }).eq('employer_id', user.id).eq('status', 'submitted')
  return (
    <Shell
      role="employer"
      name={profile.full_name}
      email={user.email ?? ''}
      badges={{ '/employer/applications': count ?? 0 }}
      banner={<AccountBanner status={profile.account_status} />}
    >
      {children}
    </Shell>
  )
}
