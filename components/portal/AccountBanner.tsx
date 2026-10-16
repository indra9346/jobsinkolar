import { ShieldAlert } from 'lucide-react'
import { SITE } from '@/lib/constants'

export function AccountBanner({ status }: { status: string }) {
  if (status === 'active') return null
  return (
    <div className="border-b border-brand-200 bg-brand-50">
      <div className="mx-auto flex max-w-[1160px] items-start gap-3 px-4 py-3 text-sm text-brand-800 sm:px-6">
        <ShieldAlert size={18} className="mt-0.5 shrink-0" />
        <p>
          Your account is <strong>{status}</strong>. You can view your data, but you can&apos;t apply, post or message until it is restored. Write to{' '}
          <a href={`mailto:${SITE.email}`} className="font-medium underline">{SITE.email}</a>.
        </p>
      </div>
    </div>
  )
}
