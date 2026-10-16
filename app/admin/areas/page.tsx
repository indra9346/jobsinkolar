import { requireRole } from '@/lib/session'
import { AreasManager } from './AreasManager'

export const metadata = { title: 'Areas' }

export default async function AdminAreas() {
  const { sb } = await requireRole('admin')
  const [{ data: suggestions }, { data: areas }] = await Promise.all([
    sb.from('area_suggestions').select('*').order('created_at', { ascending: false }).limit(100),
    sb.from('areas').select('*').order('taluk').order('name'),
  ])
  return <AreasManager suggestions={suggestions ?? []} areas={areas ?? []} />
}
