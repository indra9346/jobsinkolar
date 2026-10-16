import Link from 'next/link'
import { requireRole } from '@/lib/session'
import { EmptyState, PageHeader, Stat } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { formatDate, formatINR } from '@/lib/format'

export const metadata = { title: 'Payments & credits' }

export default async function AdminPayments() {
  const { sb } = await requireRole('admin')
  const [{ data: orders }, { data: ledger }, { data: companies }, { data: plans }] = await Promise.all([
    sb.from('payment_orders').select('*').order('created_at', { ascending: false }).limit(200),
    sb.from('credit_ledger').select('*').order('created_at', { ascending: false }).limit(100),
    sb.from('companies').select('id,name'),
    sb.from('plans').select('*').order('sort_order'),
  ])
  const name = new Map((companies ?? []).map((c) => [c.id, c.name]))
  const paid = (orders ?? []).filter((o) => o.status === 'paid')
  const month = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  return (
    <>
      <PageHeader title="Payments & credits" description="Razorpay orders, GST collected and every credit movement. Adjust an employer’s credits from Employers." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenue (all time)" value={formatINR(paid.reduce((s, o) => s + o.total_inr, 0))} />
        <Stat label="This month" value={formatINR(paid.filter((o) => o.paid_at >= month).reduce((s, o) => s + o.total_inr, 0))} />
        <Stat label="GST collected" value={formatINR(paid.reduce((s, o) => s + o.gst_inr, 0))} />
        <Stat label="Paid orders" value={paid.length} sub={`${(orders ?? []).filter((o) => o.status === 'created').length} abandoned`} />
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold">Plans</h2><p className="text-[13px] text-ink-3">Edit prices in the plans table. Changes apply to new purchases only.</p></div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Plan</th><th className="text-right">Price</th><th className="text-right">Job posts</th><th className="text-right">Unlocks</th><th className="text-right">Validity</th><th className="text-right">Job live</th><th>Active</th></tr></thead>
            <tbody>
              {(plans ?? []).map((p) => (
                <tr key={p.id}><td className="font-medium">{p.name}</td><td className="text-right tabular-nums">{formatINR(p.price_inr)}</td><td className="text-right tabular-nums">{p.job_credits}</td><td className="text-right tabular-nums">{p.unlock_credits}</td><td className="text-right tabular-nums">{p.validity_days} d</td><td className="text-right tabular-nums">{p.job_duration_days} d</td><td>{p.active ? 'Yes' : 'No'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold">Orders</h2></div>
        {(orders ?? []).length === 0 ? <EmptyState title="No orders yet" /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Date</th><th>Employer</th><th>Plan</th><th className="text-right">Total</th><th>Status</th><th>Invoice</th><th>Payment ID</th></tr></thead>
              <tbody>
                {orders!.map((o) => (
                  <tr key={o.id}>
                    <td className="whitespace-nowrap text-ink-3">{formatDate(o.created_at, true)}</td>
                    <td><Link href={`/admin/employers?focus=${o.employer_id}`} className="hover:underline">{name.get(o.employer_id) ?? '—'}</Link></td>
                    <td className="capitalize">{o.plan_id}</td>
                    <td className="text-right tabular-nums">{formatINR(o.total_inr)}</td>
                    <td><StatusPill tone={o.status === 'paid' ? 'green' : o.status === 'failed' ? 'red' : 'gray'}>{o.status === 'created' ? 'Pending' : o.status}</StatusPill></td>
                    <td>{o.invoice_no ?? '—'}</td>
                    <td className="font-mono text-xs text-ink-3">{o.provider_payment_id ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold">Credit ledger</h2></div>
        {(ledger ?? []).length === 0 ? <EmptyState title="No credit movements yet" /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Date</th><th>Employer</th><th>Reason</th><th className="text-right">Jobs</th><th className="text-right">Unlocks</th></tr></thead>
              <tbody>
                {ledger!.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap text-ink-3">{formatDate(l.created_at, true)}</td>
                    <td>{name.get(l.employer_id) ?? '—'}</td>
                    <td>{l.reason}</td>
                    <td className="text-right tabular-nums">{l.job_delta || '—'}</td>
                    <td className="text-right tabular-nums">{l.unlock_delta || '—'}</td>
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
