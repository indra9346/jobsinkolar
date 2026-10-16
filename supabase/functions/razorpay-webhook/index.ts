// Razorpay webhook (payment.captured). Backs up verify-payment when the browser
// closes before the handler runs. Deploy with --no-verify-jwt.
import { admin, env, hmacHex, safeEqual } from '../_shared/razorpay.ts'

declare const Deno: { serve(h: (r: Request) => Response | Promise<Response>): void }

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const raw = await req.text()
  const sig = req.headers.get('x-razorpay-signature') ?? ''
  const expected = await hmacHex(env('RAZORPAY_WEBHOOK_SECRET'), raw)
  if (!env('RAZORPAY_WEBHOOK_SECRET') || !safeEqual(expected, sig)) return new Response('Invalid signature', { status: 401 })

  const evt = JSON.parse(raw)
  if (evt.event !== 'payment.captured') return new Response('ignored')
  const p = evt.payload?.payment?.entity
  if (!p?.order_id) return new Response('no order')

  const db = admin()
  const { data: order } = await db.from('payment_orders').select('*').eq('provider_order_id', p.order_id).single()
  if (!order) return new Response('unknown order', { status: 404 })
  if (order.status === 'paid') return new Response('already applied')
  if (p.amount !== order.total_inr * 100 || p.currency !== 'INR') return new Response('amount mismatch', { status: 400 })

  const { error } = await db.rpc('apply_paid_order', { p_order: order.id, p_payment_id: p.id })
  return new Response(error ? 'error' : 'ok', { status: error ? 500 : 200 })
})
