import { Check, X } from 'lucide-react'
import { APP_STATUS, PIPELINE } from '@/lib/constants'
import { cn, formatDate } from '@/lib/format'
import type { AppStatus } from '@/lib/types'

type Event = { id: string; from_status: string | null; to_status: string; note: string | null; created_at: string }

/** Pipeline stepper with the real timestamps from application_events. */
export function Timeline({ status, events }: { status: AppStatus; events: Event[] }) {
  const reached = new Map<string, string>()
  for (const e of events) reached.set(e.to_status, e.created_at)
  const closed = status === 'rejected' || status === 'withdrawn'
  const lastStep = closed
    ? Math.max(0, ...events.filter((e) => APP_STATUS[e.to_status as AppStatus]?.step >= 0).map((e) => APP_STATUS[e.to_status as AppStatus].step))
    : APP_STATUS[status].step

  return (
    <ol className="mt-4 space-y-0">
      {PIPELINE.map((s, i) => {
        const done = i <= lastStep
        const at = reached.get(s)
        const isLast = i === PIPELINE.length - 1
        if (closed && i > lastStep) return null
        return (
          <li key={s} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && !(closed && i === lastStep) && <span className={cn('absolute top-6 left-[11px] h-[calc(100%-20px)] w-0.5', i < lastStep ? 'bg-navy-600' : 'bg-line')} />}
            <span className={cn('relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2', done ? 'border-navy-600 bg-navy-600 text-white' : 'border-line bg-white')}>
              {done && <Check size={13} strokeWidth={3} />}
            </span>
            <div className="-mt-0.5">
              <p className={cn('text-sm font-medium', done ? 'text-ink' : 'text-ink-4')}>{APP_STATUS[s].label}</p>
              {at && <p className="text-xs text-ink-3">{formatDate(at, true)}</p>}
            </div>
          </li>
        )
      })}
      {closed && (
        <li className="relative flex gap-3">
          <span className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-brand-600 bg-brand-600 text-white">
            <X size={13} strokeWidth={3} />
          </span>
          <div className="-mt-0.5">
            <p className="text-sm font-medium">{APP_STATUS[status].label}</p>
            {reached.get(status) && <p className="text-xs text-ink-3">{formatDate(reached.get(status), true)}</p>}
          </div>
        </li>
      )}
    </ol>
  )
}
