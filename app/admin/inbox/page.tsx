import { requireRole } from '@/lib/session'
import { Inbox } from './Inbox'

export const metadata = { title: 'Contact inbox' }

export default async function AdminInbox({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { sb } = await requireRole('admin')
  const status = (await searchParams).status ?? 'open'
  let q = sb.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(200)
  if (status !== 'all') q = q.eq('status', status)
  const { data } = await q
  return <Inbox rows={data ?? []} status={status} />
}
