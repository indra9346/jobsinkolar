'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Lock, Trash2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/bits'
import { timeAgo } from '@/lib/format'

export function NotesPanel({ applicationId, userId, notes }: { applicationId: string; userId: string; notes: { id: string; body: string; created_at: string; author_id: string }[] }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    const { error } = await getSupabase().from('application_notes').insert({ application_id: applicationId, author_id: userId, body: text.trim() })
    setBusy(false)
    if (error) return toast(error.message, 'error')
    setText('')
    router.refresh()
  }

  const remove = async (id: string) => {
    const { error } = await getSupabase().from('application_notes').delete().eq('id', id)
    if (error) return toast(error.message, 'error')
    router.refresh()
  }

  return (
    <section className="card p-5">
      <p className="flex items-center gap-1.5 font-semibold"><Lock size={14} className="text-ink-3" /> Private notes</p>
      <p className="text-xs text-ink-3">Only your team sees these.</p>
      <form onSubmit={add} className="mt-3 grid gap-2">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={2000} placeholder="e.g. Good communication, ask about notice period" className="input" aria-label="New note" />
        <button className="btn btn-outline btn-sm justify-self-end" disabled={busy || !text.trim()}>{busy ? <Spinner size={14} /> : 'Add note'}</button>
      </form>
      {notes.length > 0 && (
        <ul className="mt-3 space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="group rounded-lg bg-canvas p-3 text-sm">
              <p className="whitespace-pre-line">{n.body}</p>
              <div className="mt-1 flex items-center justify-between text-xs text-ink-4">
                {timeAgo(n.created_at)}
                {n.author_id === userId && (
                  <button onClick={() => remove(n.id)} className="opacity-60 hover:text-brand-700 hover:opacity-100" aria-label="Delete note"><Trash2 size={13} /></button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
