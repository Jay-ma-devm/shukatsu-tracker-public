"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  addWeeks,
  subMonths,
  subWeeks,
  isSameMonth,
  isToday,
} from "date-fns"
import { ja } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, List, CalendarDays, Calendar, Check, Download } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EventTypeBadge } from "@/components/common/status-badge"
import { EVENT_TYPES } from "@/lib/constants"
import { EventFormModal } from "./event-form-modal"
import { formatTimeOnly } from "@/lib/utils/date"
import type { Event, Company, EventType } from "@/types"
import { cn } from "@/lib/utils"

type EventWithCompany = Event & { company: Company | null }
type CompanyOption = { id: string; name: string }
type DueTask = { id: string; title: string; dueAt: Date | null; status: string; priority: number }
type DueMeeting = { id: string; title: string; conductedAt: Date; type: string; company: { id: string; name: string } | null }

type ViewMode = "month" | "week" | "list"

const EVENT_TYPE_COLORS: Record<string, string> = {
  interview: "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300",
  case_interview: "bg-violet-100 text-violet-800 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300",
  deadline: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300",
  task: "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300",
  meeting: "bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-300",
  info_session: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300",
  coffee_chat: "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-300",
}

function getEventColor(type: string, completed: boolean) {
  if (completed) return "bg-muted text-muted-foreground line-through"
  return EVENT_TYPE_COLORS[type] ?? "bg-primary/10 text-primary hover:bg-primary/20"
}

interface CalendarPageClientProps {
  initialEvents: EventWithCompany[]
  companies: CompanyOption[]
  dueTasks?: DueTask[]
  dueMeetings?: DueMeeting[]
}

