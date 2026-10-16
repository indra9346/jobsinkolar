import { Skeleton } from '@/components/ui/bits'

export function PortalLoading() {
  return (
    <div aria-busy aria-label="Loading">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-[10px]" />
        ))}
      </div>
      <Skeleton className="mt-6 h-72 rounded-[10px]" />
    </div>
  )
}
