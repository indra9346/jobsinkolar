export type Role = 'candidate' | 'employer' | 'admin'
export type AccountStatus = 'active' | 'blocked' | 'suspended'
export type JobStatus = 'draft' | 'pending_review' | 'published' | 'closed' | 'rejected'
export type AppStatus = 'submitted' | 'reviewing' | 'shortlisted' | 'interview' | 'offered' | 'hired' | 'rejected' | 'withdrawn'
export type DocKind = 'resume' | 'id_proof' | 'education' | 'experience_letter' | 'certificate' | 'other'
export type DocStatus = 'pending' | 'verified' | 'rejected'

export interface Profile {
  id: string
  email: string | null
  full_name: string
  role: Role
  is_admin: boolean
  phone: string | null
  headline: string | null
  current_title: string | null
  bio: string | null
  skills: string[]
  languages: string[]
  preferred_categories: string[]
  experience_years: number | null
  education: string | null
  expected_salary: number | null
  availability: 'immediate' | '15_days' | '30_days' | '60_days' | null
  taluk: string | null
  location: string | null
  resume_path: string | null
  open_to_work: boolean
  talent_visible: boolean
  account_status: AccountStatus
  interest_status: string
  company_name: string | null
  english_level: 'none' | 'basic' | 'good' | 'fluent' | null
  gender: 'female' | 'male' | 'other' | null
  created_at: string
  last_active_at: string
}

export interface Job {
  id: string
  employer_id: string
  company_id: string | null
  title: string
  company_name: string
  category: string
  employment_type: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship'
  experience_level: string | null
  experience_min: number
  experience_max: number | null
  location: string
  taluk: string | null
  area_id: string | null
  salary_min: number | null
  salary_max: number | null
  salary_period: 'month' | 'year' | 'day'
  description: string
  requirements: string[]
  skills: string[]
  benefits: string[]
  education: string | null
  openings: number
  work_mode: 'on_site' | 'hybrid' | 'remote' | 'field'
  pay_type: 'fixed' | 'fixed_incentive' | 'incentive'
  incentive_max: number | null
  english_level: 'none' | 'basic' | 'good' | 'fluent'
  interview_address: string | null
  interview_timings: string | null
  contact_name: string | null
  joining_fee: boolean
  joining_fee_amount: number | null
  joining_fee_reason: string | null
  shift: 'day' | 'night' | 'rotational' | 'flexible'
  screening_questions: string[]
  deadline: string | null
  status: JobStatus
  rejection_reason: string | null
  featured: boolean
  walk_in: boolean
  contact_phone: string | null
  views: number
  applications_count: number
  published_at: string | null
  submitted_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  credit_used: boolean
  companies?: { name: string; slug: string; logo_path: string | null; verified: boolean } | null
}

export interface Application {
  id: string
  job_id: string
  candidate_id: string
  employer_id: string
  cover_letter: string | null
  resume_path: string | null
  status: AppStatus
  screening_answers: { question: string; answer: string }[]
  interview_at: string | null
  interview_mode: 'in_person' | 'phone' | 'video' | null
  interview_location: string | null
  interview_note: string | null
  candidate_snapshot: { full_name?: string; headline?: string; experience_years?: number; location?: string; skills?: string[] }
  viewed_at: string | null
  created_at: string
  updated_at: string
  jobs?: Pick<Job, 'id' | 'title' | 'company_name' | 'location' | 'taluk' | 'status' | 'company_id' | 'salary_min' | 'salary_max' | 'salary_period'> | null
}

export interface Company {
  id: string
  name: string
  slug: string
  logo_path: string | null
  industry: string | null
  company_size: string | null
  website: string | null
  about: string | null
  taluk: string | null
  address: string | null
  verified: boolean
  created_at: string
  open_jobs?: number
}

export interface Wallet {
  employer_id: string
  plan_id: string
  job_credits: number
  unlock_credits: number
  job_duration_days: number
  featured_jobs: boolean
  expires_at: string | null
}

export interface Plan {
  id: string
  name: string
  tagline: string | null
  price_inr: number
  job_credits: number
  unlock_credits: number
  validity_days: number
  job_duration_days: number
  featured_jobs: boolean
  highlight: boolean
}

export interface Notification {
  id: string
  kind: string
  title: string
  body: string
  href: string | null
  read_at: string | null
  created_at: string
}

export interface Area {
  id: string
  name: string
  taluk: string
  pincode: string | null
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}
