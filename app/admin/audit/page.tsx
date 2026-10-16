import { requireRole } from '@/lib/session'
import { EmptyState, PageHeader } from '@/components/ui/bits'
import { formatDate } from '@/lib/format'

export const metadata = { title: 'Audit log' }

export default async function AuditPage() {
  const { sb } = await requireRole('admin')
  const [{ data: actions }, { data: history }, { data: admins }] = await Promise.all([
    sb.from('admin_actions').select('*').order('created_at', { ascending: false }).limit(200),
    sb.from('admin_profile_history').select('*').order('created_at', { ascending: false }).limit(100),
    sb.from('profiles').select('id,full_name,email').eq('is_admin', true),
  ])
  const who = new Map((admins ?? []).map((a) => [a.id, a.full_name || a.email]))
  const rows = [
    ...(actions ?? []).map((a) => ({ id: a.id, at: a.created_at, admin: a.admin_id, what: `${a.target_type} ${a.action.replace('_', ' ')}`, detail: a.reason ?? '', target: a.target_id })),
    ...(history ?? []).map((h) => ({ id: h.id, at: h.created_at, admin: h.admin_id, what: `profile ${h.field_name.replace('_', ' ')}`, detail: `${h.old_value} → ${h.new_value}`, target: h.profile_id })),
  ].sort((a, b) => b.at.localeCompare(a.at))

  return (
    <>
      <PageHeader title="Audit log" description="Every moderation and account decision, with who made it." />
      <section className="card overflow-hidden">
        {rows.length === 0 ? <EmptyState title="No actions recorded yet" /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Details</th><th>Target</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap text-ink-3">{formatDate(r.at, true)}</td>
                    <td>{who.get(r.admin) ?? 'System'}</td>
                    <td className="capitalize">{r.what}</td>
                    <td className="max-w-md text-ink-2">{r.detail}</td>
                    <td className="font-mono text-xs text-ink-4">{r.target?.slice(0, 8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
