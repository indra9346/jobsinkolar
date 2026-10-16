import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/session'
import { PrintButton } from './PrintButton'
import { formatDate, formatINR } from '@/lib/format'
import { SITE } from '@/lib/constants'

export const metadata = { title: 'Invoice' }

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sb, user } = await requireRole('employer')
  const [{ data: o }, { data: company }, { data: priv }] = await Promise.all([
    sb.from('payment_orders').select('*,plans(name,job_credits,unlock_credits,validity_days)').eq('id', id).eq('employer_id', user.id).eq('status', 'paid').maybeSingle(),
    sb.from('companies').select('name,address').eq('id', user.id).maybeSingle(),
    sb.from('company_private').select('billing_address').eq('id', user.id).maybeSingle(),
  ])
  if (!o) notFound()
  const sellerGstin = process.env.NEXT_PUBLIC_SELLER_GSTIN ?? ''
  const sellerName = process.env.NEXT_PUBLIC_SELLER_NAME ?? 'Jobs in Kolar'
  const sameState = !o.gstin || o.gstin.startsWith('29')
  const plan = o.plans as { name: string; job_credits: number; unlock_credits: number; validity_days: number } | null

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex justify-end print:hidden"><PrintButton /></div>
      <article className="card p-8 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
          <div>
            <p className="text-xl font-bold text-navy-800">{sellerName}</p>
            <p className="text-sm text-ink-3">Kolar, Karnataka · {SITE.email}</p>
            {sellerGstin && <p className="text-sm text-ink-3">GSTIN {sellerGstin}</p>}
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">Tax invoice</p>
            <p className="text-sm text-ink-3">{o.invoice_no}</p>
            <p className="text-sm text-ink-3">{formatDate(o.paid_at)}</p>
          </div>
        </header>
        <section className="grid gap-6 border-b border-line py-6 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-ink-3 uppercase">Billed to</p>
            <p className="mt-1 font-medium">{o.billing_name || company?.name}</p>
            <p className="whitespace-pre-line text-ink-2">{priv?.billing_address || company?.address || ''}</p>
            {o.gstin && <p className="text-ink-2">GSTIN {o.gstin}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold text-ink-3 uppercase">Payment</p>
            <p className="mt-1">Razorpay · {o.provider_payment_id}</p>
            <p className="text-ink-3">Place of supply: {sameState ? 'Karnataka (29)' : `State code ${o.gstin?.slice(0, 2)}`}</p>
          </div>
        </section>
        <table className="table-base mt-6">
          <thead><tr><th>Description</th><th>SAC</th><th className="text-right">Amount</th></tr></thead>
          <tbody>
            <tr>
              <td>
                <p className="font-medium">{plan?.name} plan — online recruitment services</p>
                <p className="text-xs text-ink-3">{plan?.job_credits} job posts, {plan?.unlock_credits} profile unlocks, valid {plan?.validity_days} days</p>
              </td>
              <td>998512</td>
              <td className="text-right tabular-nums">{formatINR(o.amount_inr)}</td>
            </tr>
          </tbody>
        </table>
        <dl className="mt-4 ml-auto grid max-w-xs gap-1.5 text-sm">
          <div className="flex justify-between"><dt>Taxable value</dt><dd className="tabular-nums">{formatINR(o.amount_inr)}</dd></div>
          {sameState ? (
            <>
              <div className="flex justify-between text-ink-2"><dt>CGST 9%</dt><dd className="tabular-nums">{formatINR(Math.round(o.gst_inr / 2))}</dd></div>
              <div className="flex justify-between text-ink-2"><dt>SGST 9%</dt><dd className="tabular-nums">{formatINR(o.gst_inr - Math.round(o.gst_inr / 2))}</dd></div>
            </>
          ) : (
            <div className="flex justify-between text-ink-2"><dt>IGST 18%</dt><dd className="tabular-nums">{formatINR(o.gst_inr)}</dd></div>
          )}
          <div className="mt-1 flex justify-between border-t border-line pt-2 text-base font-semibold"><dt>Total paid</dt><dd className="tabular-nums">{formatINR(o.total_inr)}</dd></div>
        </dl>
        <p className="mt-10 text-xs text-ink-4">This is a computer-generated invoice and does not require a signature.</p>
      </article>
    </div>
  )
}
