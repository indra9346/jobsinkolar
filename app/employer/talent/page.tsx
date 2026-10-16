import { requireRole } from '@/lib/session'
import { TalentSearch } from './TalentSearch'

export const metadata = { title: 'Candidate database' }

export default async function TalentPage() {
  const { sb, user } = await requireRole('employer')
  const [{ data: company }, { data: wallet }, { data: cats }, { data: saved }] = await Promise.all([
    sb.from('companies').select('verified').eq('id', user.id).maybeSingle(),
    sb.from('employer_wallets').select('unlock_credits,expires_at,plan_id').eq('employer_id', user.id).maybeSingle(),
    sb.from('job_categories').select('name').eq('active', true).order('sort_order'),
    sb.from('saved_searches').select('id,name,filters').order('created_at', { ascending: false }),
  ])
  return (
    <TalentSearch
      employerId={user.id}
      verified={Boolean(company?.verified)}
      initialCredits={wallet?.unlock_credits ?? 0}
      categories={(cats ?? []).map((c) => c.name)}
      savedSearches={(saved ?? []) as { id: string; name: string; filters: Record<string, string> }[]}
    />
  )
}
