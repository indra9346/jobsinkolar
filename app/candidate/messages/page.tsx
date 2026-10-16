import { Suspense } from 'react'
import { requireRole } from '@/lib/session'
import { Messenger } from '@/components/portal/Messenger'
import { PageHeader } from '@/components/ui/bits'

export const metadata = { title: 'Messages' }

export default async function Page() {
  const { user } = await requireRole('candidate')
  return (
    <>
      <PageHeader title="Messages" />
      <Suspense>
        <Messenger role="candidate" userId={user.id} />
      </Suspense>
    </>
  )
}
