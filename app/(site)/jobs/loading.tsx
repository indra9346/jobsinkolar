import { Skeleton } from '@/components/ui/bits'

export default function Loading() {
  return (
    <div className="bg-canvas">
      <div className="border-b border-line bg-white">
        <div className="container-x py-6">
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
      <div className="container-x grid gap-6 py-6 lg:grid-cols-[264px_1fr]">
        <Skeleton className="hidden h-[520px] rounded-[10px] lg:block" />
        <div>
          <Skeleton className="mb-4 h-5 w-48" />
          <div className="grid gap-3 xl:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card space-y-3 p-5">
                <div className="flex gap-3">
                  <Skeleton className="size-11 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
