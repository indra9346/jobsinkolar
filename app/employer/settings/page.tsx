import { requireRole } from '@/lib/session'
import { AccountSettings } from '@/components/portal/AccountSettings'

export const metadata = { title: 'Settings' }

export default async function Page() {
  const { user } = await requireRole('employer')
  return <AccountSettings email={user.email ?? ''} />
}
