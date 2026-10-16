'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { T } from '@/lib/i18n'

/**
 * Realtime: listens for jobs going live and offers a one-tap refresh, so listings
 * stay current without reloading or jumping the page under the reader.
 */
export function LiveJobs({ auto = false }: { auto?: boolean }) {
  const router = useRouter()
  const [fresh, setFresh] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const sb = getSupabase()
    const ch = sb
      .channel('public-jobs-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs', filter: 'status=eq.published' }, () => {
        if (auto) {
          clearTimeout(timer.current)
          timer.current = setTimeout(() => router.refresh(), 800)
        } else setFresh((n) => n + 1)
      })
      .subscribe()
    return () => {
      clearTimeout(timer.current)
      void sb.removeChannel(ch)
    }
  }, [auto, router])

  if (!fresh) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-30 flex justify-center px-4">
      <button
        onClick={() => {
          setFresh(0)
          router.refresh()
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        className="pointer-events-auto flex animate-pop items-center gap-2 rounded-full bg-navy-800 px-4 py-2 text-sm font-semibold text-white shadow-pop hover:bg-navy-900"
      >
        <ArrowUp size={15} />
        <T vars={{ n: fresh }}>{fresh === 1 ? 'New job posted — show it' : '{n} new jobs posted — show them'}</T>
      </button>
    </div>
  )
}
