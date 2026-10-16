import { requireRole } from '@/lib/session'
import { BillingView } from './BillingView'
import type { Plan, Wallet } from '@/lib/types'

export const metadata = { title: 'Credits & billing' }

export default async function BillingPage() {
  const { sb, user, profile } = await requireRole('employer')
  const [{ data: wallet }, { data: plans }, { data: orders }, { data: ledger }, { data: priv }, { data: company }] = await Promise.all([
    sb.from('employer_wallets').select('*').eq('employer_id', user.id).maybeSingle(),
    sb.from('plans').select('*').eq('active', true).order('sort_order'),
    sb.from('payment_orders').select('id,plan_id,total_inr,status,invoice_no,created_at,paid_at').order('created_at', { ascending: false }).limit(50),
    sb.from('credit_ledger').select('id,job_delta,unlock_delta,reason,created_at').order('created_at', { ascending: false }).limit(50),
    sb.from('company_private').select('gstin,billing_address').eq('id', user.id).maybeSingle(),
    sb.from('companies').select('name').eq('id', user.id).maybeSingle(),
  ])
  return (
    <BillingView
      wallet={wallet as Wallet | null}
      plans={(plans ?? []) as Plan[]}
      orders={orders ?? []}
      ledger={ledger ?? []}
      billing={{ name: company?.name ?? profile.company_name ?? '', gstin: priv?.gstin ?? '', address: priv?.billing_address ?? '', email: user.email ?? '', phone: profile.phone ?? '' }}
    />
  )
}
