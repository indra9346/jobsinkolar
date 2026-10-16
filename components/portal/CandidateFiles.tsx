'use client'

import { FileText } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { StatusPill } from '@/components/ui/StatusPill'
import { DOC_KINDS, DOC_STATUS } from '@/lib/constants'
import type { DocKind, DocStatus } from '@/lib/types'

export function CandidateFiles({ resumePath, documents }: { resumePath: string | null; documents: { id: string; kind: string; file_name: string; file_path: string; status: string }[] }) {
  const toast = useToast()
  const open = async (path: string) => {
    const { data, error } = await getSupabase().storage.from('candidate-files').createSignedUrl(path, 120)
    if (error) return toast('You don’t have access to this file.', 'error')
    window.open(data.signedUrl, '_blank', 'noopener')
  }
  const others = documents.filter((d) => d.file_path !== resumePath)
  return (
    <section className="card p-5">
      <h2 className="font-semibold">Resume and documents</h2>
      {!resumePath && others.length === 0 ? (
        <p className="mt-2 text-sm text-ink-3">The candidate hasn’t uploaded any documents.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {resumePath && (
            <li>
              <button onClick={() => open(resumePath)} className="flex w-full items-center gap-3 rounded-lg border border-line p-3 text-left hover:bg-canvas">
                <FileText size={18} className="text-navy-600" />
                <span className="flex-1 text-sm font-medium">Resume</span>
                <span className="text-xs text-ink-3">Open</span>
              </button>
            </li>
          )}
          {others.map((d) => (
            <li key={d.id}>
              <button onClick={() => open(d.file_path)} className="flex w-full items-center gap-3 rounded-lg border border-line p-3 text-left hover:bg-canvas">
                <FileText size={18} className="text-ink-3" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{d.file_name}</span>
                  <span className="block text-xs text-ink-3">{DOC_KINDS[d.kind as DocKind] ?? d.kind}</span>
                </span>
                <StatusPill tone={DOC_STATUS[d.status as DocStatus]?.tone ?? 'gray'}>{DOC_STATUS[d.status as DocStatus]?.label ?? d.status}</StatusPill>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
