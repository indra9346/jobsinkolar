import { requireRole } from '@/lib/session'
import { DocumentQueue } from './DocumentQueue'

export const metadata = { title: 'Documents' }

export default async function AdminDocuments({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { sb } = await requireRole('admin')
  const status = (await searchParams).status ?? 'pending'
  let q = sb.from('candidate_documents').select('*,profiles!candidate_documents_candidate_id_fkey(full_name,email,phone)').order('created_at', { ascending: status === 'pending' }).limit(200)
  if (status !== 'all') q = q.eq('status', status)
  const { data, error } = await q
  return <DocumentQueue docs={data ?? []} status={status} error={error?.message} />
}
