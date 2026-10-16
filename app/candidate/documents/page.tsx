import { requireRole } from '@/lib/session'
import { DocumentsManager } from './DocumentsManager'

export const metadata = { title: 'Documents' }

export default async function DocumentsPage() {
  const { sb, profile } = await requireRole('candidate')
  const { data } = await sb.from('candidate_documents').select('*').order('created_at', { ascending: false })
  return <DocumentsManager userId={profile.id} docs={data ?? []} resumePath={profile.resume_path} />
}
