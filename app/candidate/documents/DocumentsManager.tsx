'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { FileText, ShieldCheck, Trash2, Upload } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { EmptyState, PageHeader, Spinner } from '@/components/ui/bits'
import { StatusPill } from '@/components/ui/StatusPill'
import { DOC_KINDS, DOC_STATUS, MAX_UPLOAD_BYTES } from '@/lib/constants'
import { safeFileName } from '@/lib/storage'
import { formatDate } from '@/lib/format'
import type { DocKind, DocStatus } from '@/lib/types'

type Doc = { id: string; kind: DocKind; file_path: string; file_name: string; size_bytes: number | null; status: DocStatus; review_note: string | null; created_at: string }

const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export function DocumentsManager({ userId, docs, resumePath }: { userId: string; docs: Doc[]; resumePath: string | null }) {
  const router = useRouter()
  const toast = useToast()
  const [kind, setKind] = useState<DocKind>('id_proof')
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    if (!ALLOWED.includes(file.type)) return toast('Upload a PDF, JPG, PNG or Word file', 'error')
    if (file.size > MAX_UPLOAD_BYTES) return toast('File is larger than 5 MB', 'error')
    setBusy(true)
    const sb = getSupabase()
    const path = `${userId}/${kind}-${Date.now()}-${safeFileName(file.name)}`
    const up = await sb.storage.from('candidate-files').upload(path, file, { contentType: file.type })
    if (up.error) {
      setBusy(false)
      return toast(up.error.message, 'error')
    }
    const { error } = await sb.from('candidate_documents').insert({ candidate_id: userId, kind, file_path: path, file_name: file.name, size_bytes: file.size })
    if (error) {
      await sb.storage.from('candidate-files').remove([path])
      setBusy(false)
      return toast(error.message, 'error')
    }
    if (kind === 'resume') await sb.from('profiles').update({ resume_path: path }).eq('id', userId)
    setBusy(false)
    if (input.current) input.current.value = ''
    toast('Uploaded. Our team will review it shortly.')
    router.refresh()
  }

  const view = async (d: Doc) => {
    const { data, error } = await getSupabase().storage.from('candidate-files').createSignedUrl(d.file_path, 120)
    if (error) return toast(error.message, 'error')
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  const remove = async (d: Doc) => {
    if (d.file_path === resumePath) return toast('This is your current resume. Upload a new resume before deleting it.', 'error')
    if (!confirm(`Delete ${d.file_name}?`)) return
    setDeleting(d.id)
    const sb = getSupabase()
    const { error } = await sb.from('candidate_documents').delete().eq('id', d.id)
    if (!error) await sb.storage.from('candidate-files').remove([d.file_path])
    setDeleting(null)
    if (error) return toast(error.message, 'error')
    toast('Document deleted')
    router.refresh()
  }

  return (
    <>
      <PageHeader title="Documents" description="Verified documents earn a badge that employers see in search results." />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="card">
          {docs.length === 0 ? (
            <EmptyState icon={<FileText size={20} />} title="No documents yet" body="Upload an ID proof or certificate to get verified." />
          ) : (
            <ul className="divide-y divide-line-2">
              {docs.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-canvas text-ink-3"><FileText size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => view(d)} className="block max-w-full truncate text-left font-medium hover:underline">{d.file_name}</button>
                    <p className="text-[13px] text-ink-3">
                      {DOC_KINDS[d.kind]} · {formatDate(d.created_at)}
                      {d.size_bytes ? ` · ${(d.size_bytes / 1024 / 1024).toFixed(1)} MB` : ''}
                    </p>
                    {d.status === 'rejected' && d.review_note && <p className="mt-1 text-[13px] text-brand-700">Reason: {d.review_note}</p>}
                  </div>
                  <StatusPill tone={DOC_STATUS[d.status].tone}>{DOC_STATUS[d.status].label}</StatusPill>
                  <button onClick={() => remove(d)} disabled={deleting === d.id} className="rounded-md p-2 text-ink-3 hover:bg-canvas hover:text-brand-700" aria-label={`Delete ${d.file_name}`}>
                    {deleting === d.id ? <Spinner size={15} /> : <Trash2 size={16} />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside className="space-y-4">
          <section className="card p-5">
            <p className="font-semibold">Upload a document</p>
            <div className="field mt-3">
              <label className="label" htmlFor="kind">Document type</label>
              <select id="kind" className="input" value={kind} onChange={(e) => setKind(e.target.value as DocKind)}>
                {Object.entries(DOC_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <input ref={input} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <button onClick={() => input.current?.click()} className="btn btn-navy mt-3 w-full" disabled={busy}>
              {busy ? <Spinner /> : <><Upload size={15} /> Choose file</>}
            </button>
            <p className="mt-2 text-xs text-ink-3">PDF, JPG, PNG or Word. Max 5 MB.</p>
          </section>
          <section className="card flex gap-3 p-5 text-sm text-ink-2">
            <ShieldCheck size={20} className="shrink-0 text-emerald-600" />
            <p>Documents are private. Only our verification team and employers you applied to (or who unlocked your profile) can open them. Mask the first 8 digits of your Aadhaar before uploading.</p>
          </section>
        </aside>
      </div>
    </>
  )
}
