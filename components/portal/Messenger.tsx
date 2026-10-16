'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MessageSquare, Send } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Avatar, EmptyState, ListSkeleton, Spinner } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { APP_STATUS } from '@/lib/constants'
import { cn, timeAgo } from '@/lib/format'
import type { AppStatus } from '@/lib/types'

type Msg = { id: string; application_id: string; sender_id: string; body: string; created_at: string; read_at: string | null }
type Thread = {
  id: string
  status: AppStatus
  candidate_id: string
  employer_id: string
  candidate_snapshot: { full_name?: string }
  jobs: { title: string; company_name: string } | null
  messages: Msg[]
}

export function Messenger({ role, userId }: { role: 'candidate' | 'employer'; userId: string }) {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const qc = useQueryClient()
  const toast = useToast()
  const active = params.get('thread')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)

  const threads = useQuery({
    queryKey: ['threads', role, userId],
    queryFn: async () => {
      const col = role === 'employer' ? 'employer_id' : 'candidate_id'
      const { data, error } = await getSupabase()
        .from('applications')
        .select('id,status,candidate_id,employer_id,candidate_snapshot,jobs(title,company_name),messages(id,application_id,sender_id,body,created_at,read_at)')
        .eq(col, userId)
        .order('created_at', { referencedTable: 'messages', ascending: true })
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as Thread[]
    },
  })

  useEffect(() => {
    const sb = getSupabase()
    const ch = sb
      .channel(`messages-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => qc.invalidateQueries({ queryKey: ['threads', role, userId] }))
      .subscribe()
    return () => {
      void sb.removeChannel(ch)
    }
  }, [qc, role, userId])

  const list = useMemo(() => {
    const all = threads.data ?? []
    return all
      .filter((t) => t.messages.length > 0 || t.id === active)
      .sort((a, b) => (b.messages.at(-1)?.created_at ?? '').localeCompare(a.messages.at(-1)?.created_at ?? ''))
  }, [threads.data, active])

  const thread = (threads.data ?? []).find((t) => t.id === active)
  const unread = (t: Thread) => t.messages.filter((m) => m.sender_id !== userId && !m.read_at).length
  const canSend =
    thread &&
    thread.status !== 'withdrawn' &&
    (role === 'employer' || ['shortlisted', 'interview', 'offered', 'hired'].includes(thread.status) || thread.messages.some((m) => m.sender_id === thread.employer_id))

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
    if (thread && unread(thread) > 0) {
      void getSupabase()
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('application_id', thread.id)
        .neq('sender_id', userId)
        .is('read_at', null)
        .then(() => qc.invalidateQueries({ queryKey: ['threads', role, userId] }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id, thread?.messages.length])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!thread || !text.trim()) return
    setSending(true)
    const { error } = await getSupabase().from('messages').insert({ application_id: thread.id, sender_id: userId, body: text.trim() })
    setSending(false)
    if (error) return toast(error.message.includes('row-level') ? 'You can’t send messages in this conversation yet.' : error.message, 'error')
    setText('')
    qc.invalidateQueries({ queryKey: ['threads', role, userId] })
  }

  const title = (t: Thread) => (role === 'employer' ? t.candidate_snapshot?.full_name || 'Candidate' : t.jobs?.company_name ?? 'Employer')
  const open = (id: string | null) => router.replace(id ? `${pathname}?thread=${id}` : pathname, { scroll: false })

  return (
    <div className="card grid h-[calc(100dvh-210px)] min-h-[460px] overflow-hidden md:grid-cols-[300px_1fr] lg:h-[calc(100dvh-170px)]">
      <div className={cn('flex min-h-0 flex-col border-line md:border-r', active && 'hidden md:flex')}>
        <div className="border-b border-line px-4 py-3">
          <p className="font-semibold">Conversations</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {threads.isLoading ? (
            <ListSkeleton rows={4} />
          ) : list.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={20} />}
              title="No messages yet"
              body={role === 'employer' ? 'Start a conversation from any applicant’s profile.' : 'Employers can message you about your applications. You can reply here.'}
              action={role === 'employer' ? <Link href="/employer/applications" className="btn btn-outline btn-sm">View applicants</Link> : undefined}
            />
          ) : (
            list.map((t) => {
              const last = t.messages.at(-1)
              const n = unread(t)
              return (
                <button key={t.id} onClick={() => open(t.id)} className={cn('flex w-full gap-3 border-b border-line-2 px-4 py-3 text-left hover:bg-canvas', t.id === active && 'bg-navy-50/60')}>
                  <Avatar name={title(t)} size={38} square={role === 'candidate'} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn('truncate text-sm', n ? 'font-semibold' : 'font-medium')}>{title(t)}</span>
                      {last && <span className="shrink-0 text-[11px] text-ink-4">{timeAgo(last.created_at)}</span>}
                    </span>
                    <span className="block truncate text-xs text-ink-3">{t.jobs?.title}</span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className={cn('flex-1 truncate text-[13px]', n ? 'text-ink' : 'text-ink-3')}>{last ? `${last.sender_id === userId ? 'You: ' : ''}${last.body}` : 'New conversation'}</span>
                      {n > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-[10px] leading-4 font-bold text-white">{n}</span>}
                    </span>
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>

      <div className={cn('flex min-h-0 flex-col', !active && 'hidden md:flex')}>
        {!thread ? (
          <div className="flex flex-1 items-center justify-center">
            {active && threads.isLoading ? <Spinner className="text-ink-3" /> : <p className="text-sm text-ink-3">Select a conversation</p>}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <button onClick={() => open(null)} className="rounded-md p-1 hover:bg-canvas md:hidden" aria-label="Back">
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{title(thread)}</p>
                <p className="truncate text-xs text-ink-3">{thread.jobs?.title}</p>
              </div>
              <StatusPill tone={APP_STATUS[thread.status].tone}>{APP_STATUS[thread.status].label}</StatusPill>
              <Link href={role === 'employer' ? `/employer/applications/${thread.id}` : `/candidate/applications/${thread.id}`} className="btn btn-ghost btn-sm hidden sm:inline-flex">
                {role === 'employer' ? 'Profile' : 'Application'}
              </Link>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-canvas/50 px-4 py-4">
              {thread.messages.length === 0 && <p className="py-10 text-center text-sm text-ink-3">Send the first message. Be clear about the role and next steps.</p>}
              {thread.messages.map((m) => {
                const mine = m.sender_id === userId
                return (
                  <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[80%] rounded-2xl px-3.5 py-2 text-sm', mine ? 'rounded-br-md bg-navy-700 text-white' : 'rounded-bl-md border border-line bg-white')}>
                      <p className="break-words whitespace-pre-line">{m.body}</p>
                      <p className={cn('mt-1 text-right text-[10px]', mine ? 'text-white/60' : 'text-ink-4')}>
                        {timeAgo(m.created_at)}
                        {mine && m.read_at ? ' · Seen' : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottom} />
            </div>
            {canSend ? (
              <form onSubmit={send} className="flex items-end gap-2 border-t border-line p-3">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void send(e)
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder="Write a message"
                  className="input max-h-32 min-h-10 resize-none py-2"
                  aria-label="Message"
                />
                <button className="btn btn-navy h-10 w-10 shrink-0 px-0" disabled={sending || !text.trim()} aria-label="Send">
                  {sending ? <Spinner /> : <Send size={16} />}
                </button>
              </form>
            ) : (
              <p className="border-t border-line px-4 py-3 text-center text-[13px] text-ink-3">
                {thread.status === 'withdrawn' ? 'This application was withdrawn.' : 'You can reply once the employer writes to you or shortlists your application.'}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
