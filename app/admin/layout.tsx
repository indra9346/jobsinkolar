import type { Metadata } from 'next'
import { Shell } from '@/components/portal/Shell'
import { requireRole } from '@/lib/session'

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Admin · Jobs in Kolar' }, robots: { index: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { sb, user, profile } = await requireRole('admin')
  const [jobs, docs, inbox] = await Promise.all([
    sb.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
    sb.from('candidate_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    sb.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'open'),
  ])
  return (
    <Shell
      role="admin"
      name={profile.full_name}
      email={user.email ?? ''}
      badges={{ '/admin/jobs': jobs.count ?? 0, '/admin/documents': docs.count ?? 0, '/admin/inbox': inbox.count ?? 0 }}
    >
      {children}
    </Shell>
  )
}
