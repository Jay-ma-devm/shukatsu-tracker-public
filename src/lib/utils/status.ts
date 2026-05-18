import { COMPANY_STATUSES, STAGE_STATUSES, EVENT_TYPES } from "@/lib/constants"
import type { CompanyStatus, EventType, StageStatus } from "@/types"

export function getStatusConfig(status: CompanyStatus) {
  return (
    COMPANY_STATUSES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      color: "text-zinc-500",
      bgColor: "bg-zinc-100",
    }
  )
}

export function getStageStatusConfig(status: StageStatus) {
  return (
    STAGE_STATUSES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      color: "text-zinc-500",
    }
  )
}

export function getEventTypeConfig(type: EventType) {
  return (
    EVENT_TYPES.find((e) => e.value === type) ?? {
      value: type,
      label: type,
      icon: "📅",
    }
  )
}

export function getPriorityColor(priority: number): string {
  if (priority >= 5) return "text-red-500"
  if (priority >= 4) return "text-orange-500"
  if (priority >= 3) return "text-amber-500"
  if (priority >= 2) return "text-blue-400"
  return "text-zinc-400"
}

export function getStatusOrder(status: CompanyStatus): number {
  const order: Record<CompanyStatus, number> = {
    applied: 1,
    screening: 2,
    interview: 3,
    internship: 3.5,
    case: 4,
    final: 5,
    offer: 6,
    accepted: 7,
    rejected: 8,
    withdrawn: 9,
  }
  return order[status] ?? 99
}

export function isActiveStatus(status: CompanyStatus): boolean {
  return !["rejected", "withdrawn", "accepted"].includes(status)
}
