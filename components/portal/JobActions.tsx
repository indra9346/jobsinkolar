'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import type { JobStatus } from '@/lib/types'

export function JobActions({ id, status, publishedAt, expiresAt, compact = false }: { id: string; status: JobStatus; publishedAt: string | null; expiresAt: string | null; compact?: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const expired = expiresAt ? new Date(expiresAt) <= new Date() : false

  const setStatus = async (next: JobStatus, msg: string) => {
    setBusy(true)
    const { error } = await getSupabase().from('jobs').update({ status: next }).eq('id', id)
    setBusy(false)
    setOpen(false)
    if (error) {
      if (error.message.includes('credits')) {
        toast(error.message, 'error')
        router.push('/employer/billing')
        return
      }
      return toast(error.message, 'error')
    }
    toast(msg)
    router.refresh()
  }

  const remove = async () => {
    if (!confirm('Delete this draft permanently?')) return
    setBusy(true)
    const { error } = await getSupabase().from('jobs').delete().eq('id', id)
    setBusy(false)
    if (error) return toast(error.message, 'error')
    toast('Draft deleted')
    router.push('/employer/jobs')
    router.refresh()
  }

  const items: { label: string; onClick?: () => void; href?: string; danger?: boolean }[] = []
  if (status !== 'closed') items.push({ label: 'Edit job', href: `/employer/post-job?id=${id}` })
  items.push({ label: 'Duplicate', href: `/employer/post-job?duplicate=${id}` })
  if (status === 'published') items.push({ label: 'View public page', href: `/jobs/${id}` })
  if (status === 'draft') items.push({ label: 'Submit for review', onClick: () => setStatus('pending_review', 'Submitted for review') })
  if (status === 'pending_review') items.push({ label: 'Withdraw to drafts', onClick: () => setStatus('draft', 'Moved to drafts') })
  if (status === 'published') items.push({ label: 'Close job', onClick: () => confirm('Close this job? It stops accepting applications.') && setStatus('closed', 'Job closed'), danger: true })
  if (status === 'closed' && publishedAt && !expired) items.push({ label: 'Reopen job', onClick: () => setStatus('published', 'Job reopened') })
  if (status === 'draft') items.push({ label: 'Delete draft', onClick: remove, danger: true })

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} disabled={busy} className={compact ? 'rounded-md p-1.5 text-ink-3 hover:bg-canvas hover:text-ink' : 'btn btn-outline btn-sm'} aria-label="Job actions" aria-expanded={open}>
        <MoreHorizontal size={17} /> {!compact && 'Actions'}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-52 animate-slide-up rounded-lg border border-line bg-white p-1 shadow-pop">
          {items.map((it) =>
            it.href ? (
              <Link key={it.label} href={it.href} className="block rounded-md px-3 py-2 text-sm text-ink-2 hover:bg-canvas hover:text-ink" onClick={() => setOpen(false)}>
                {it.label}
              </Link>
            ) : (
              <button key={it.label} onClick={it.onClick} className={`block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-canvas ${it.danger ? 'text-brand-700' : 'text-ink-2 hover:text-ink'}`}>
                {it.label}
              </button>
            ),
          )}
          {status === 'closed' && expired && <p className="px-3 py-2 text-xs text-ink-3">Expired jobs can’t be reopened. Duplicate it instead.</p>}
        </div>
      )}
    </div>
  )
}
