"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { getPriorityColor } from "@/lib/utils/status"

interface PriorityStarsProps {
  priority: number
  max?: number
  interactive?: boolean
  onChange?: (value: number) => void
  size?: "sm" | "md"
  className?: string
}

export function PriorityStars({
  priority,
  max = 5,
  interactive = false,
  onChange,
  size = "sm",
  className,
}: PriorityStarsProps) {
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
  const color = getPriorityColor(priority)

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < priority
        return (
          <Star
            key={i}
            className={cn(
              sizeClass,
              "transition-colors",
              filled ? cn(color, "fill-current") : "text-muted-foreground/30",
              interactive && "cursor-pointer hover:scale-110"
            )}
            onClick={interactive && onChange ? () => onChange(i + 1) : undefined}
          />
        )
      })}
    </div>
  )
}
