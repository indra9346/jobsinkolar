'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Notice = { id: string; title: string; body: string; href: string | null; read_at: string | null; created_at: string }

export function NotificationBell() {
  const [userId, setUserId] = useState('')
  const [items, setItems] = useState<Notice[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const client = supabase
    if (!client) return
    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | undefined
    let alive = true
    let currentUserId = ''
    async function connect(userId: string) {
      if (!client) return
      if (!alive || currentUserId !== userId) return
      const { data } = await client.from('notifications').select('id,title,body,href,read_at,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(12)
      if (!alive || currentUserId !== userId) return
      setItems((data || []) as Notice[])
      channel = client.channel(`user-notifications-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
          if (payload.eventType === 'INSERT') setItems((current) => [payload.new as Notice, ...current].slice(0, 12))
          if (payload.eventType === 'UPDATE') setItems((current) => current.map((item) => item.id === (payload.new as Notice).id ? payload.new as Notice : item))
        }).subscribe()
    }
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      const nextId = session?.user?.id || ''
      if (nextId === currentUserId) return
      currentUserId = nextId
      setUserId(nextId)
      setItems([])
      if (channel) { void client.removeChannel(channel); channel = undefined }
      if (nextId) queueMicrotask(() => { void connect(nextId) })
    })
    void client.auth.getUser().then(({ data: { user } }) => {
      if (!alive || !user || currentUserId) return
      currentUserId = user.id
      setUserId(user.id)
      void connect(user.id)
    })
    return () => { alive = false; subscription.unsubscribe(); if (channel) void client.removeChannel(channel) }
  }, [])

  const unread = items.filter((item) => !item.read_at).length
  async function markRead(item: Notice) {
    if (!supabase || !userId || item.read_at) return
    const readAt = new Date().toISOString()
    const { error } = await supabase.from('notifications').update({ read_at: readAt }).eq('id', item.id).eq('user_id', userId)
    if (!error) setItems((current) => current.map((notice) => notice.id === item.id ? { ...notice, read_at: readAt } : notice))
  }

  if (!userId) return null
  return <div style={{ position: 'relative' }}>
    <button type="button" className="button button-secondary button-sm" onClick={() => setOpen((value) => !value)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open}>
      <Bell size={16} />{unread > 0 && <span style={{ minWidth: 18, height: 18, borderRadius: 99, display: 'inline-grid', placeItems: 'center', background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700 }}>{unread > 9 ? '9+' : unread}</span>}
    </button>
    {open && <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', zIndex: 50, width: 'min(360px, calc(100vw - 32px))', background: '#fff', border: '1px solid var(--border-light)', borderRadius: 14, boxShadow: 'var(--shadow-card)', padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 3px 10px' }}><strong>Notifications</strong><span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{unread} unread</span></div>
      {items.length ? <div style={{ maxHeight: 370, overflowY: 'auto', display: 'grid', gap: 6 }}>{items.map((item) => <Link key={item.id} href={item.href || '/dashboard'} onClick={() => { void markRead(item); setOpen(false) }} style={{ display: 'block', textDecoration: 'none', padding: 11, borderRadius: 10, background: item.read_at ? '#fff' : 'var(--primary-light)', border: '1px solid var(--border-light)' }}><strong style={{ display: 'block', fontSize: 13, color: 'var(--text-heading)' }}>{item.title}</strong><span style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{item.body}</span><small style={{ color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleString()}</small></Link>)}</div> : <div className="empty-state" style={{ padding: 20 }}>You’re all caught up.</div>}
      {unread > 0 && <button type="button" className="button button-secondary button-sm" style={{ width: '100%', marginTop: 10 }} onClick={async () => { await Promise.all(items.filter((item) => !item.read_at).map(markRead)) }}><CheckCheck size={14} /> Mark all as read</button>}
    </div>}
  </div>
}
