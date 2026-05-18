"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import { Building2, Calendar, TrendingUp, Star, Clock, CheckSquare, AlertCircle, Check, Plus, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { toast } from "sonner"
import { CompanyStatusBadge } from "@/components/common/status-badge"
import { PriorityStars } from "@/components/common/priority-stars"
import { ReminderBanner } from "./reminder-banner"
import { formatDateShort, isToday, isTomorrow } from "@/lib/utils/date"
import type { Company, Stage, Event, CaseLog, Task, CompanyStatus } from "@/types"
import { cn } from "@/lib/utils"

type CompanyWithData = Company & {
  stages: Stage[]
  _count: { events: number }
  nextEvents?: { startAt: Date | string }[]
}

type EventWithCompany = Event & {
  company: Company | null
}

type TaskWithCompany = Task & {
  company: { id: string; name: string } | null
}

interface WeeklyActivity {
  companiesUpdated: number
  tasksCompleted: number
  interviews: number
  cases: number
  casesLastWeek?: number
  tasksLastWeek?: number
  interviewsLastWeek?: number
}

interface EsProgressItem {
  id: string
  title: string
  companyName: string
  companyId: string
  answered: number
  total: number
  deadline?: string | null
  status?: string
}

interface DashboardPageProps {
  companies: CompanyWithData[]
  upcomingEvents: EventWithCompany[]
  recentCases: CaseLog[]
  todayTasks?: TaskWithCompany[]
  pendingTasks?: TaskWithCompany[]
  weeklyActivity?: WeeklyActivity
  esProgress?: EsProgressItem[]
  userName?: string | null
}

