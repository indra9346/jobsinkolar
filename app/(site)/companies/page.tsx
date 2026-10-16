import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgeCheck, Building2 } from 'lucide-react'
import { getCompanies } from '@/lib/queries'
import { Avatar, EmptyState } from '@/components/ui/bits'
import { logoUrl } from '@/lib/storage'

export const revalidate = 300
export const metadata: Metadata = { title: 'Companies hiring in Kolar', description: 'Verified employers in Kolar district and their open jobs.' }

export default async function CompaniesPage() {
  const companies = await getCompanies()
  return (
    <div className="bg-canvas">
      <div className="border-b border-line bg-white">
        <div className="container-x py-10">
          <h1 className="text-3xl font-semibold">Companies hiring in Kolar</h1>
          <p className="mt-2 max-w-xl text-ink-3">Factories, hospitals, schools and shops with open roles. Verified companies have been checked by our team.</p>
        </div>
      </div>
      <div className="container-x py-8">
        {companies.length === 0 ? (
          <div className="card"><EmptyState icon={<Building2 size={20} />} title="Companies appear here once they post jobs" action={<Link href="/register?role=employer" className="btn btn-primary">List your company</Link>} /></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c) => (
              <Link key={c.id} href={`/companies/${c.slug}`} className="card flex gap-4 p-5 transition-colors hover:border-ink-4">
                <Avatar name={c.name} src={logoUrl(c.logo_path)} size={48} square />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 font-semibold"><span className="truncate">{c.name}</span>{c.verified && <BadgeCheck size={16} className="shrink-0 text-navy-500" />}</p>
                  <p className="truncate text-sm text-ink-3">{[c.industry, c.taluk].filter(Boolean).join(' · ') || 'Kolar district'}</p>
                  <p className="mt-2 text-sm font-medium text-navy-700">{c.open_jobs ? `${c.open_jobs} open job${c.open_jobs === 1 ? '' : 's'}` : 'No open jobs right now'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
