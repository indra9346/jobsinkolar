'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { EmptyState, PageHeader } from '@/components/ui/bits'
import { cn, formatDate } from '@/lib/format'

type Msg = { id: string; name: string; email: string; phone: string | null; topic: string; message: string; status: string; created_at: string }

export function Inbox({ rows, status }: { rows: Msg[]; status: string }) {
  const router = useRouter()
  const toast = useToast()
  const set = async (id: string, s: string) => {
    const { error } = await getSupabase().from('contact_messages').update({ status: s }).eq('id', id)
    if (error) return toast(error.message, 'error')
    router.refresh()
  }
  return (
    <>
      <PageHeader title="Contact inbox" description="Messages from the contact form, payment-link requests and job reports." />
      <div className="mb-4 flex gap-1.5">
        {[['open', 'Open'], ['closed', 'Closed'], ['all', 'All']].map(([k, l]) => (
          <Link key={k} href={`/admin/inbox?status=${k}`} className={cn('rounded-full border px-3 py-1 text-[13px] font-medium', status === k ? 'border-navy-600 bg-navy-50 text-navy-800' : 'border-line text-ink-2 hover:border-ink-4')}>{l}</Link>
        ))}
      </div>
      <section className="card">
        {rows.length === 0 ? <EmptyState icon={<Mail size={20} />} title="Inbox zero" /> : (
          <ul className="divide-y divide-line-2">
            {rows.map((m) => (
              <li key={m.id} className="px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">{m.name} <span className="font-normal text-ink-3">· {m.email}{m.phone ? ` · ${m.phone}` : ''}</span></p>
                  <span className="text-xs text-ink-4">{formatDate(m.created_at, true)}</span>
                </div>
                <p className="mt-0.5 text-xs font-semibold text-ink-3 uppercase">{m.topic}</p>
                <p className="mt-2 text-sm whitespace-pre-line text-ink-2">{m.message}</p>
                <div className="mt-3 flex gap-2">
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: your message to Jobs in Kolar`)}`} className="btn btn-outline btn-sm">Reply by email</a>
                  {m.status === 'open' ? <button onClick={() => set(m.id, 'closed')} className="btn btn-ghost btn-sm">Mark done</button> : <button onClick={() => set(m.id, 'open')} className="btn btn-ghost btn-sm">Reopen</button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
