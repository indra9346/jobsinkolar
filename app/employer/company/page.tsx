import { requireRole } from '@/lib/session'
import { CompanyForm } from './CompanyForm'
import type { Company } from '@/lib/types'

export const metadata = { title: 'Company profile' }

export default async function CompanyPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { sb, user } = await requireRole('employer')
  const [{ data: company }, { data: priv }] = await Promise.all([
    sb.from('companies').select('*').eq('id', user.id).maybeSingle(),
    sb.from('company_private').select('*').eq('id', user.id).maybeSingle(),
  ])
  return <CompanyForm userId={user.id} company={company as Company | null} priv={priv} welcome={(await searchParams).welcome === '1'} />
}
