'use client'

import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/components/NotificationBell'
import { EmptyState, ListSkeleton, PageHeader } from '@/components/ui/bits'
import { cn, formatDate, timeAgo } from '@/lib/format'

export function NotificationsList() {
  const router = useRouter()
  const { items, unread, isLoading, markRead } = useNotifications(100)
  return (
    <>
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : 'You’re all caught up'}
        actions={unread > 0 ? <button onClick={() => markRead()} className="btn btn-outline btn-sm">Mark all read</button> : null}
      />
      <section className="card">
        {isLoading ? (
          <ListSkeleton />
        ) : items.length === 0 ? (
          <EmptyState icon={<Bell size={20} />} title="No notifications yet" body="Application updates, messages and account changes appear here." />
        ) : (
          <ul className="divide-y divide-line-2">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => {
                    void markRead([n.id])
                    if (n.href) router.push(n.href)
                  }}
                  className={cn('flex w-full gap-3 px-5 py-4 text-left hover:bg-canvas', !n.read_at && 'bg-navy-50/30')}
                >
                  <span className={cn('mt-2 size-2 shrink-0 rounded-full', n.read_at ? 'bg-transparent' : 'bg-brand-600')} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className={cn('text-sm', n.read_at ? 'font-medium' : 'font-semibold')}>{n.title}</span>
                      <span className="text-xs text-ink-4" title={formatDate(n.created_at, true)}>{timeAgo(n.created_at)}</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-3">{n.body}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
