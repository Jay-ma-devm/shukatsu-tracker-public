import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="p-6">
      <Skeleton className="h-7 w-24 mb-4" />
      <div className="flex gap-4 overflow-x-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="min-w-[200px] w-[200px]">
            <Skeleton className="h-5 w-24 mb-2" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="p-3 border rounded-lg space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
