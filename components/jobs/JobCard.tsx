import Link from 'next/link'
import { BadgeCheck, Briefcase, Clock, MapPin, Sparkles, Users } from 'lucide-react'
import { Avatar } from '@/components/ui/bits'
import { formatSalary } from '@/lib/format'
import { logoUrl } from '@/lib/storage'
import { WORK_MODES } from '@/lib/constants'
import { categoryStyle } from '@/lib/category-style'
import { Ago, T } from '@/lib/i18n'
import type { Job } from '@/lib/types'
import { SaveJobButton } from './SaveJobButton'

export function experienceLabel(min?: number | null, max?: number | null) {
  if (!min && !max) return 'Freshers can apply'
  if (min && max) return `${min}–${max} yrs exp`
  return `${min || 0}+ yrs exp`
}

/** Translatable experience label. */
export function ExperienceText({ min, max }: { min?: number | null; max?: number | null }) {
  if (!min && !max) return <T>Freshers can apply</T>
  if (min && max) return <T vars={{ a: min, b: max }}>{'{a}–{b} yrs exp'}</T>
  return <T vars={{ a: min || 0 }}>{'{a}+ yrs exp'}</T>
}

export function JobCard({ job, compact = false }: { job: Job; compact?: boolean }) {
  const c = job.companies
  const posted = job.published_at ?? job.created_at
  const fresh = Date.now() - new Date(posted).getTime() < 3 * 86400000
  const st = categoryStyle(job.category)
  return (
    <article className="group card card-hover relative h-full min-w-0 overflow-hidden p-4 sm:p-5">
      <span className={`absolute inset-y-0 left-0 w-1 scale-y-0 transition-transform duration-300 group-hover:scale-y-100 ${st.icon_bg}`} aria-hidden />
      <div className="flex items-start gap-3.5">
        <Avatar name={c?.name ?? job.company_name} src={logoUrl(c?.logo_path)} size={46} square className="transition-transform duration-300 group-hover:scale-105" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15.5px] leading-snug font-semibold text-ink transition-colors group-hover:text-navy-700">
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

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13.5px]">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">
          {job.salary_min || job.salary_max ? formatSalary(job.salary_min, job.salary_max, job.salary_period) : <T>Salary not disclosed</T>}
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-ink-2">
          <MapPin size={15} className="shrink-0 text-brand-500" />
          <span className="truncate">
            {job.location}
            {job.taluk && !job.location.includes(job.taluk) ? `, ${job.taluk}` : ''}
          </span>
        </span>
      </div>

      {!compact && (
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          <span className="chip bg-navy-50 text-navy-800">
            <T>{WORK_MODES[job.work_mode] ?? 'Work from office'}</T>
          </span>
          <span className="chip bg-violet-50 text-violet-800">
            <T>{job.employment_type}</T>
          </span>
          <span className="chip">
            <Briefcase size={12} /> <ExperienceText min={job.experience_min} max={job.experience_max} />
          </span>
          {job.walk_in && (
            <span className="chip bg-saffron-50 text-amber-800">
              <T>Walk-in interview</T>
            </span>
          )}
          {job.openings > 1 && (
            <span className="chip">
              <Users size={12} /> <T vars={{ n: job.openings }}>{'{n} openings'}</T>
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-line-2 pt-3 text-xs text-ink-3">
        <span className="flex items-center gap-1.5">
          <Clock size={13} />
          <Ago iso={posted} />
        </span>
        {job.featured ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-500 to-saffron-400 px-2 py-0.5 font-semibold text-white">
            <Sparkles size={11} /> <T>Featured</T>
          </span>
        ) : fresh ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
            <span className="live-dot !size-1.5" /> <T>New</T>
          </span>
        ) : null}
      </div>
    </article>
  )
}
