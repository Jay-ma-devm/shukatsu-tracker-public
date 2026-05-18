import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  differenceInDays,
} from "date-fns"
import { ja } from "date-fns/locale"

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "yyyy/MM/dd", { locale: ja })
}

export function formatDatetime(date: Date | string | null | undefined): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "yyyy/MM/dd HH:mm", { locale: ja })
}

export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "M/d(E)", { locale: ja })
}

export function formatTimeOnly(date: Date | string | null | undefined): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "HH:mm", { locale: ja })
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  if (isToday(d)) return "今日"
  if (isTomorrow(d)) return "明日"
  if (isYesterday(d)) return "昨日"
  return formatDistanceToNow(d, { locale: ja, addSuffix: true })
}

export function isEventUrgent(date: Date | string | null | undefined): boolean {
  if (!date) return false
  const d = typeof date === "string" ? new Date(date) : date
  const diff = differenceInDays(d, new Date())
  return diff >= 0 && diff <= 3
}

export {
  isToday,
  isTomorrow,
  isPast,
  isFuture,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  format,
}
