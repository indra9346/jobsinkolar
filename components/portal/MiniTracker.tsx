import { APP_STATUS, PIPELINE } from '@/lib/constants'
import { cn } from '@/lib/format'
import type { AppStatus } from '@/lib/types'

export function MiniTracker({ status }: { status: AppStatus }) {
  const step = APP_STATUS[status].step
  if (step < 0) return null
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {PIPELINE.map((s, i) => (
        <span key={s} className={cn('h-1.5 w-6 rounded-full', i <= step ? 'bg-navy-600' : 'bg-line')} />
      ))}
    </div>
  )
}
