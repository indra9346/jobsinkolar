// Verifies the Razorpay checkout signature and confirms the payment is captured
// for the exact amount before granting credits (idempotent).
import { admin, cors, env, hmacHex, json, razorpayAuth, safeEqual } from '../_shared/razorpay.ts'

declare const Deno: { serve(h: (r: Request) => Response | Promise<Response>): void }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const db = admin()
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: auth } = await db.auth.getUser(token)
  if (!auth?.user) return json({ error: 'Sign in again' }, 401)

  let b: { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string }
  try { b = await req.json() } catch { return json({ error: 'Invalid request' }, 400) }
  if (!b.razorpay_order_id || !b.razorpay_payment_id || !b.razorpay_signature) return json({ error: 'Missing fields' }, 400)

  const { data: order } = await db.from('payment_orders').select('*').eq('provider_order_id', b.razorpay_order_id).eq('employer_id', auth.user.id).single()
  if (!order) return json({ error: 'Order not found' }, 404)
  if (order.status === 'paid') return json({ status: 'already_applied' })

  const expected = await hmacHex(env('RAZORPAY_KEY_SECRET'), `${b.razorpay_order_id}|${b.razorpay_payment_id}`)
  if (!safeEqual(expected, b.razorpay_signature)) return json({ error: 'Signature mismatch' }, 400)

  const pr = await fetch(`https://api.razorpay.com/v1/payments/${b.razorpay_payment_id}`, { headers: { Authorization: razorpayAuth() } })
  const p = await pr.json()
  if (!pr.ok || p.order_id !== b.razorpay_order_id || p.amount !== order.total_inr * 100 || p.currency !== 'INR' || p.status !== 'captured') {
    return json({ status: 'pending' }, 202)
  }
  const { error } = await db.rpc('apply_paid_order', { p_order: order.id, p_payment_id: b.razorpay_payment_id })
  if (error) return json({ error: 'Could not apply credits' }, 500)
  return json({ status: 'paid' })
})
