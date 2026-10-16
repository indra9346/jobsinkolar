'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, Receipt } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Modal } from '@/components/ui/modal'
import { EmptyState, PageHeader, Spinner, Tabs } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { GST_RATE } from '@/lib/constants'
import { cn, formatDate, formatINR } from '@/lib/format'
import type { Plan, Wallet } from '@/lib/types'

type Order = { id: string; plan_id: string; total_inr: number; status: string; invoice_no: string | null; created_at: string; paid_at: string | null }
type Ledger = { id: string; job_delta: number; unlock_delta: number; reason: string; created_at: string }
type Billing = { name: string; gstin: string; address: string; email: string; phone: string }

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void }
  }
}

function loadCheckout() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export function BillingView({ wallet, plans, orders, ledger, billing }: { wallet: Wallet | null; plans: Plan[]; orders: Order[]; ledger: Ledger[]; billing: Billing }) {
  const router = useRouter()
  const toast = useToast()
  const [tab, setTab] = useState('usage')
  const [buy, setBuy] = useState<Plan | null>(null)
  const [b, setB] = useState(billing)
  const [busy, setBusy] = useState(false)
  const [offline, setOffline] = useState<Plan | null>(null)

  const paid = plans.filter((p) => p.price_inr > 0)
  const expired = wallet?.expires_at && wallet.plan_id !== 'free' && new Date(wallet.expires_at) < new Date()

  const checkout = async () => {
    if (!buy) return
    if (b.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(b.gstin.toUpperCase())) return toast('Enter a valid GSTIN or leave it blank', 'error')
    setBusy(true)
    const sb = getSupabase()
    const { data, error } = await sb.functions.invoke('create-payment-order', { body: { plan_id: buy.id, billing_name: b.name, gstin: b.gstin.toUpperCase() || null } })
    if (error || !data?.order_id) {
      setBusy(false)
      setOffline(buy)
      setBuy(null)
      return
    }
    const ok = await loadCheckout()
    setBusy(false)
    if (!ok || !window.Razorpay) return toast('Could not load the payment window. Check your connection and try again.', 'error')
    const rz = new window.Razorpay({
      key: data.key_id,
      order_id: data.order_id,
      amount: data.amount,
      currency: 'INR',
      name: 'Jobs in Kolar',
      description: `${buy.name} plan`,
      prefill: { name: b.name, email: b.email, contact: b.phone },
      theme: { color: '#1b3c88' },
      handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const v = await sb.functions.invoke('verify-payment', { body: resp })
        if (v.error) toast('Payment received. Credits will appear in a minute once the bank confirms.', 'info')
        else toast('Payment successful. Credits added.')
        setBuy(null)
        router.refresh()
      },
      modal: { ondismiss: () => toast('Payment cancelled', 'info') },
    })
    rz.on('payment.failed', () => toast('Payment failed. No money was taken.', 'error'))
    rz.open()
  }

  const requestInvoice = async () => {
    if (!offline) return
    setBusy(true)
    const { error } = await getSupabase().from('contact_messages').insert({
      name: b.name || 'Employer',
      email: b.email,
      phone: b.phone || null,
      topic: 'billing',
      message: `Please send a payment link / invoice for the ${offline.name} plan (₹${offline.price_inr} + GST). GSTIN: ${b.gstin || 'not provided'}.`,
    })
    setBusy(false)
    if (error) return toast(error.message, 'error')
    setOffline(null)
    toast('Request sent. Our team will email you a payment link within one working day.')
  }

  const gst = (n: number) => Math.round(n * GST_RATE)

  return (
    <>
      <PageHeader title="Credits & billing" description="Buy job posts and candidate unlocks. Prices exclude 18% GST." />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-[13px] text-ink-3">Job post credits</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{wallet?.job_credits ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-[13px] text-ink-3">Profile unlock credits</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{wallet?.unlock_credits ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-[13px] text-ink-3">Current plan</p>
          <p className="mt-1 text-lg font-semibold capitalize">{wallet?.plan_id ?? 'free'}</p>
          <p className={cn('text-xs', expired ? 'font-medium text-brand-700' : 'text-ink-3')}>
            {wallet?.plan_id === 'free' || !wallet?.expires_at ? 'Free credits never expire' : expired ? `Expired ${formatDate(wallet.expires_at)} — renew to use credits` : `Valid until ${formatDate(wallet.expires_at)}`}
          </p>
        </div>
      </div>

      <h2 id="plans" className="mt-8 mb-3 text-lg font-semibold">Plans</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {paid.map((p) => (
          <div key={p.id} className={cn('card relative flex flex-col p-5', p.highlight && 'border-navy-600 ring-1 ring-navy-600')}>
            {p.highlight && <span className="absolute -top-2.5 left-5 rounded-full bg-navy-700 px-2.5 py-0.5 text-[11px] font-semibold text-white">Most chosen</span>}
            <p className="font-semibold">{p.name}</p>
            <p className="text-[13px] text-ink-3">{p.tagline}</p>
            <p className="mt-4 text-3xl font-bold tracking-tight">{formatINR(p.price_inr)}</p>
            <p className="text-xs text-ink-3">+ {formatINR(gst(p.price_inr))} GST · valid {p.validity_days} days</p>
            <ul className="mt-5 flex-1 space-y-2 text-sm">
              {[
                `${p.job_credits} job posts`,
                `${p.unlock_credits} candidate profile unlocks`,
                `Each job live for ${p.job_duration_days} days`,
                p.featured_jobs ? 'Featured placement in search' : 'Standard placement',
                'GST invoice',
              ].map((x) => (
                <li key={x} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" /> {x}</li>
              ))}
            </ul>
            <button onClick={() => setBuy(p)} className={cn('btn mt-6 w-full', p.highlight ? 'btn-navy' : 'btn-outline')}>Buy {p.name}</button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-3">Unused credits carry over when you renew before expiry. Need a custom plan for bulk hiring? <Link href="/contact?topic=billing" className="link">Talk to us</Link>.</p>

      <div className="mt-8">
        <Tabs value={tab} onChange={setTab} items={[{ value: 'usage', label: 'Credit history', count: ledger.length }, { value: 'orders', label: 'Payments & invoices', count: orders.length }]} />
        <div className="card mt-4 overflow-hidden">
          {tab === 'usage' ? (
            ledger.length === 0 ? <EmptyState title="No credit activity yet" /> : (
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead><tr><th>Date</th><th>Activity</th><th className="text-right">Job posts</th><th className="text-right">Unlocks</th></tr></thead>
                  <tbody>
                    {ledger.map((l) => (
                      <tr key={l.id}>
                        <td className="whitespace-nowrap text-ink-3">{formatDate(l.created_at, true)}</td>
                        <td>{l.reason}</td>
                        <td className={cn('text-right tabular-nums', l.job_delta > 0 ? 'text-emerald-700' : l.job_delta < 0 ? 'text-ink' : 'text-ink-4')}>{l.job_delta > 0 ? `+${l.job_delta}` : l.job_delta || '—'}</td>
                        <td className={cn('text-right tabular-nums', l.unlock_delta > 0 ? 'text-emerald-700' : l.unlock_delta < 0 ? 'text-ink' : 'text-ink-4')}>{l.unlock_delta > 0 ? `+${l.unlock_delta}` : l.unlock_delta || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : orders.length === 0 ? (
            <EmptyState icon={<Receipt size={20} />} title="No payments yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead><tr><th>Date</th><th>Plan</th><th className="text-right">Amount</th><th>Status</th><th>Invoice</th></tr></thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="whitespace-nowrap text-ink-3">{formatDate(o.created_at)}</td>
                      <td className="capitalize">{o.plan_id}</td>
                      <td className="text-right tabular-nums">{formatINR(o.total_inr)}</td>
                      <td><StatusPill tone={o.status === 'paid' ? 'green' : o.status === 'failed' ? 'red' : 'gray'}>{o.status === 'created' ? 'Pending' : o.status}</StatusPill></td>
                      <td>{o.status === 'paid' && o.invoice_no ? <Link href={`/employer/billing/invoice/${o.id}`} className="link">{o.invoice_no}</Link> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal open={Boolean(buy)} onClose={() => setBuy(null)} title={`Buy ${buy?.name ?? ''} plan`} footer={<><button onClick={() => setBuy(null)} className="btn btn-outline">Cancel</button><button onClick={checkout} className="btn btn-primary" disabled={busy}>{busy ? <Spinner /> : `Pay ${formatINR((buy?.price_inr ?? 0) + gst(buy?.price_inr ?? 0))}`}</button></>}>
        {buy && (
          <div className="grid gap-4">
            <dl className="grid gap-1.5 rounded-lg bg-canvas p-4 text-sm">
              <div className="flex justify-between"><dt>{buy.name} plan</dt><dd className="tabular-nums">{formatINR(buy.price_inr)}</dd></div>
              <div className="flex justify-between text-ink-3"><dt>GST (18%)</dt><dd className="tabular-nums">{formatINR(gst(buy.price_inr))}</dd></div>
              <div className="mt-1 flex justify-between border-t border-line pt-2 font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatINR(buy.price_inr + gst(buy.price_inr))}</dd></div>
            </dl>
            <div className="field">
              <label className="label" htmlFor="b-name">Billing name</label>
              <input id="b-name" className="input" value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="b-gst">GSTIN <span className="font-normal text-ink-4">(for input tax credit)</span></label>
              <input id="b-gst" className="input uppercase" maxLength={15} value={b.gstin} onChange={(e) => setB({ ...b, gstin: e.target.value.toUpperCase() })} />
            </div>
            <p className="text-xs text-ink-3">Payments are processed securely by Razorpay (UPI, cards, net banking). Credits are added as soon as the payment is confirmed.</p>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(offline)} onClose={() => setOffline(null)} size="sm" title="Online payment isn’t available right now" footer={<><button onClick={() => setOffline(null)} className="btn btn-outline">Close</button><button onClick={requestInvoice} className="btn btn-navy" disabled={busy}>{busy ? <Spinner /> : 'Request payment link'}</button></>}>
        <p className="text-sm text-ink-2">We can email you a payment link and GST invoice for the {offline?.name} plan instead. Credits are added within one working day of payment.</p>
      </Modal>
    </>
  )
}
