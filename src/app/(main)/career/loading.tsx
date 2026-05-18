import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-8 w-28" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-7 w-16" />
          <div className="pl-6 space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="p-4 border rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
