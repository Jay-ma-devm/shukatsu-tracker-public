"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Notification {
  type: string
  message: string
  href: string
  urgent: boolean
}

const CACHE_KEY = "shukatsu_notifications"
const CACHE_TTL = 5 * 60 * 1000 // 5分

function loadCache(): Notification[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch { return null }
}

function saveCache(data: Notification[]) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })) } catch {}
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNotifications = async () => {
    const cached = loadCache()
    if (cached) { setNotifications(cached); return }
    try {
      const res = await fetch("/api/notifications")
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data)
      saveCache(data)
    } catch {}
  }

  useEffect(() => {
    fetchNotifications()
    timerRef.current = setInterval(fetchNotifications, CACHE_TTL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const urgentCount = notifications.filter((n) => n.urgent).length
  const totalCount = notifications.length

  if (totalCount === 0) return null

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="relative inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
        <Bell className="h-4 w-4" />
        <span className={cn(
          "absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-0.5 rounded-full text-[9px] flex items-center justify-center font-bold text-white",
          urgentCount > 0 ? "bg-red-500" : "bg-amber-500"
        )}>
          {totalCount > 9 ? "9+" : totalCount}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground px-2 py-1">通知</p>
        {notifications.map((notif, i) => (
          <Link
            key={i}
            href={notif.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-xs",
              notif.urgent && "border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-950/20"
            )}
          >
            <span>{notif.urgent ? "⚠️" : "ℹ️"}</span>
            <span className={notif.urgent ? "text-red-700 dark:text-red-400" : "text-foreground"}>
              {notif.message}
            </span>
          </Link>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
