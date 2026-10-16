import { Skeleton } from '@/components/ui/bits'

export default function Loading() {
  return (
    <div className="bg-canvas">
      <div className="container-x py-8">
        <Skeleton className="mb-4 h-4 w-40" />
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <div className="card space-y-4 p-6">
              <div className="flex gap-4">
                <Skeleton className="size-14 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <div className="grid gap-4 pt-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-9" />
                ))}
              </div>
            </div>
            <Skeleton className="h-64 rounded-[10px]" />
          </div>
          <Skeleton className="h-40 rounded-[10px]" />
        </div>
      </div>
    </div>
  )
}
