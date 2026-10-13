// Supabase Edge Function called by a Database Webhook on job_alert_deliveries.
// Configure the secrets documented in README.md before enabling the webhook.
// @ts-ignore - Deno resolves this URL import in the Edge Function runtime.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: { env: { get(name: string): string | undefined }; serve(handler: (request: Request) => Response | Promise<Response>): void }

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const resendKey = Deno.env.get('RESEND_API_KEY') || ''
const alertSecret = Deno.env.get('JOB_ALERT_WEBHOOK_SECRET') || ''
const fromEmail = Deno.env.get('ALERT_FROM_EMAIL') || ''
const appUrl = (Deno.env.get('PUBLIC_APP_URL') || '').replace(/\/$/, '')
const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

function escapeHtml(value: unknown) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char)
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  if (!alertSecret || request.headers.get('x-job-alert-secret') !== alertSecret) return new Response('Unauthorized', { status: 401 })
  if (!supabaseUrl || !serviceKey || !resendKey || !fromEmail || !appUrl) return new Response('Alert email is not fully configured', { status: 503 })

  let payload: any
  try { payload = await request.json() } catch { return new Response('Invalid JSON', { status: 400 }) }
  const deliveryId = payload?.record?.id || payload?.id
  if (typeof deliveryId !== 'string') return new Response('Missing delivery record id', { status: 400 })

  const { data: delivery, error: loadError } = await admin.from('job_alert_deliveries')
    .select('id,status,attempt_count,subscription:job_alert_subscriptions(email,active,email_enabled,unsubscribe_token),job:jobs(id,title,company_name,location,description)')
    .eq('id', deliveryId).maybeSingle()
  if (loadError || !delivery) return new Response('Delivery not found', { status: 404 })
  if (delivery.status === 'sent' || delivery.status === 'skipped') return new Response('Already processed', { status: 200 })

  const subscription = Array.isArray(delivery.subscription) ? delivery.subscription[0] : delivery.subscription
  const job = Array.isArray(delivery.job) ? delivery.job[0] : delivery.job
  if (!subscription?.active || !subscription.email_enabled || !job) {
    await admin.from('job_alert_deliveries').update({ status: 'skipped', error_message: 'Subscription inactive or job unavailable' }).eq('id', deliveryId)
    return new Response('Skipped inactive subscription', { status: 200 })
  }

  await admin.from('job_alert_deliveries').update({ status: 'sending', attempt_count: (delivery.attempt_count || 0) + 1, error_message: null }).eq('id', deliveryId)
  const unsubscribeUrl = `${appUrl}/job-alerts/unsubscribe?token=${encodeURIComponent(subscription.unsubscribe_token)}`
  const title = escapeHtml(job.title)
  const company = escapeHtml(job.company_name)
  const location = escapeHtml(job.location)
  const description = escapeHtml(job.description).slice(0, 1400)
  const jobUrl = `${appUrl}/jobs?id=${encodeURIComponent(job.id)}`

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromEmail,
        to: [subscription.email],
        subject: `New Kolar job: ${job.title}`,
        html: `<main style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#20242a"><h1 style="color:#d82d2d">New job in Kolar</h1><h2>${title}</h2><p><strong>${company}</strong> · ${location}</p><p style="line-height:1.6">${description}</p><p><a href="${jobUrl}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#d82d2d;color:white;text-decoration:none">View job</a></p><hr><p style="font-size:12px;color:#68717c">You received this because you subscribed to Jobs in Kolar alerts. <a href="${unsubscribeUrl}">Unsubscribe</a>.</p></main>`,
        text: `New job in Kolar: ${job.title}\n${job.company_name} · ${job.location}\n\n${job.description}\n\nView: ${jobUrl}\nUnsubscribe: ${unsubscribeUrl}`,
      }),
    })
    if (!response.ok) throw new Error(`Resend API returned ${response.status}: ${(await response.text()).slice(0, 1000)}`)
    await admin.from('job_alert_deliveries').update({ status: 'sent', sent_at: new Date().toISOString(), error_message: null }).eq('id', deliveryId)
    return new Response('Alert sent', { status: 200 })
  } catch (error) {
    const message = String(error).slice(0, 1000)
    await admin.from('job_alert_deliveries').update({ status: 'failed', error_message: message }).eq('id', deliveryId)
    return new Response('Alert email failed', { status: 502 })
  }
})
