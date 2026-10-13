export interface Job {
  id: string
  title: string
  company_name: string
  company_logo?: string
  category: string
  employment_type: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship'
  experience_level: string | null
  location: string
  taluk: string
  area_id?: string | null
  salary_min: number | null
  salary_max: number | null
  description: string
  requirements: string[]
  benefits?: string[]
  status: 'draft' | 'pending_review' | 'published' | 'closed' | 'rejected'
  created_at: string
  urgent?: boolean
  featured?: boolean
}

// Mirrors the district's six official taluks. The database is authoritative at runtime.
export const KOLAR_TALUKS = [
  'All Taluks',
  'Bangarpet',
  'KGF',
  'Kolar',
  'Malur',
  'Mulbagal',
  'Srinivaspur',
]

// Visual metadata only. Display names and available categories are loaded from Supabase.
export const JOB_CATEGORY_STYLES: Record<string, { detail: string; color: string; accentColor: string }> = {
  manufacturing: { detail: 'Production, manufacturing and engineering openings', color: 'from-amber-500 to-rose-500', accentColor: '#e11d48' },
  technology: { detail: 'Software, technology and electronics roles', color: 'from-blue-500 to-indigo-600', accentColor: '#2563eb' },
  healthcare: { detail: 'Healthcare and medical service roles', color: 'from-emerald-500 to-teal-600', accentColor: '#059669' },
  education: { detail: 'Education and teaching opportunities', color: 'from-orange-500 to-amber-600', accentColor: '#d97706' },
  sales: { detail: 'Sales and customer-facing positions', color: 'from-violet-500 to-purple-600', accentColor: '#7c3aed' },
  hospitality: { detail: 'Hospitality and service opportunities', color: 'from-pink-500 to-rose-600', accentColor: '#db2777' },
  'women-friendly': { detail: 'Inclusive opportunities from local employers', color: 'from-pink-500 to-rose-600', accentColor: '#db2777' },
}
