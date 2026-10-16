import { requireRole } from '@/lib/session'
import { AlertsManager } from './AlertsManager'

export const metadata = { title: 'Job alerts' }

export default async function AlertsPage() {
  const { sb, profile } = await requireRole('candidate')
  const [{ data: subs }, { data: cats }, { data: areas }] = await Promise.all([
    sb.from('job_alert_subscriptions').select('id,taluk,category,area_id,email_enabled,in_app_enabled,active,created_at').order('created_at', { ascending: false }),
    sb.from('job_categories').select('name').eq('active', true).order('sort_order'),
    sb.from('areas').select('id,name,taluk').eq('active', true).eq('verified', true).order('name'),
  ])
  return <AlertsManager email={profile.email ?? ''} subs={subs ?? []} categories={(cats ?? []).map((c) => c.name)} areas={areas ?? []} />
}
