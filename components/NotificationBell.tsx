'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers'
import { timeAgo, cn } from '@/lib/format'
import type { Notification } from '@/lib/types'

export function useNotifications(limit = 30) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const key = ['notifications', user?.id]

  const query = useQuery({
    queryKey: key,
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await getSupabase()
        .from('notifications')
        .select('id,kind,title,body,href,read_at,created_at')
        .order('created_at', { ascending: false })
        .limit(limit)
      return (data ?? []) as Notification[]
    },
  })

  useEffect(() => {
    if (!user) return
    const sb = getSupabase()
    const ch = sb
      .channel(`notif-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ['notifications', user.id] })
        // Most notifications mean some portal data changed too.
        qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'notifications' })
      })
      .subscribe()
    return () => {
      void sb.removeChannel(ch)
    }
  }, [user, qc])

  const markRead = async (ids?: string[]) => {
    const sb = getSupabase()
    let q = sb.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null)
    if (ids) q = q.in('id', ids)
    qc.setQueryData<Notification[]>(key, (old) =>
      old?.map((n) => (!ids || ids.includes(n.id) ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n)),
    )
    await q
  }

  return { ...query, items: query.data ?? [], unread: (query.data ?? []).filter((n) => !n.read_at).length, markRead }
}

export function NotificationBell({ allHref }: { allHref: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { items, unread, markRead } = useNotifications()

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        className="relative flex size-9 items-center justify-center rounded-lg text-ink-2 hover:bg-canvas hover:text-ink"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,380px)] animate-slide-up overflow-hidden rounded-xl border border-line bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button onClick={() => markRead()} className="text-xs font-medium text-navy-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-ink-3">You&apos;re all caught up.</p>
            ) : (
              items.slice(0, 8).map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    void markRead([n.id])
                    setOpen(false)
                    if (n.href) router.push(n.href)
                  }}
                  className={cn('flex w-full gap-3 border-b border-line-2 px-4 py-3 text-left last:border-0 hover:bg-canvas', !n.read_at && 'bg-navy-50/40')}
                >
                  <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.read_at ? 'bg-transparent' : 'bg-brand-600')} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{n.title}</span>
                    <span className="mt-0.5 line-clamp-2 block text-[13px] text-ink-3">{n.body}</span>
                    <span className="mt-1 block text-xs text-ink-4">{timeAgo(n.created_at)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <Link href={allHref} onClick={() => setOpen(false)} className="block border-t border-line px-4 py-2.5 text-center text-[13px] font-medium text-navy-600 hover:bg-canvas">
            View all
          </Link>
        </div>
      )}
    </div>
  )
}
