import { requireRole } from '@/lib/session'
import { EmptyState, PageHeader, Stat } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { formatDate } from '@/lib/format'

export const metadata = { title: 'Job alert emails' }

export default async function AdminAlerts() {
  const { sb } = await requireRole('admin')
  const [{ data }, subs] = await Promise.all([
    sb.from('job_alert_deliveries').select('id,status,attempt_count,error_message,created_at,sent_at,job_alert_subscriptions(email),jobs(title)').order('created_at', { ascending: false }).limit(200),
    sb.from('job_alert_subscriptions').select('id', { count: 'exact', head: true }).eq('active', true),
  ])
  const rows = (data ?? []) as unknown as { id: string; status: string; attempt_count: number; error_message: string | null; created_at: string; sent_at: string | null; job_alert_subscriptions: { email: string } | null; jobs: { title: string } | null }[]
  const by = (s: string) => rows.filter((r) => r.status === s).length
  return (
    <>
      <PageHeader title="Job alert emails" description="Each published job queues one email per matching subscriber. Delivery runs through the dispatch-job-alert function once Resend is configured." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active subscriptions" value={subs.count ?? 0} />
        <Stat label="Queued" value={by('queued')} />
        <Stat label="Sent" value={by('sent')} />
        <Stat label="Failed" value={by('failed')} />
      </div>
      <section className="card mt-6 overflow-hidden">
        {rows.length === 0 ? <EmptyState title="No alert emails yet" body="They appear when a job matching a subscription is published." /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Queued</th><th>Recipient</th><th>Job</th><th>Status</th><th>Attempts</th><th>Error</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap text-ink-3">{formatDate(r.created_at, true)}</td>
                    <td>{r.job_alert_subscriptions?.email}</td>
                    <td>{r.jobs?.title}</td>
                    <td><StatusPill tone={r.status === 'sent' ? 'green' : r.status === 'failed' ? 'red' : 'gray'}>{r.status}</StatusPill></td>
                    <td className="tabular-nums">{r.attempt_count}</td>
                    <td className="max-w-xs truncate text-xs text-ink-3">{r.error_message ?? '—'}</td>
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
