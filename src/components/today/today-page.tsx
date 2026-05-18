"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckSquare, Circle, Clock, Calendar, Building2, Star, ArrowRight, Check, Copy, Download } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { CompanyStatusBadge } from "@/components/common/status-badge"
import { PriorityStars } from "@/components/common/priority-stars"
import { formatDate, formatDateShort } from "@/lib/utils/date"
import type { Task, Event, Company, CompanyStatus } from "@/types"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

type TaskWithCompany = Task & { company: { id: string; name: string } | null }
type EventWithCompany = Event & { company: { id: string; name: string } | null }
type CompanyBrief = Pick<Company, "id" | "name" | "status" | "priority"> & { notes: string | null }

interface TodayPageClientProps {
  todayTasks: TaskWithCompany[]
  overdueTasks: TaskWithCompany[]
  upcomingTasks: TaskWithCompany[]
  todayEvents: EventWithCompany[]
  upcomingEvents: EventWithCompany[]
  urgentCompanies: CompanyBrief[]
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  interview: "面接",
  case_interview: "ケース面接",
  info_session: "説明会",
  deadline: "締切",
  meeting: "面談",
  task: "タスク",
  coffee_chat: "コーヒーチャット",
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  interview: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  case_interview: "text-violet-600 bg-violet-50 dark:bg-violet-950/30",
  info_session: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  deadline: "text-red-600 bg-red-50 dark:bg-red-950/30",
  meeting: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
}

