"use client"

import Link from "next/link"
import { AlertTriangle, X, Clock } from "lucide-react"
import { useState } from "react"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { formatDate, isToday, isTomorrow } from "@/lib/utils/date"
import type { Event, Company } from "@/types"
import { cn } from "@/lib/utils"

type EventWithCompany = Event & { company: Company | null }

interface ReminderBannerProps {
  urgentEvents: EventWithCompany[]
}

export function ReminderBanner({ urgentEvents }: ReminderBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed || urgentEvents.length === 0) return null

  const todayEvents = urgentEvents.filter((e) => isToday(e.startAt))
  const tomorrowEvents = urgentEvents.filter((e) => isTomorrow(e.startAt))

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            直近のアクションが必要なイベント
          </p>
          <div className="mt-1.5 space-y-1">
            {urgentEvents.slice(0, 4).map((event) => (
              <div key={event.id} className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                <Clock className="h-3 w-3 shrink-0" />
                <span className={cn(
                  "font-medium",
                  isToday(event.startAt) ? "text-red-600 dark:text-red-400" : "text-amber-700"
                )}>
                  {isToday(event.startAt) ? "今日" : isTomorrow(event.startAt) ? "明日" : formatDate(event.startAt)}
                </span>
                <span className="truncate">{event.title}</span>
                {event.company && <span className="text-amber-500 shrink-0">({event.company.name})</span>}
              </div>
            ))}
          </div>
          {/* 面接イベントがある場合の準備ヒント */}
          {urgentEvents.some((e) => ["interview", "case_interview"].includes(e.type)) && (
            <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded-lg p-2 space-y-0.5">
              <p className="font-medium">面接前チェック:</p>
              <p>✓ 企業・面接官の情報確認</p>
              <p>✓ 自己紹介・志望動機を練習</p>
              <p>✓ 逆質問のリスト準備</p>
              <p>✓ 服装・持ち物確認</p>
            </div>
          )}
          <div className="mt-2">
            <Link href="/calendar" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs h-6 text-amber-700 border-amber-300 hover:bg-amber-100")}>
              カレンダーで確認
            </Link>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setDismissed(true)} className="h-6 w-6 text-amber-600 hover:bg-amber-100">
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