export function DashboardPage({
  companies,
  upcomingEvents,
  recentCases,
  todayTasks: initialTodayTasks = [],
  pendingTasks = [],
  weeklyActivity,
  esProgress = [],
  userName,
}: DashboardPageProps) {
  const [todayTasks, setTodayTasks] = useState(initialTodayTasks)
  const [quickTitle, setQuickTitle] = useState("")
  const [quickAdding, setQuickAdding] = useState(false)
  const quickInputRef = useRef<HTMLInputElement>(null)

  const handleCompleteTask = async (taskId: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    })
    if (res.ok) {
      setTodayTasks((prev) => prev.filter((t) => t.id !== taskId))
      toast.success("タスクを完了しました")
    }
  }

  const handleQuickAdd = useCallback(async () => {
    const title = quickTitle.trim()
    if (!title) return
    setQuickAdding(true)
    const today = new Date()
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, dueAt: today.toISOString().split("T")[0], status: "todo", priority: 3 }),
    })
    if (res.ok) {
      const task = await res.json()
      setTodayTasks((prev) => [...prev, task])
      setQuickTitle("")
      toast.success(`タスクを追加: ${title}`)
    }
    setQuickAdding(false)
  }, [quickTitle])

  const activeCompanies = companies.filter(
    (c) => !["rejected", "withdrawn", "accepted"].includes(c.status)
  )
  const interviewCompanies = companies.filter((c) =>
    ["interview", "internship", "case", "final"].includes(c.status)
  )
  const finalCompanies = companies.filter((c) => c.status === "final")
  const offerCompanies = companies.filter((c) => ["offer", "accepted"].includes(c.status))

  // 優先企業トップ5（ステータス重み付け）
  const topCompanies = [...companies]
    .filter(c => !["rejected", "withdrawn", "accepted"].includes(c.status))
    .sort((a, b) => {
      const statusWeight = (s: string) => {
        if (s === "offer") return 8
        if (s === "final") return 7
        if (s === "case") return 6
        if (s === "internship") return 5
        if (s === "interview") return 4
        if (s === "screening") return 3
        return 1
      }
      const sw = statusWeight(b.status) - statusWeight(a.status)
      if (sw !== 0) return sw
      if (b.starred !== a.starred) return (b.starred ? 1 : 0) - (a.starred ? 1 : 0)
      return b.priority - a.priority
    })
    .slice(0, 5)

  const urgentEvents = upcomingEvents.filter((e) => {
    const start = new Date(e.startAt)
    const diff = (start.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return diff < 2
  })

  // 今日やることの合算（期限超過+今日締切）最大3件
  const allUrgentTasks = [...pendingTasks.slice(0, 3), ...todayTasks.slice(0, 3)]
    .slice(0, 3)

  const kpiStats = [
    { label: "応募中", value: activeCompanies.length, color: "text-blue-500", href: "/companies" },
    { label: "面接中", value: interviewCompanies.length, color: "text-amber-500", href: "/companies?status=interview" },
    { label: "最終選考", value: finalCompanies.length, color: "text-orange-500", href: "/companies?status=final" },
    { label: "内定", value: offerCompanies.length, color: "text-emerald-500", href: "/companies?status=offer" },
  ]

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* 初回ユーザー向けスタートガイド */}
      {companies.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center space-y-3">
          <p className="text-lg font-bold">就活トラッカーへようこそ！</p>
          <p className="text-sm text-muted-foreground">選考中の企業を登録して就活管理を始めましょう。</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/companies?new=1" className={buttonVariants({ size: "sm" })}>
              企業を追加
            </Link>
            <Link href="/cases?new=1" className={buttonVariants({ variant: "outline", size: "sm" })}>
              ケース練習を記録
            </Link>
          </div>
        </div>
      )}

      {/* 1. 緊急アラートバナー */}
      {urgentEvents.length > 0 && <ReminderBanner urgentEvents={urgentEvents} />}

      {/* 2. 最終選考中バナー */}
      {finalCompanies.length > 0 && (
        <div className="rounded-xl border border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 p-3 flex items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-orange-700 dark:text-orange-400">
              最終選考中 {finalCompanies.length}社 — 全力で対策を！
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-500">
              {finalCompanies.map(c => c.name).join("・")}
            </p>
          </div>
          <Link
            href="/today"
            className="text-xs bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-lg hover:opacity-80 shrink-0"
          >
            今日の対策 →
          </Link>
        </div>
      )}

      {/* 内定お祝いバナー */}
      {offerCompanies.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 p-3 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
              おめでとう！内定{offerCompanies.length}社！
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {offerCompanies.map((c) => c.name).join("、")}
            </p>
          </div>
          <Link
            href="/companies/compare"
            className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-lg hover:opacity-80 shrink-0"
          >
            企業比較 →
          </Link>
        </div>
      )}

      {/* Free制限バナー（8社以上で表示） */}
      {companies.length >= 8 && companies.length <= 10 && process.env.NEXT_PUBLIC_AUTH_MODE === "auth" && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 p-3 flex items-center gap-3">
          <span className="text-lg">⭐</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              企業を{companies.length}/10社登録中
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500">無料プランの上限まであと{10 - companies.length}社。Proで無制限に。</p>
          </div>
          <Link href="/pricing" className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition-colors shrink-0 font-medium">
            ¥980で解放 →
          </Link>
        </div>
      )}

      {/* 3. 挨拶 + 日付 */}
      <div>
        <h1 className="text-xl font-bold">{(() => {
          const h = new Date().getHours()
          const todayInterviewEvents = upcomingEvents.filter((e) => {
            const isT = new Date(e.startAt).toDateString() === new Date().toDateString()
            return isT && ["interview", "case_interview"].includes(e.type)
          })
          const name = userName ? `、${userName.split(" ")[0]}` : ""
          if (todayInterviewEvents.length > 0) return `今日は面接があります${name} 💪`
          if (h < 10) return `おはよう${name} ☀️`
          if (h < 17) return `こんにちは${name} 👋`
          return `こんばんは${name} 🌙`
        })()}</h1>
        <div className="flex flex-wrap items-center gap-3 mt-0.5 text-sm text-muted-foreground">
          <span>{new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</span>
          {companies.length > 0 && <AiDailyBriefingButton companies={companies} todayTasks={todayTasks} upcomingEvents={upcomingEvents} pendingTasks={pendingTasks} />}
        </div>
      </div>

      {/* 4. 今日やること（最大3件） */}
      {(allUrgentTasks.length > 0 || pendingTasks.length > 0 || companies.length > 0) && (
        <Card className="border-amber-200 dark:border-amber-800/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-amber-500" />
                今日やること
                {pendingTasks.length > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-normal">
                    {pendingTasks.length}件 期限超過
                  </span>
                )}
              </CardTitle>
              <Link href="/today" className={cn(buttonVariants({ variant: "default", size: "sm" }), "text-xs")}>
                /today で全確認 →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {pendingTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900">
                <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <Link href="/tasks" className="text-sm truncate text-red-800 dark:text-red-300 hover:text-red-600 block">{task.title}</Link>
                  {task.company && (
                    <Link href={`/companies/${task.company.id}`} className="text-[10px] text-red-400/70 hover:text-red-600 transition-colors truncate block">
                      {task.company.name}
                    </Link>
                  )}
                </div>
                <button
                  onClick={async () => {
                    const today = new Date().toISOString().split("T")[0]
                    await fetch(`/api/tasks/${task.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ dueAt: today }),
                    })
                    toast.success("今日に設定しました", { duration: 2000 })
                  }}
                  className="text-[10px] text-red-600 hover:text-red-800 border border-red-300 rounded px-1.5 py-0.5 hover:bg-red-100 transition-colors shrink-0"
                >
                  今日に
                </button>
              </div>
            ))}
            {todayTasks.slice(0, 3 - Math.min(pendingTasks.length, 3)).map((task) => (
              <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                <button
                  onClick={() => handleCompleteTask(task.id)}
                  className="h-4 w-4 rounded border border-amber-400 flex items-center justify-center hover:bg-amber-100 transition-colors shrink-0"
                  title="完了にする"
                >
                  <Check className="h-2.5 w-2.5 text-amber-500 opacity-0 group-hover:opacity-100" />
                </button>
                <div className="flex-1 min-w-0">
                  <Link href="/tasks" className="text-sm truncate hover:text-primary block">{task.title}</Link>
                  {task.company && (
                    <Link href={`/companies/${task.company.id}`} className="text-[10px] text-muted-foreground/60 hover:text-primary transition-colors truncate block">
                      {task.company.name}
                    </Link>
                  )}
                </div>
                <span className="text-xs text-amber-600 font-medium shrink-0">今日</span>
              </div>
            ))}
            {/* インラインクイック追加 */}
            <div className="flex items-center gap-2 px-2">
              <input
                ref={quickInputRef}
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleQuickAdd() }}
                placeholder="今日のタスクをすばやく追加... (Enter)"
                disabled={quickAdding}
                className="flex-1 text-xs h-7 px-2 rounded-md border border-dashed border-amber-300 bg-transparent focus:outline-none focus:border-amber-400 focus:bg-amber-50/50 dark:focus:bg-amber-950/20 placeholder:text-muted-foreground/40 text-foreground transition-colors"
              />
              {quickTitle && (
                <Button size="sm" variant="ghost" onClick={handleQuickAdd} disabled={quickAdding} className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. KPIカード 4つ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiStats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <p className={cn("text-3xl font-bold tabular-nums", stat.color)}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 6. 2カラム: 重要企業 + 直近イベント */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 重要企業リスト */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                重要企業
              </CardTitle>
              <Link href="/companies" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                すべて見る
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {topCompanies.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">企業を追加してください</p>
            ) : (
              topCompanies.map((company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{company.name}</p>
                      {company.starred && (
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {company.position || company.industry || ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <CompanyStatusBadge status={company.status as CompanyStatus} />
                    <PriorityStars priority={company.priority} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* 直近イベント・締切 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-violet-500" />
                直近のイベント
              </CardTitle>
              <Link href="/calendar" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                すべて見る
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">予定はありません</p>
            ) : (
              upcomingEvents.slice(0, 5).map((event) => {
                const urgent = isToday(event.startAt) || isTomorrow(event.startAt)
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "flex items-start gap-3 p-2.5 rounded-lg border",
                      urgent
                        ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"
                        : "border-transparent hover:bg-muted/50"
                    )}
                  >
                    <div className="flex flex-col items-center min-w-[40px]">
                      <span className="text-xs font-mono font-bold text-primary">
                        {formatDateShort(event.startAt)}
                      </span>
                      {(isToday(event.startAt) || isTomorrow(event.startAt)) && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(event.startAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      {event.company && (
                        <p className="text-xs text-muted-foreground">{event.company.name}</p>
                      )}
                    </div>
                    {urgent && (
                      <span className="text-xs text-amber-600 font-medium shrink-0">
                        {isToday(event.startAt) ? "今日" : "明日"}
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* 7. ES進捗（締切が近いもの3件） */}
      {esProgress.length > 0 && esProgress.some((s) => s.total > 0 && s.answered < s.total) && (
        <Card className="border-blue-200 dark:border-blue-800/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-blue-500" />
                ES進捗（締切近い順）
              </CardTitle>
              <Link href="/entry-sheets" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                すべて見る
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {esProgress
              .filter((s) => s.total > 0 && s.answered < s.total)
              .sort((a, b) => {
                if (!a.deadline && !b.deadline) return 0
                if (!a.deadline) return 1
                if (!b.deadline) return -1
                return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
              })
              .slice(0, 3)
              .map((sheet) => {
                const daysUntilDeadline = sheet.deadline
                  ? Math.ceil((new Date(sheet.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null
                const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 3
                return (
                  <Link key={sheet.id} href={`/entry-sheets/${sheet.id}`} className="block group">
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className={cn("font-medium truncate flex-1 group-hover:text-primary transition-colors", isUrgent && "text-red-600")}>
                        {sheet.companyName || sheet.title}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {daysUntilDeadline !== null && (
                          <span className={cn("text-muted-foreground", isUrgent && "text-red-500 font-medium")}>
                            {daysUntilDeadline <= 0 ? "期限切れ" : `${daysUntilDeadline}日後`}
                          </span>
                        )}
                        <span className="text-muted-foreground">{sheet.answered}/{sheet.total}</span>
                      </div>
                    </div>
                    <div className="bg-muted rounded-full h-1.5">
                      <div
                        className={cn("h-1.5 rounded-full transition-all", isUrgent ? "bg-red-500" : "bg-blue-500")}
                        style={{ width: `${sheet.total > 0 ? (sheet.answered / sheet.total) * 100 : 0}%` }}
                      />
                    </div>
                  </Link>
                )
              })}
          </CardContent>
        </Card>
      )}

      {/* 8. 週次活動サマリー */}
      {weeklyActivity && (weeklyActivity.companiesUpdated + weeklyActivity.tasksCompleted + weeklyActivity.interviews + weeklyActivity.cases) > 0 && (
        <div className="rounded-xl border bg-muted/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" />
              今週の活動（7日間）
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {weeklyActivity.companiesUpdated > 0 && (
              <Link href="/companies" className="text-foreground hover:underline">
                <span className="font-bold text-primary">{weeklyActivity.companiesUpdated}</span> 社を更新
              </Link>
            )}
            {weeklyActivity.tasksCompleted > 0 && (
              <Link href="/tasks?status=done" className="text-foreground hover:underline">
                <span className="font-bold text-emerald-600">{weeklyActivity.tasksCompleted}</span> タスク完了
              </Link>
            )}
            {weeklyActivity.interviews > 0 && (
              <Link href="/interviews" className="text-foreground hover:underline">
                <span className="font-bold text-amber-600">{weeklyActivity.interviews}</span> 件面接
              </Link>
            )}
            {weeklyActivity.cases > 0 && (
              <Link href="/cases" className="text-foreground hover:underline">
                <span className="font-bold text-violet-600">{weeklyActivity.cases}</span> ケース練習
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AiDailyBriefingButton({
  companies,
  todayTasks,
  upcomingEvents,
  pendingTasks,
}: {
  companies: CompanyWithData[]
  todayTasks: TaskWithCompany[]
  upcomingEvents: EventWithCompany[]
  pendingTasks: TaskWithCompany[]
}) {
  const [loading, setLoading] = useState(false)
  const [briefing, setBriefing] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (briefing) { setBriefing(null); return }
    setLoading(true)
    try {
      const activeCompanies = companies.filter((c) => !["rejected", "withdrawn", "accepted"].includes(c.status))
      const interviewCompanies = companies.filter((c) => ["interview", "internship", "case", "final"].includes(c.status))
      const urgentEvents = upcomingEvents.filter((e) => {
        const diff = (new Date(e.startAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        return diff <= 2
      })
      const text = [
        `今日の日付: ${new Date().toLocaleDateString("ja-JP")}`,
        `応募中企業: ${activeCompanies.length}社`,
        `面接中企業: ${interviewCompanies.length}社 (${interviewCompanies.slice(0, 3).map((c) => c.name).join("、")})`,
        pendingTasks.length > 0 && `期限超過タスク: ${pendingTasks.length}件`,
        todayTasks.length > 0 && `今日のタスク: ${todayTasks.slice(0, 3).map((t) => t.title).join("、")}`,
        urgentEvents.length > 0 && `直近の予定: ${urgentEvents.slice(0, 3).map((e) => `${e.title}(${e.company?.name ?? ""})`).join("、")}`,
      ].filter(Boolean).join("\n")
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "daily_briefing", text }),
      })
      if (res.ok) {
        const data = await res.json()
        setBriefing(data.summary)
      } else if (res.status === 403) {
        toast.error("AI機能はProプランのみ利用可能です", {
          action: { label: "Proを見る", onClick: () => { window.location.href = "/pricing" } },
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
      >
        <Sparkles className="h-3 w-3" />
        {loading ? "生成中..." : briefing ? "ブリーフィングを閉じる" : "AI朝礼"}
      </button>
      {briefing && (
        <div className="bg-gradient-to-r from-primary/5 to-blue-500/5 border border-primary/20 rounded-xl p-3 text-sm max-w-sm whitespace-pre-wrap">
          {briefing}
        </div>
      )}
    </div>
  )
}
