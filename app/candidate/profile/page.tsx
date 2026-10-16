import { requireRole } from '@/lib/session'
import { ProfileForm } from './ProfileForm'

export const metadata = { title: 'Profile' }

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { sb, profile } = await requireRole('candidate')
  const [{ data: exps }, { data: cats }] = await Promise.all([
    sb.from('candidate_experiences').select('*').order('start_date', { ascending: false }),
    sb.from('job_categories').select('name').eq('active', true).order('sort_order'),
  ])
  const welcome = (await searchParams).welcome === '1'
  return <ProfileForm profile={profile} experiences={exps ?? []} categories={(cats ?? []).map((c) => c.name)} welcome={welcome} />
}
