'use client'

import { useRouter } from 'next/navigation'
import { Bookmark } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/format'

/** Saved + applied job ids for the signed-in candidate, shared by every card on the page. */
export function useCandidateJobState() {
  const { user, profile } = useAuth()
  const enabled = Boolean(user && profile?.role === 'candidate' && !profile.is_admin)
  return useQuery({
    queryKey: ['job-state', user?.id],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const sb = getSupabase()
      const [saved, applied] = await Promise.all([
        sb.from('saved_jobs').select('job_id'),
        sb.from('applications').select('job_id,id,status'),
      ])
      return {
        saved: new Set((saved.data ?? []).map((r) => r.job_id as string)),
        applied: new Map((applied.data ?? []).map((r) => [r.job_id as string, { id: r.id as string, status: r.status as string }])),
      }
    },
  })
}

export function SaveJobButton({ jobId, withLabel = false }: { jobId: string; withLabel?: boolean }) {
  const { user, profile } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const qc = useQueryClient()
  const { data } = useCandidateJobState()
  const saved = data?.saved.has(jobId) ?? false

  if (profile && profile.role !== 'candidate') return null

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/jobs/${jobId}`)}`)
      return
    }
    const key = ['job-state', user.id]
    qc.setQueryData(key, (old: typeof data) => {
      if (!old) return old
      const next = new Set(old.saved)
      if (saved) next.delete(jobId)
      else next.add(jobId)
      return { ...old, saved: next }
    })
    const sb = getSupabase()
    const { error } = saved
      ? await sb.from('saved_jobs').delete().eq('job_id', jobId).eq('candidate_id', user.id)
      : await sb.from('saved_jobs').insert({ job_id: jobId, candidate_id: user.id })
    if (error) {
      qc.invalidateQueries({ queryKey: key })
      toast(error.message.includes('row-level') ? 'Your account cannot save jobs right now.' : error.message, 'error')
      return
    }
    qc.invalidateQueries({ queryKey: ['saved-jobs'] })
    toast(saved ? 'Removed from saved jobs' : 'Job saved')
  }

  return withLabel ? (
    <button onClick={toggle} className={cn('btn btn-outline', saved && 'border-navy-200 bg-navy-50 text-navy-700')} aria-pressed={saved}>
      <Bookmark size={16} className={saved ? 'fill-current' : ''} /> {saved ? 'Saved' : 'Save'}
    </button>
  ) : (
    <button
      onClick={toggle}
      aria-label={saved ? 'Remove from saved jobs' : 'Save job'}
      aria-pressed={saved}
      className={cn('flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-canvas', saved ? 'text-navy-600' : 'text-ink-4 hover:text-ink-2')}
    >
      <Bookmark size={18} className={saved ? 'fill-current' : ''} />
    </button>
  )
}
