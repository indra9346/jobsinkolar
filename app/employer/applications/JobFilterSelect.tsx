'use client'

import { useRouter } from 'next/navigation'

export function JobFilterSelect({ jobs, value }: { jobs: { id: string; title: string }[]; value: string }) {
  const router = useRouter()
  return (
    <select aria-label="Filter by job" className="input w-full sm:w-64" value={value} onChange={(e) => router.push(e.target.value ? `/employer/applications?job=${e.target.value}` : '/employer/applications')}>
      <option value="">All jobs</option>
      {jobs.map((j) => (
        <option key={j.id} value={j.id}>{j.title}</option>
      ))}
    </select>
  )
}
