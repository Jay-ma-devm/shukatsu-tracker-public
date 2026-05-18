import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-7 w-24" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="border rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/50 p-2">
          {["日","月","火","水","木","金","土"].map((d) => (
            <div key={d} className="text-center text-xs py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-[80px] border-b border-r p-1.5">
              <Skeleton className="h-5 w-5 rounded-full ml-auto mb-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
