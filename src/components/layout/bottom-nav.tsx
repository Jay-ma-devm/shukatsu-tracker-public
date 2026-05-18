"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Calendar,
  CheckSquare,
  Search,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()
  const [overdueCount, setOverdueCount] = useState(0)
  const [todayEventCount, setTodayEventCount] = useState(0)

  useEffect(() => {
    fetch("/api/tasks?due=overdue")
      .then((r) => r.ok ? r.json() : [])
      .then((t: unknown[]) => setOverdueCount(Array.isArray(t) ? t.length : 0))
      .catch(() => {})
    const now = new Date()
    const s = new Date(now); s.setHours(0, 0, 0, 0)
    const e = new Date(now); e.setHours(23, 59, 59, 999)
    fetch(`/api/events?from=${s.toISOString()}&to=${e.toISOString()}`)
      .then((r) => r.ok ? r.json() : [])
      .then((ev: unknown[]) => setTodayEventCount(Array.isArray(ev) ? (ev as { completed?: boolean }[]).filter((e) => !e.completed).length : 0))
      .catch(() => {})
  }, [pathname])

  const openCommandPalette = () => {
    const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    document.dispatchEvent(event)
  }

  const urgentCount = overdueCount + todayEventCount
  const items = [
    { href: "/", label: "ホーム", icon: LayoutDashboard, badge: 0 },
    { href: "/today", label: "今日", icon: Zap, badge: urgentCount },
    { href: "/companies", label: "企業", icon: Building2, badge: 0 },
    { href: "/tasks", label: "タスク", icon: CheckSquare, badge: overdueCount },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur-sm safe-area-inset-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors min-w-[52px]",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 h-3.5 min-w-[14px] px-0.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold leading-none">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={openCommandPalette}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors min-w-[52px] text-muted-foreground hover:text-foreground"
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-medium">検索</span>
        </button>
      </div>
    </nav>
  )
}
