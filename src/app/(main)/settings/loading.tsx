import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <Skeleton className="h-7 w-16" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border rounded-xl p-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}
