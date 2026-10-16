'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Modal } from '@/components/ui/modal'
import { Spinner } from '@/components/ui/bits'

export function WithdrawButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const toast = useToast()
  const qc = useQueryClient()

  const withdraw = async () => {
    setBusy(true)
    const { error } = await getSupabase().from('applications').update({ status: 'withdrawn' }).eq('id', id)
    setBusy(false)
    if (error) return toast(error.message, 'error')
    setOpen(false)
    toast('Application withdrawn')
    qc.invalidateQueries({ queryKey: ['job-state'] })
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-danger w-full">Withdraw application</button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="sm"
        title="Withdraw this application?"
        description="The employer will be told you are no longer interested. You can’t apply to this job again."
        footer={
          <>
            <button onClick={() => setOpen(false)} className="btn btn-outline">Keep it</button>
            <button onClick={withdraw} className="btn btn-primary" disabled={busy}>{busy ? <Spinner /> : 'Withdraw'}</button>
          </>
        }
      >
        <p className="text-sm text-ink-2">This can’t be undone.</p>
      </Modal>
    </>
  )
}
