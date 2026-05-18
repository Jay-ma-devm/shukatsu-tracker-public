import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-xl p-4 space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-7 flex-1" />
              <Skeleton className="h-7 w-24" />
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
