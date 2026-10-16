'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FileText } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Modal } from '@/components/ui/modal'
import { EmptyState, PageHeader, Spinner } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { DOC_KINDS, DOC_STATUS } from '@/lib/constants'
import { cn, formatDate } from '@/lib/format'
import type { DocKind, DocStatus } from '@/lib/types'

type Doc = { id: string; kind: DocKind; file_path: string; file_name: string; status: DocStatus; review_note: string | null; created_at: string; profiles: { full_name: string; email: string | null; phone: string | null } | null }

export function DocumentQueue({ docs, status, error }: { docs: Doc[]; status: string; error?: string }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const [rej, setRej] = useState<Doc | null>(null)
  const [note, setNote] = useState('')

  const open = async (d: Doc) => {
    const { data, error } = await getSupabase().storage.from('candidate-files').createSignedUrl(d.file_path, 120)
    if (error) return toast(error.message, 'error')
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  const review = async (d: Doc, next: DocStatus, reviewNote?: string) => {
    setBusy(d.id)
    const { error } = await getSupabase().from('candidate_documents').update({ status: next, review_note: reviewNote ?? null }).eq('id', d.id)
    setBusy(null)
    if (error) return toast(error.message, 'error')
    toast(next === 'verified' ? 'Document verified' : 'Document rejected')
    setRej(null)
    setNote('')
    router.refresh()
  }

  return (
    <>
      <PageHeader title="Document verification" description="Open each file, compare it with the profile, then verify or reject with a reason." />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {[['pending', 'Pending'], ['verified', 'Verified'], ['rejected', 'Rejected'], ['all', 'All']].map(([k, l]) => (
          <Link key={k} href={`/admin/documents?status=${k}`} className={cn('rounded-full border px-3 py-1 text-[13px] font-medium', status === k ? 'border-navy-600 bg-navy-50 text-navy-800' : 'border-line text-ink-2 hover:border-ink-4')}>{l}</Link>
        ))}
      </div>
      <section className="card">
        {error ? <EmptyState title="Could not load documents" body={error} /> : docs.length === 0 ? <EmptyState icon={<FileText size={20} />} title="Nothing to review" /> : (
          <ul className="divide-y divide-line-2">
            {docs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <button onClick={() => open(d)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-canvas text-ink-3"><FileText size={18} /></span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium hover:underline">{d.file_name}</span>
                    <span className="block text-[13px] text-ink-3">{DOC_KINDS[d.kind]} · {d.profiles?.full_name} · {d.profiles?.email} · {formatDate(d.created_at)}</span>
                    {d.review_note && <span className="block text-xs text-brand-700">{d.review_note}</span>}
                  </span>
                </button>
                <StatusPill tone={DOC_STATUS[d.status].tone}>{DOC_STATUS[d.status].label}</StatusPill>
                {d.status !== 'verified' && <button onClick={() => review(d, 'verified')} disabled={busy === d.id} className="btn btn-navy btn-sm">{busy === d.id ? <Spinner size={14} /> : 'Verify'}</button>}
                {d.status !== 'rejected' && <button onClick={() => setRej(d)} className="btn btn-outline btn-sm">Reject</button>}
              </li>
            ))}
          </ul>
        )}
      </section>
      <Modal open={Boolean(rej)} onClose={() => setRej(null)} size="sm" title="Reject document" description={rej?.file_name} footer={<><button onClick={() => setRej(null)} className="btn btn-outline">Cancel</button><button onClick={() => rej && review(rej, 'rejected', note.trim())} disabled={note.trim().length < 5 || busy === rej?.id} className="btn btn-primary">Reject</button></>}>
        <div className="grid gap-2">
          <div className="flex flex-wrap gap-1.5">
            {['Image is blurry or unreadable', 'Name does not match the profile', 'Document is expired', 'Wrong document type', 'Aadhaar number is not masked'].map((r) => (
              <button key={r} onClick={() => setNote(r)} className="rounded-md border border-line px-2 py-1 text-xs text-ink-2 hover:border-ink-4">{r}</button>
            ))}
          </div>
          <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason shown to the candidate" aria-label="Reason" />
        </div>
      </Modal>
    </>
  )
}