export function TodayPageClient({ todayTasks, overdueTasks, upcomingTasks, todayEvents, upcomingEvents, urgentCompanies }: TodayPageClientProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const today = new Date()
  const dateStr = format(today, "M月d日（EEEE）", { locale: ja })
  const totalUrgent = overdueTasks.length + todayTasks.length

  const handleComplete = async (taskId: string, taskTitle: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    })
    if (res.ok) {
      setCompletedIds((prev) => new Set([...prev, taskId]))
      toast.success(`✅ 完了: ${taskTitle}`)
    }
  }

  const allTasks = [...overdueTasks, ...todayTasks]
  const pendingCount = allTasks.filter((t) => !completedIds.has(t.id)).length

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            今日やること
            {pendingCount > 0 && (
              <span className="text-sm font-normal bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400 px-2 py-0.5 rounded-full">
                残り{pendingCount}件
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            className="gap-1.5 text-xs"
            onClick={() => {
              const lines: string[] = [`📋 ${dateStr} 今日やること\n`]
              if (overdueTasks.length > 0) {
                lines.push("🔴 期限超過（要対応）")
                overdueTasks.filter(t => !completedIds.has(t.id)).forEach(t => lines.push(`  • ${t.title}${t.company ? ` [${t.company.name}]` : ""}`))
                lines.push("")
              }
              if (todayTasks.length > 0) {
                lines.push("📅 本日締切")
                todayTasks.filter(t => !completedIds.has(t.id)).forEach(t => lines.push(`  • ${t.title}${t.company ? ` [${t.company.name}]` : ""}`))
                lines.push("")
              }
              if (todayEvents.length > 0) {
                lines.push("📆 本日の予定")
                todayEvents.forEach(e => lines.push(`  • ${format(new Date(e.startAt), "HH:mm")} ${e.title}${e.company ? ` [${e.company.name}]` : ""}`))
              }
              navigator.clipboard.writeText(lines.join("\n"))
              toast.success("今日のTO-DOをコピーしました")
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            コピー
          </Button>
          <Button
            variant="ghost" size="sm"
            className="gap-1.5 text-xs text-muted-foreground"
            onClick={() => {
              const lines: string[] = [`# ${dateStr} 今日やること\n`]
              if (overdueTasks.length > 0) {
                lines.push("## 🔴 期限超過（今すぐ対応）")
                overdueTasks.filter(t => !completedIds.has(t.id)).forEach(t => lines.push(`- [ ] ${t.title}${t.company ? ` [${t.company.name}]` : ""}`))
                lines.push("")
              }
              if (todayTasks.length > 0) {
                lines.push("## 📅 本日締切")
                todayTasks.filter(t => !completedIds.has(t.id)).forEach(t => lines.push(`- [ ] ${t.title}${t.company ? ` [${t.company.name}]` : ""}`))
                lines.push("")
              }
              if (todayEvents.length > 0) {
                lines.push("## 📆 本日の予定")
                todayEvents.forEach(e => lines.push(`- ${format(new Date(e.startAt), "HH:mm")} ${e.title}${e.company ? ` [${e.company.name}]` : ""}`))
                lines.push("")
              }
              if (upcomingTasks.length > 0) {
                lines.push("## ⏰ 3日以内の締切")
                upcomingTasks.slice(0, 5).forEach(t => {
                  const d = t.dueAt ? Math.ceil((new Date(t.dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
                  lines.push(`- [ ] ${t.title}${d ? ` (${d === 1 ? "明日" : d + "日後"})` : ""}`)
                })
              }
              const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8;" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `today-${new Date().toISOString().split("T")[0]}.md`
              a.click()
              URL.revokeObjectURL(url)
              toast.success("Markdownでダウンロードしました")
            }}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Link href="/tasks" className={buttonVariants({ variant: "outline", size: "sm" })}>
            タスク一覧 →
          </Link>
        </div>
      </div>

      {/* 期限超過（最重要） */}
      {overdueTasks.length > 0 && (
        <Card className="border-red-300 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              期限超過！対応必須 ({overdueTasks.filter((t) => !completedIds.has(t.id)).length}件)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueTasks.map((task) => (
              <TaskCard key={task.id} task={task} done={completedIds.has(task.id)} onComplete={handleComplete} urgency="overdue" />
            ))}
          </CardContent>
        </Card>
      )}

      {/* 面接直前チェックリスト（今日に面接・ケース面接がある場合） */}
      {todayEvents.filter(e => ["interview", "case_interview"].includes(e.type)).length > 0 && (
        <Card className="border-red-300 dark:border-red-800/80 bg-red-50/30 dark:bg-red-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-600">
              <Star className="h-4 w-4 fill-red-400 text-red-400" />
              🎯 面接直前チェックリスト
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {["服装・身だしなみOK", "接続環境確認（Zoom/Meet）", "入室URLを確認済み", "逆質問3つ用意", "志望動機を言える", "自己PR30秒で言える", "企業名・面接官名を確認", "マイクON・カメラOK"].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-emerald-500">☐</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              企業: {todayEvents.filter(e => ["interview", "case_interview"].includes(e.type)).map(e => e.company?.name ?? e.title).join("・")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 今日のイベント */}
      {todayEvents.length > 0 && (
        <Card className="border-amber-300 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-600">
              <Calendar className="h-4 w-4" />
              本日の予定 ({todayEvents.length}件)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/50">
                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5", EVENT_TYPE_COLORS[event.type] ?? "text-zinc-500 bg-zinc-100")}>
                  {EVENT_TYPE_LABELS[event.type] ?? event.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{event.title}</p>
                  {event.company && (
                    <p className="text-xs text-muted-foreground">{event.company.name}</p>
                  )}
                  {event.notes && <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-2">{event.notes}</p>}
                </div>
                <span className="text-xs font-mono text-amber-700 dark:text-amber-400 shrink-0">
                  {event.startAt ? format(new Date(event.startAt), "HH:mm") : ""}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 今日期限のタスク */}
      {todayTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-blue-500" />
              本日締切タスク ({todayTasks.filter((t) => !completedIds.has(t.id)).length}件)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayTasks.map((task) => (
              <TaskCard key={task.id} task={task} done={completedIds.has(task.id)} onComplete={handleComplete} urgency="today" />
            ))}
          </CardContent>
        </Card>
      )}

      {/* 今日・明日が何もない場合 */}
      {totalUrgent === 0 && todayEvents.length === 0 && (
        <Card className="border-emerald-200">
          <CardContent className="py-6 text-center">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-sm font-medium text-emerald-600">今日の緊急タスクはありません！</p>
            <p className="text-xs text-muted-foreground mt-1">引き続き明日以降の準備を進めましょう</p>
          </CardContent>
        </Card>
      )}

      {/* 3日以内のタスク */}
      {upcomingTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              今週の締切 ({upcomingTasks.length}件)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {upcomingTasks.map((task) => {
              const daysUntil = task.dueAt ? Math.ceil((new Date(task.dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
              return (
                <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <Circle className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span className="text-sm flex-1 truncate">{task.title}</span>
                  {task.company && <span className="text-xs text-muted-foreground hidden sm:block">{task.company.name}</span>}
                  <PriorityStars priority={task.priority} size="sm" />
                  <span className={cn("text-xs font-medium shrink-0", daysUntil === 1 ? "text-orange-500" : daysUntil === 2 ? "text-amber-500" : "text-muted-foreground")}>
                    {daysUntil === 1 ? "明日" : daysUntil === 0 ? "今日" : `${daysUntil}日後`}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* 3日以内のイベント */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-500" />
              直近の予定
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {upcomingEvents.map((event) => {
              const daysUntil = Math.ceil((new Date(event.startAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return (
                <div key={event.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0", EVENT_TYPE_COLORS[event.type] ?? "bg-muted text-muted-foreground")}>
                    {EVENT_TYPE_LABELS[event.type] ?? event.type}
                  </span>
                  <span className="text-sm flex-1 truncate">{event.title}</span>
                  {event.company && <span className="text-xs text-muted-foreground hidden sm:block shrink-0">{event.company.name}</span>}
                  <span className={cn("text-xs font-medium shrink-0", daysUntil === 1 ? "text-orange-500" : daysUntil === 2 ? "text-amber-500" : "text-muted-foreground")}>
                    {daysUntil === 1 ? "明日" : daysUntil === 0 ? "今日" : `${daysUntil}日後`}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* 最終選考中（final）のハイライト */}
      {urgentCompanies.filter(c => c.status === "final").length > 0 && (
        <Card className="border-orange-300 dark:border-orange-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-orange-600">
              <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
              🔥 最終選考中 - 全力で対策を！
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {urgentCompanies.filter(c => c.status === "final").map((company) => (
              <Link key={company.id} href={`/companies/${company.id}`}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50 hover:border-orange-400 transition-colors group"
              >
                <span className="text-base">🎯</span>
                <span className="text-sm font-bold flex-1 truncate group-hover:text-primary transition-colors">{company.name}</span>
                <CompanyStatusBadge status={company.status as CompanyStatus} />
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 要アクション企業 */}
      {urgentCompanies.filter(c => c.status !== "final").length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-500" />
              選考中・インターン確定企業 ({urgentCompanies.filter(c => c.status !== "final").length}社)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {urgentCompanies.filter(c => c.status !== "final").map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors group"
              >
                <CompanyStatusBadge status={company.status as CompanyStatus} />
                <span className="text-sm font-medium flex-1 truncate group-hover:text-primary transition-colors">{company.name}</span>
                <PriorityStars priority={company.priority} size="sm" />
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TaskCard({ task, done, onComplete, urgency }: {
  task: TaskWithCompany
  done: boolean
  onComplete: (id: string, title: string) => void
  urgency: "overdue" | "today"
}) {
  return (
    <div className={cn(
      "flex items-start gap-3 p-2.5 rounded-lg border transition-all",
      done && "opacity-50",
      urgency === "overdue" && !done ? "border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800/50" : "border-muted"
    )}>
      <button
        onClick={() => !done && onComplete(task.id, task.title)}
        className={cn("shrink-0 mt-0.5 rounded-full border-2 h-4 w-4 flex items-center justify-center transition-colors",
          done ? "bg-emerald-500 border-emerald-500" : urgency === "overdue" ? "border-red-400 hover:border-red-500" : "border-zinc-300 hover:border-blue-400"
        )}
      >
        {done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", done && "line-through text-muted-foreground")}>{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.company && (
            <Link href={`/companies/${task.company.id}`} className="text-xs text-muted-foreground hover:text-primary hover:underline transition-colors">
              {task.company.name}
            </Link>
          )}
          {task.dueAt && (
            <span className={cn("text-xs", urgency === "overdue" ? "text-red-500 font-medium" : "text-amber-600")}>
              {urgency === "overdue" ? `🔴 ${formatDate(task.dueAt)} 超過` : `📅 今日中`}
            </span>
          )}
          <PriorityStars priority={task.priority} size="sm" />
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-2">{task.description}</p>
        )}
      </div>
      {!done && task.company && (
        <Link
          href={`/companies/${task.company.id}`}
          className="shrink-0 text-[10px] text-muted-foreground hover:text-primary border rounded px-1.5 py-0.5 hover:border-primary/30 transition-colors"
        >
          詳細→
        </Link>
      )}
    </div>
  )
}
