import Link from 'next/link'
import { BadgeCheck, Briefcase, Clock, MapPin, Wallet } from 'lucide-react'
import { Avatar } from '@/components/ui/bits'
import { formatSalary, timeAgo } from '@/lib/format'
import { logoUrl } from '@/lib/storage'
import { WORK_MODES } from '@/lib/constants'
import type { Job } from '@/lib/types'
import { SaveJobButton } from './SaveJobButton'

export function experienceLabel(min?: number | null, max?: number | null) {
  if (!min && !max) return 'Freshers can apply'
  if (min && max) return `${min}–${max} yrs exp`
  return `${min || 0}+ yrs exp`
}

export function JobCard({ job, compact = false }: { job: Job; compact?: boolean }) {
  const c = job.companies
  const posted = job.published_at ?? job.created_at
  const fresh = Date.now() - new Date(posted).getTime() < 3 * 86400000
  return (
    <article className="group relative min-w-0 rounded-[var(--radius-card)] border border-line bg-white p-4 transition-[border-color,box-shadow] hover:border-ink-4 hover:shadow-card sm:p-5">
      <div className="flex items-start gap-3.5">
        <Avatar name={c?.name ?? job.company_name} src={logoUrl(c?.logo_path)} size={44} square />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15.5px] leading-snug font-semibold text-ink">
            <Link href={`/jobs/${job.id}`} className="after:absolute after:inset-0 after:content-['']">
              {job.title}
            </Link>
          </h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-ink-3">
            <span className="truncate">{c?.name ?? job.company_name}</span>
            {c?.verified && <BadgeCheck size={15} className="shrink-0 text-navy-500" aria-label="Verified employer" />}
          </p>
        </div>
        <div className="relative z-10 -mt-1 -mr-1">
          <SaveJobButton jobId={job.id} />
        </div>
      </div>

      <div className="mt-3.5 space-y-1.5 text-[13.5px] text-ink-2">
        <p className="flex items-center gap-2">
          <MapPin size={15} className="shrink-0 text-ink-4" />
          <span className="truncate">{job.location}{job.taluk && !job.location.includes(job.taluk) ? `, ${job.taluk}` : ''}</span>
        </p>
        <p className="flex items-center gap-2 font-medium text-ink">
          <Wallet size={15} className="shrink-0 text-ink-4" />
          {formatSalary(job.salary_min, job.salary_max, job.salary_period)}
        </p>
      </div>

      {!compact && (
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          <span className="chip">{WORK_MODES[job.work_mode] ?? 'Work from office'}</span>
          <span className="chip">{job.employment_type}</span>
          <span className="chip">
            <Briefcase size={12} /> {experienceLabel(job.experience_min, job.experience_max)}
          </span>
          {job.walk_in && <span className="chip bg-amber-50 text-amber-800">Walk-in interview</span>}
          {job.openings > 1 && <span className="chip">{job.openings} openings</span>}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-line-2 pt-3 text-xs text-ink-3">
        <span className="flex items-center gap-1.5">
          <Clock size={13} />
          {timeAgo(posted)}
        </span>
        {job.featured ? (
          <span className="font-semibold text-brand-700">Featured</span>
        ) : fresh ? (
          <span className="font-semibold text-emerald-700">New</span>
        ) : null}
      </div>
    </article>
  )
}