export function CalendarPageClient({ initialEvents, companies, dueTasks = [], dueMeetings = [] }: CalendarPageClientProps) {
  const searchParams = useSearchParams()
  const [events, setEvents] = useState(initialEvents)
  const initialDate = (() => {
    const d = searchParams.get("date")
    if (!d) return new Date()
    const parsed = new Date(d)
    return isNaN(parsed.getTime()) ? new Date() : parsed
  })()
  const [currentDate, setCurrentDate] = useState(initialDate)
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "month"
    return (localStorage.getItem("calendar-view") as ViewMode) ?? "month"
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingEvent, setEditingEvent] = useState<EventWithCompany | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const navigate = (dir: 1 | -1) => {
    if (view === "week") {
      setCurrentDate((d) => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1))
    } else {
      setCurrentDate((d) => dir === 1 ? addMonths(d, 1) : subMonths(d, 1))
    }
  }

  const headerLabel = view === "week"
    ? `${format(startOfWeek(currentDate, { locale: ja }), "M/d(E)", { locale: ja })} 〜 ${format(endOfWeek(currentDate, { locale: ja }), "M/d(E)", { locale: ja })}`
    : format(currentDate, "yyyy年M月", { locale: ja })

  const tasksByDate = useMemo(() => {
    const map = new Map<string, DueTask[]>()
    for (const task of dueTasks) {
      if (!task.dueAt) continue
      const key = format(new Date(task.dueAt), "yyyy-MM-dd")
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(task)
    }
    return map
  }, [dueTasks])

  const meetingsByDate = useMemo(() => {
    const map = new Map<string, DueMeeting[]>()
    for (const meeting of dueMeetings) {
      const key = format(new Date(meeting.conductedAt), "yyyy-MM-dd")
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(meeting)
    }
    return map
  }, [dueMeetings])

  const filteredEvents = useMemo(() =>
    typeFilter === "all" ? events : events.filter((e) => e.type === typeFilter),
    [events, typeFilter]
  )

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventWithCompany[]>()
    for (const event of filteredEvents) {
      const key = format(new Date(event.startAt), "yyyy-MM-dd")
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(event)
    }
    return map
  }, [filteredEvents])

  const handleCreated = (event: EventWithCompany) => {
    setEvents((prev) => [...prev, event].sort((a, b) =>
      new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    ))
    setShowCreateModal(false)
    toast.success("イベントを作成しました")
  }

  const handleUpdated = (updated: EventWithCompany) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
    setEditingEvent(null)
    toast.success("イベントを更新しました")
  }

  const handleToggleCompleted = async (event: EventWithCompany) => {
    const res = await fetch(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !event.completed }),
    })
    if (res.ok) {
      const updated = await res.json()
      setEvents((prev) => prev.map((e) => e.id === updated.id ? updated : e))
      toast(updated.completed ? "完了にしました" : "未完了に戻しました", { duration: 2000 })
    }
  }

  const handleDeleted = async (id: string) => {
    await fetch(`/api/events/${id}`, { method: "DELETE" })
    setEvents((prev) => prev.filter((e) => e.id !== id))
    setEditingEvent(null)
    toast.success("イベントを削除しました")
  }

  const upcomingEvents = filteredEvents
    .filter((e) => new Date(e.startAt) >= new Date() && !e.completed)
    .slice(0, 15)

  // 月カレンダー用日付
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { locale: ja })
  const calendarEnd = endOfWeek(monthEnd, { locale: ja })
  const calendarDays = useMemo(() => {
    const days: Date[] = []
    let d = calendarStart
    while (d <= calendarEnd) {
      days.push(d)
      d = addDays(d, 1)
    }
    return days
  }, [calendarStart, calendarEnd])

  // 週カレンダー用日付
  const weekStart = startOfWeek(currentDate, { locale: ja })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              今日
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => navigate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <h1 className="text-lg font-bold">{headerLabel}</h1>
            {(() => {
              const nextInterview = [...events]
                .filter((e) => ["interview", "case_interview"].includes(e.type) && !e.completed && new Date(e.startAt) >= new Date())
                .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0]
              if (nextInterview) {
                const days = Math.ceil((new Date(nextInterview.startAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                if (days <= 7) return (
                  <p className={`text-xs font-medium ${days <= 1 ? "text-red-500" : days <= 3 ? "text-amber-600" : "text-primary"}`}>
                    🎯 {nextInterview.company?.name ?? ""}の面接まで{days === 0 ? "今日！" : days === 1 ? "明日" : `${days}日`}
                  </p>
                )
              }
              return null
            })()}
            {(() => {
              const todayKey = format(new Date(), "yyyy-MM-dd")
              const todayEvents = eventsByDate.get(todayKey) ?? []
              const todayMeetings = meetingsByDate.get(todayKey) ?? []
              const todayTasks2 = tasksByDate.get(todayKey) ?? []
              const total = todayEvents.length + todayMeetings.length + todayTasks2.length
              if (total === 0) return null
              return (
                <p className="text-xs text-muted-foreground">
                  今日: {total}件の予定
                  {todayEvents.length > 0 && ` (イベント${todayEvents.length})`}
                  {todayMeetings.length > 0 && ` (OB${todayMeetings.length})`}
                  {todayTasks2.length > 0 && ` (タスク期限${todayTasks2.length})`}
                </p>
              )
            })()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* ビュー切替 */}
          <div className="flex rounded-lg border overflow-hidden">
            {([["month", <Calendar key="m" className="h-3.5 w-3.5" />], ["week", <CalendarDays key="w" className="h-3.5 w-3.5" />], ["list", <List key="l" className="h-3.5 w-3.5" />]] as const).map(([v, icon]) => (
              <Button
                key={v}
                variant={view === v ? "default" : "ghost"}
                size="sm"
                onClick={() => { const newView = v as ViewMode; setView(newView); localStorage.setItem("calendar-view", newView) }}
                className="rounded-none h-7 px-2"
              >
                {icon}
              </Button>
            ))}
          </div>
          <button
            onClick={() => setTypeFilter(typeFilter === "deadline" ? "all" : "deadline")}
            className={`h-7 px-2 text-xs border rounded-md transition-colors flex items-center gap-1 ${typeFilter === "deadline" ? "bg-red-50 border-red-300 text-red-600 dark:bg-red-950/30" : "text-muted-foreground hover:text-foreground"}`}
          >
            🔴 締切のみ
          </button>
          <Select value={typeFilter} onValueChange={(v: string | null) => setTypeFilter(v ?? "all")}>
            <SelectTrigger className="h-7 w-36 text-sm">
              <SelectValue placeholder="種別" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての種別</SelectItem>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground hidden sm:flex"
            onClick={() => {
              const a = document.createElement("a")
              a.href = "/api/calendar/ical"
              a.download = `shukatsu-${new Date().toISOString().split("T")[0]}.ics`
              a.click()
              toast.success("iCalファイルをダウンロードしました")
            }}
            title="Googleカレンダー/Apple Calendarにインポートできます"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" onClick={() => { setSelectedDate(null); setShowCreateModal(true) }}>
            <Plus className="h-3.5 w-3.5" />
            追加
          </Button>
        </div>
      </div>

      {/* 色凡例 */}
      <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
        {[
          { label: "面接", color: "bg-amber-300" },
          { label: "ケース面接", color: "bg-violet-300" },
          { label: "締め切り", color: "bg-red-300" },
          { label: "タスク期限", color: "bg-blue-300" },
          { label: "説明会", color: "bg-emerald-300" },
          { label: "OB訪問", color: "bg-teal-300" },
          { label: "コーヒーチャット", color: "bg-orange-300" },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1">
            <span className={`inline-block w-2.5 h-2.5 rounded-sm ${color}`} />
            {label}
          </span>
        ))}
      </div>

      {/* 月サマリー（月表示時のみ） */}
      {view === "month" && (() => {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const monthEvents = events.filter((e) => {
          const d = new Date(e.startAt)
          return d >= monthStart && d <= monthEnd
        })
        const interviewCount = monthEvents.filter((e) => ["interview", "case_interview"].includes(e.type)).length
        const completedInterviews = monthEvents.filter((e) => ["interview", "case_interview"].includes(e.type) && e.completed).length
        const infoCount = monthEvents.filter((e) => e.type === "info_session").length
        const deadlineCount = monthEvents.filter((e) => e.type === "deadline").length
        if (interviewCount === 0 && deadlineCount === 0 && infoCount === 0) return null
        return (
          <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 flex-wrap">
            {interviewCount > 0 && <span>面接: <span className="font-medium text-amber-600">{interviewCount}件</span>{completedInterviews > 0 && <span className="text-emerald-600 ml-1">({completedInterviews}完了)</span>}</span>}
            {deadlineCount > 0 && <span>締切: <span className="font-medium text-red-500">{deadlineCount}件</span></span>}
            {infoCount > 0 && <span>説明会: <span className="font-medium text-blue-500">{infoCount}件</span></span>}
          </div>
        )
      })()}

      {/* 月表示 */}
      {view === "month" && (
        <div className="border rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 bg-muted/50">
            {["日", "月", "火", "水", "木", "金", "土"].map((day, i) => (
              <div key={day} className={cn("py-2 text-center text-xs font-medium text-muted-foreground", i === 0 && "text-red-400", i === 6 && "text-blue-400")}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 border-t">
            {calendarDays.map((day, idx) => {
              const key = format(day, "yyyy-MM-dd")
              const dayEvents = eventsByDate.get(key) ?? []
              const dayMeetings = meetingsByDate.get(key) ?? []
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isTodayDate = isToday(day)
              const dow = day.getDay()
              return (
                <div
                  key={key}
                  onClick={() => { setSelectedDate(day); setShowCreateModal(true) }}
                  className={cn(
                    "min-h-[80px] p-1.5 border-b border-r cursor-pointer hover:bg-muted/30 transition-colors",
                    !isCurrentMonth && "opacity-40",
                    idx % 7 === 6 && "border-r-0",
                    dow === 0 && "bg-red-50/30 dark:bg-red-950/10"
                  )}
                >
                  <div className="flex items-center justify-end mb-1">
                    <span className={cn(
                      "text-xs w-6 h-6 flex items-center justify-center rounded-full",
                      isTodayDate ? "bg-primary text-primary-foreground font-bold" : "text-foreground",
                      dow === 0 && !isTodayDate && "text-red-500",
                      dow === 6 && !isTodayDate && "text-blue-500"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); setEditingEvent(event) }}
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer",
                          getEventColor(event.type, event.completed)
                        )}
                      >
                        {formatTimeOnly(event.startAt)} {event.title}
                      </div>
                    ))}
                    {dayMeetings.slice(0, Math.max(0, 3 - dayEvents.length)).map((meeting) => (
                      <a
                        key={meeting.id}
                        href="/meetings"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-300 flex items-center gap-0.5"
                      >
                        🤝 {meeting.title}
                      </a>
                    ))}
                    {(tasksByDate.get(key) ?? []).slice(0, Math.max(0, 3 - dayEvents.length - dayMeetings.length)).map((task) => (
                      <a
                        key={task.id}
                        href="/tasks"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 flex items-center gap-0.5"
                      >
                        ✅ {task.title}
                      </a>
                    ))}
                    {(dayEvents.length + dayMeetings.length + (tasksByDate.get(key)?.length ?? 0)) > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length + dayMeetings.length + (tasksByDate.get(key)?.length ?? 0) - 3}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 週表示 */}
      {view === "week" && (
        <div className="border rounded-xl overflow-hidden">
          <div className="grid grid-cols-7">
            {weekDays.map((day, i) => {
              const key = format(day, "yyyy-MM-dd")
              const dayEvents = eventsByDate.get(key) ?? []
              const dayTasks = tasksByDate.get(key) ?? []
              const dayMeetings = meetingsByDate.get(key) ?? []
              const isTodayDate = isToday(day)
              const dow = day.getDay()
              return (
                <div key={key} className={cn("border-r last:border-r-0 min-h-[300px]", dow === 0 && "bg-red-50/30 dark:bg-red-950/10")}>
                  {/* 曜日ヘッダー */}
                  <div
                    className="p-2 border-b text-center cursor-pointer hover:bg-muted/30"
                    onClick={() => { setSelectedDate(day); setShowCreateModal(true) }}
                  >
                    <p className={cn("text-xs font-medium", dow === 0 && "text-red-400", dow === 6 && "text-blue-400")}>
                      {format(day, "E", { locale: ja })}
                    </p>
                    <p className={cn(
                      "text-lg font-bold leading-none mt-0.5 w-8 h-8 flex items-center justify-center rounded-full mx-auto",
                      isTodayDate && "bg-primary text-primary-foreground"
                    )}>
                      {format(day, "d")}
                    </p>
                  </div>
                  {/* イベント */}
                  <div className="p-1.5 space-y-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => setEditingEvent(event)}
                        className={cn(
                          "text-xs p-1.5 rounded-lg cursor-pointer transition-colors",
                          getEventColor(event.type, event.completed)
                        )}
                      >
                        <p className="font-medium text-[11px] leading-tight">{event.title}</p>
                        {event.company && <p className="text-[10px] opacity-70">{event.company.name}</p>}
                        <p className="text-[10px] opacity-70">{formatTimeOnly(event.startAt)}</p>
                      </div>
                    ))}
                    {dayMeetings.map((meeting) => (
                      <a
                        key={meeting.id}
                        href="/meetings"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs p-1.5 rounded-lg block bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-300 transition-colors"
                      >
                        <p className="font-medium text-[11px] leading-tight truncate">🤝 {meeting.title}</p>
                        {meeting.company && <p className="text-[10px] opacity-70">{meeting.company.name}</p>}
                      </a>
                    ))}
                    {dayTasks.map((task) => (
                      <a
                        key={task.id}
                        href="/tasks"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs p-1.5 rounded-lg block bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 transition-colors"
                      >
                        <p className="font-medium text-[11px] leading-tight truncate">✅ {task.title}</p>
                        <p className="text-[10px] opacity-70">期限</p>
                      </a>
                    ))}
                    {dayEvents.length === 0 && dayMeetings.length === 0 && dayTasks.length === 0 && (
                      <p className="text-[10px] text-muted-foreground/40 text-center py-2">-</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* リスト表示 */}
      {view === "list" && (() => {
        const upcomingTasks = dueTasks.filter((t) => t.dueAt && new Date(t.dueAt) >= new Date())
        const upcomingMeetings = dueMeetings.filter((m) => new Date(m.conductedAt) >= new Date())
        const pastMeetings = dueMeetings.filter((m) => new Date(m.conductedAt) < new Date()).slice(0, 5)
        const combined = [
          ...upcomingEvents.map((e) => ({ type: "event" as const, date: new Date(e.startAt), event: e })),
          ...upcomingMeetings.map((m) => ({ type: "meeting" as const, date: new Date(m.conductedAt), meeting: m })),
          ...upcomingTasks.map((t) => ({ type: "task" as const, date: new Date(t.dueAt!), task: t })),
        ].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 20)

        return (
          <div className="space-y-2">
            {pastMeetings.length > 0 && (
              <div className="mb-3 p-3 bg-muted/20 rounded-xl">
                <p className="text-xs font-medium text-muted-foreground mb-2">直近のOB訪問 ({pastMeetings.length}件)</p>
                <div className="space-y-1">
                  {pastMeetings.map((m) => (
                    <a key={m.id} href="/meetings" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <span className="shrink-0 font-mono">{format(new Date(m.conductedAt), "M/d", { locale: ja })}</span>
                      <span className="truncate">🤝 {m.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            <p className="text-sm font-medium text-muted-foreground">直近の予定・期限 ({combined.length}件)</p>
            {combined.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">予定はありません</p>
            ) : (
              combined.map((item, idx) => item.type === "event" ? (
                <div
                  key={item.event.id}
                  onClick={() => setEditingEvent(item.event)}
                  className="flex items-start gap-4 p-3 border rounded-xl hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <div className="min-w-[80px]">
                    <p className="text-xs font-mono text-primary font-medium">
                      {format(item.date, "M/d(E)", { locale: ja })}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatTimeOnly(item.date)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={cn("text-sm font-medium truncate", item.event.completed && "line-through text-muted-foreground")}>{item.event.title}</p>
                      <EventTypeBadge type={item.event.type as EventType} />
                    </div>
                    {item.event.company && (
                      <a
                        href={`/companies/${item.event.company.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        {item.event.company.name}
                      </a>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleCompleted(item.event) }}
                    className={cn(
                      "h-6 w-6 rounded-full border flex items-center justify-center transition-colors shrink-0",
                      item.event.completed
                        ? "bg-emerald-100 border-emerald-400 text-emerald-600"
                        : "border-muted-foreground/30 hover:border-emerald-400 hover:bg-emerald-50"
                    )}
                    title={item.event.completed ? "未完了に戻す" : "完了にする"}
                  >
                    {item.event.completed && <Check className="h-3 w-3" />}
                  </button>
                  <EventTypeBadge type={item.event.type as EventType} />
                </div>
              ) : item.type === "meeting" ? (
                <a
                  key={item.meeting.id}
                  href="/meetings"
                  className="flex items-start gap-4 p-3 border rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-[80px]">
                    <p className="text-xs font-mono text-primary font-medium">
                      {format(item.date, "M/d(E)", { locale: ja })}
                    </p>
                    <p className="text-xs text-muted-foreground">OB訪問</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">🤝 {item.meeting.title}</p>
                    {item.meeting.company && <p className="text-xs text-muted-foreground">{item.meeting.company.name}</p>}
                  </div>
                  <span className="text-[10px] bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 px-1.5 py-0.5 rounded">OB訪問</span>
                </a>
              ) : (
                <a
                  key={item.task.id}
                  href="/tasks"
                  className="flex items-start gap-4 p-3 border rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-[80px]">
                    <p className="text-xs font-mono text-primary font-medium">
                      {format(item.date, "M/d(E)", { locale: ja })}
                    </p>
                    <p className="text-xs text-muted-foreground">期限</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">✅ {item.task.title}</p>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded">タスク</span>
                </a>
              ))
            )}
          </div>
        )
      })()}

      {showCreateModal && (
        <EventFormModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          defaultDate={selectedDate}
          companies={companies}
          onSuccess={handleCreated}
        />
      )}

      {editingEvent && (
        <EventFormModal
          open={!!editingEvent}
          onOpenChange={(open) => !open && setEditingEvent(null)}
          event={editingEvent}
          companies={companies}
          onSuccess={handleUpdated}
          onDelete={handleDeleted}
        />
      )}
    </div>
  )
}
