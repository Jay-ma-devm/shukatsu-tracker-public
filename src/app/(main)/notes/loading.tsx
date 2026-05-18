import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex h-full">
      <div className="w-72 border-r p-3 space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-7 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-2.5 space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  )
}
