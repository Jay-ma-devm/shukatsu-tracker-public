import { cn } from "@/lib/utils"
import { getStatusConfig, getStageStatusConfig, getEventTypeConfig } from "@/lib/utils/status"
import type { CompanyStatus, StageStatus, EventType } from "@/types"
import { Badge } from "@/components/ui/badge"

interface CompanyStatusBadgeProps {
  status: CompanyStatus
  className?: string
}

export function CompanyStatusBadge({ status, className }: CompanyStatusBadgeProps) {
  const config = getStatusConfig(status)
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium border-0", config.bgColor, config.color, className)}
    >
      {config.label}
    </Badge>
  )
}

interface StageStatusBadgeProps {
  status: StageStatus
  className?: string
}

export function StageStatusBadge({ status, className }: StageStatusBadgeProps) {
  const config = getStageStatusConfig(status)
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", config.color, className)}
    >
      {config.label}
    </Badge>
  )
}

interface EventTypeBadgeProps {
  type: EventType
  className?: string
}

export function EventTypeBadge({ type, className }: EventTypeBadgeProps) {
  const config = getEventTypeConfig(type)
  return (
    <Badge variant="outline" className={cn("text-xs gap-1", className)}>
      <span>{config.icon}</span>
      {config.label}
    </Badge>
  )
}
