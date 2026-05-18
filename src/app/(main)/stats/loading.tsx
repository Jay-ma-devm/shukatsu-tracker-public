import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-40 mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border rounded-xl p-3 text-center">
            <Skeleton className="h-8 w-16 mx-auto" />
            <Skeleton className="h-3 w-20 mx-auto mt-1" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-xl p-4 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-40 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
