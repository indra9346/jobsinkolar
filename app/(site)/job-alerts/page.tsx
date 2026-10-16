import type { Metadata } from 'next'
import { getAreas, getCategories } from '@/lib/queries'
import { JobAlertForm } from './JobAlertForm'

export const revalidate = 3600
export const metadata: Metadata = { title: 'Job alerts', description: 'Get an email when new jobs in your taluk and category are posted.' }

export default async function JobAlertsPage() {
  const [cats, areas] = await Promise.all([getCategories(), getAreas()])
  return (
    <div className="container-x py-12">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-semibold">Job alerts</h1>
        <p className="mt-2 text-ink-3">Choose what you’re looking for. We email you once when a matching job is approved — nothing else. Unsubscribe from any email in one click.</p>
        <JobAlertForm categories={cats.map((c) => c.name)} areas={areas} />
      </div>
    </div>
  )
}
