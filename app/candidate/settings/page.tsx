import { requireRole } from '@/lib/session'
import { AccountSettings } from '@/components/portal/AccountSettings'

export const metadata = { title: 'Settings' }

export default async function Page() {
  const { user, profile } = await requireRole('candidate')
  return <AccountSettings email={user.email ?? ''} candidate={{ id: profile.id, talent_visible: profile.talent_visible, open_to_work: profile.open_to_work }} />
}
