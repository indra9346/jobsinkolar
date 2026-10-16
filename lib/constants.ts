import type { AppStatus, DocKind, JobStatus } from './types'

export const SITE = {
  name: 'Jobs in Kolar',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jobsinkolar.com',
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@jobsinkolar.com',
  // Shown only when configured, so no placeholder number ever reaches users.
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '',
  whatsapp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '',
}

export const TALUKS = ['Kolar', 'Malur', 'Bangarpet', 'KGF', 'Mulbagal', 'Srinivaspur'] as const

export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'] as const

export const WORK_MODES = { on_site: 'Work from office', hybrid: 'Hybrid', remote: 'Work from home', field: 'Field job' } as const
export const PAY_TYPES = { fixed: 'Fixed only', fixed_incentive: 'Fixed + incentive', incentive: 'Incentive only' } as const
export const ENGLISH = { none: 'No English required', basic: 'Basic English', good: 'Good English', fluent: 'Fluent English' } as const
export const SHIFTS = { day: 'Day shift', night: 'Night shift', rotational: 'Rotational', flexible: 'Flexible hours' } as const
export const AVAILABILITY = { immediate: 'Immediately', '15_days': 'Within 15 days', '30_days': 'Within 30 days', '60_days': 'Within 60 days' } as const
export const EDUCATION = ['Below 10th', '10th pass', '12th pass / PUC', 'ITI', 'Diploma', 'Graduate', 'Post graduate'] as const
export const LANGUAGES = ['Kannada', 'English', 'Telugu', 'Tamil', 'Hindi', 'Urdu'] as const
export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'] as const
export const INDUSTRIES = ['Manufacturing', 'Automotive', 'Electronics', 'IT & Software', 'Healthcare', 'Education', 'Retail', 'Logistics', 'Construction', 'Agriculture & Food', 'Hospitality', 'Banking & Finance', 'Mining', 'Government', 'Other'] as const

export const BENEFITS = ['PF', 'ESI', 'Health insurance', 'Transport / bus facility', 'Food / canteen', 'Accommodation', 'Overtime pay', 'Annual bonus', 'Incentives', 'Uniform', 'Paid leave', 'Training provided'] as const

export const SCREENING_SUGGESTIONS = [
  'Are you comfortable working in shifts?',
  'Can you join within 15 days?',
  'Do you have a two-wheeler for commuting?',
  'How many years of relevant experience do you have?',
  'What is your current monthly salary?',
] as const

export const JOB_STATUS: Record<JobStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'gray' },
  pending_review: { label: 'In review', tone: 'amber' },
  published: { label: 'Live', tone: 'green' },
  closed: { label: 'Closed', tone: 'gray' },
  rejected: { label: 'Needs changes', tone: 'red' },
}

export const APP_STATUS: Record<AppStatus, { label: string; tone: Tone; step: number }> = {
  submitted: { label: 'Applied', tone: 'blue', step: 0 },
  reviewing: { label: 'Under review', tone: 'amber', step: 1 },
  shortlisted: { label: 'Shortlisted', tone: 'violet', step: 2 },
  interview: { label: 'Interview', tone: 'violet', step: 3 },
  offered: { label: 'Offered', tone: 'green', step: 4 },
  hired: { label: 'Hired', tone: 'green', step: 5 },
  rejected: { label: 'Not selected', tone: 'red', step: -1 },
  withdrawn: { label: 'Withdrawn', tone: 'gray', step: -1 },
}

export const PIPELINE: AppStatus[] = ['submitted', 'reviewing', 'shortlisted', 'interview', 'offered', 'hired']

export const INTERVIEW_MODE = { in_person: 'In person', phone: 'Phone call', video: 'Video call' } as const

export const DOC_KINDS: Record<DocKind, string> = {
  resume: 'Resume / CV',
  id_proof: 'ID proof (Aadhaar, PAN, Voter ID)',
  education: 'Education certificate',
  experience_letter: 'Experience / relieving letter',
  certificate: 'Skill certificate',
  other: 'Other document',
}

export const DOC_STATUS = {
  pending: { label: 'Pending review', tone: 'amber' },
  verified: { label: 'Verified', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
} as const

export type Tone = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'violet'

export const GST_RATE = 0.18

export const POPULAR_SEARCHES = ['Machine operator', 'Staff nurse', 'Accountant', 'Sales executive', 'Data entry', 'Electrician', 'Teacher', 'Security guard']

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
