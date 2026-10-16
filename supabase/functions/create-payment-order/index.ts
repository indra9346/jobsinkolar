// Creates a Razorpay order for a plan. Price is always read from the database,
// never from the client.
import { admin, cors, env, json, razorpayAuth } from '../_shared/razorpay.ts'

declare const Deno: { serve(h: (r: Request) => Response | Promise<Response>): void }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!env('RAZORPAY_KEY_ID') || !env('RAZORPAY_KEY_SECRET')) return json({ error: 'Payments are not configured' }, 503)

  const db = admin()
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: auth } = await db.auth.getUser(token)
  if (!auth?.user) return json({ error: 'Sign in again' }, 401)

  const { data: profile } = await db.from('profiles').select('role,account_status,email,phone,full_name').eq('id', auth.user.id).single()
  if (!profile || profile.role !== 'employer' || profile.account_status !== 'active') return json({ error: 'Employer account required' }, 403)

  let body: { plan_id?: string; billing_name?: string; gstin?: string | null }
  try { body = await req.json() } catch { return json({ error: 'Invalid request' }, 400) }
  const { data: plan } = await db.from('plans').select('*').eq('id', body.plan_id ?? '').eq('active', true).single()
  if (!plan || plan.price_inr <= 0) return json({ error: 'Choose a valid plan' }, 400)

  const gstin = body.gstin && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(body.gstin) ? body.gstin : null
  const gst = Math.round(plan.price_inr * 0.18)
  const total = plan.price_inr + gst

  const { data: order, error } = await db.from('payment_orders').insert({
    employer_id: auth.user.id, plan_id: plan.id, amount_inr: plan.price_inr, gst_inr: gst, total_inr: total,
    billing_name: (body.billing_name ?? '').slice(0, 200) || null, gstin,
  }).select('id').single()
  if (error || !order) return json({ error: 'Could not create order' }, 500)

  const rz = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: razorpayAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: total * 100, currency: 'INR', receipt: order.id.slice(0, 40), notes: { order_id: order.id, employer_id: auth.user.id, plan_id: plan.id } }),
  })
  const rzo = await rz.json()
  if (!rz.ok || !rzo.id) {
    await db.from('payment_orders').update({ status: 'failed' }).eq('id', order.id)
    return json({ error: 'Payment provider error' }, 502)
  }
  await db.from('payment_orders').update({ provider_order_id: rzo.id }).eq('id', order.id)
  return json({ order_id: rzo.id, amount: total * 100, key_id: env('RAZORPAY_KEY_ID') })
})
