'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/bits'
import type { AppStatus } from '@/lib/types'

/** One-tap shortlist / reject from the list (apnaHire-style triage). */
export function QuickStatus({ id, status }: { id: string; status: AppStatus }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = useState<null | 'yes' | 'no'>(null)
  if (!['submitted', 'reviewing'].includes(status)) return null

  const set = async (next: AppStatus, which: 'yes' | 'no') => {
    setBusy(which)
    const { error } = await getSupabase().from('applications').update({ status: next }).eq('id', id)
    setBusy(null)
    if (error) return toast(error.message, 'error')
    toast(next === 'shortlisted' ? 'Shortlisted. The candidate has been notified.' : 'Marked as not selected')
    router.refresh()
  }

  return (
    <div className="flex gap-1">
      <button onClick={() => set('shortlisted', 'yes')} disabled={!!busy} className="btn btn-sm border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100" aria-label="Shortlist">
        {busy === 'yes' ? <Spinner size={14} /> : <Check size={15} />} <span className="hidden lg:inline">Shortlist</span>
      </button>
      <button onClick={() => set('rejected', 'no')} disabled={!!busy} className="btn btn-sm btn-outline px-2" aria-label="Reject">
        {busy === 'no' ? <Spinner size={14} /> : <X size={15} />}
      </button>
    </div>
  )
}
