"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Plus, CheckSquare, Circle, Clock, AlertCircle, Trash2, CalendarCheck, CalendarDays, Download, ChevronDown, LayoutList, Columns3, Timer } from "lucide-react"
import { format, addDays, startOfWeek, nextMonday } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { TaskFormModal } from "./task-form-modal"
import { PomodoroTimer } from "./pomodoro-timer"
import { PriorityStars } from "@/components/common/priority-stars"
import { formatDate, isToday, isPast } from "@/lib/utils/date"
import { TASK_STATUSES } from "@/lib/constants"
import type { Task } from "@/types"
import { cn } from "@/lib/utils"

type TaskWithCompany = Task & { company: { id: string; name: string } | null }
type CompanyOption = { id: string; name: string }

interface TasksPageClientProps {
  initialTasks: TaskWithCompany[]
  companies: CompanyOption[]
}

const STATUS_ICONS = {
  todo: Circle,
  doing: Clock,
  done: CheckSquare,
}

export function TasksPageClient({ initialTasks, companies }: TasksPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [showCreate, setShowCreate] = useState(false)
  const [todayDue, setTodayDue] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>(["done"])
  const [editingTask, setEditingTask] = useState<TaskWithCompany | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkCompleting, setBulkCompleting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState(searchParams.get("q") ?? "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all")
  const [companyFilter, setCompanyFilter] = useState(searchParams.get("company") ?? "all")
  const [sort, setSort] = useState<"priority" | "dueAt" | "created" | "company">((searchParams.get("sort") as "priority" | "dueAt" | "created" | "company") ?? "priority")
  const [todayOnlyFilter, setTodayOnlyFilter] = useState(searchParams.get("today") === "1")
  const [viewMode, setViewMode] = useState<"list" | "kanban">(() => {
    if (typeof window !== "undefined") return (localStorage.getItem("tasks-view-mode") as "list" | "kanban") ?? "list"
    return "list"
  })
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [pomodoroTask, setPomodoroTask] = useState<TaskWithCompany | null>(null)
  const [showPomodoro, setShowPomodoro] = useState(false)
  const [groupBy, setGroupBy] = useState<"status" | "deadline">(() => {
    if (typeof window !== "undefined") return (localStorage.getItem("tasks-group-by") as "status" | "deadline") ?? "deadline"
    return "deadline"
  })

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const next = prev === "list" ? "kanban" : "list"
      localStorage.setItem("tasks-view-mode", next)
      return next
    })
  }, [])

  const updateTaskUrl = (params: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== "all" && v !== "" && v !== "priority") p.set(k, v)
      else p.delete(k)
    })
    router.replace(`/tasks?${p.toString()}`, { scroll: false })
  }

  // URL から ?new=1 を検知して自動モーダル
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowCreate(true)
      const p = new URLSearchParams(searchParams.toString())
      p.delete("new")
      router.replace(`/tasks${p.toString() ? "?" + p.toString() : ""}`, { scroll: false })
    }
  }, [searchParams, router])

  const todayCount = useMemo(() => tasks.filter((t) => t.status !== "done" && t.dueAt && isToday(t.dueAt)).length, [tasks])

  const filtered = useMemo(() => {
    const f = tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false
      if (companyFilter !== "all" && (t.companyId ?? "none") !== companyFilter) return false
      if (todayOnlyFilter) {
        if (!t.dueAt || !isToday(t.dueAt)) return false
      }
      if (search) {
        const q = search.toLowerCase()
        return t.title.toLowerCase().includes(q) || (t.company?.name ?? "").toLowerCase().includes(q)
      }
      return true
    })
    if (sort === "dueAt") return [...f].sort((a, b) => {
      if (!a.dueAt && !b.dueAt) return 0
      if (!a.dueAt) return 1
      if (!b.dueAt) return -1
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    })
    if (sort === "priority") return [...f].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    if (sort === "company") return [...f].sort((a, b) => (a.company?.name ?? "").localeCompare(b.company?.name ?? "", "ja"))
    return f // created: server order
  }, [tasks, search, statusFilter, companyFilter, sort])

  const grouped = useMemo(() => {
    if (groupBy === "deadline") {
      const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
      const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const getGroup = (task: TaskWithCompany): string => {
        if (task.status === "done") return "done"
        if (!task.dueAt) return "noDue"
        const due = new Date(task.dueAt)
        if (due < new Date()) return "overdue"
        if (due <= todayEnd) return "today"
        if (due <= weekEnd) return "thisWeek"
        return "later"
      }
      const groups: Record<string, TaskWithCompany[]> = { overdue: [], today: [], thisWeek: [], later: [], noDue: [], done: [] }
      for (const task of filtered) { groups[getGroup(task)]?.push(task) }
      return groups
    }
    const groups: Record<string, TaskWithCompany[]> = { todo: [], doing: [], done: [] }
    for (const task of filtered) { groups[task.status]?.push(task) }
    return groups
  }, [filtered, groupBy])

  const handleStatusToggle = async (task: TaskWithCompany) => {
    const nextStatus = task.status === "todo" ? "doing" : task.status === "doing" ? "done" : "todo"
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t))
      if (nextStatus === "done") {
        toast.success(`✅ 完了: ${task.title}`, {
          action: {
            label: "元に戻す",
            onClick: async () => {
              const undoRes = await fetch(`/api/tasks/${task.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: task.status }),
              })
              if (undoRes.ok) {
                const restored = await undoRes.json()
                setTasks((prev) => prev.map((t) => t.id === task.id ? restored : t))
              }
            },
          },
          duration: 5000,
        })
        // 全タスク完了チェック
        const updatedTasks = tasks.map((t) => t.id === task.id ? { ...t, status: "done" } : t)
        const remaining = updatedTasks.filter((t) => t.status !== "done" && t.dueAt && isToday(t.dueAt)).length
        if (remaining === 0 && updatedTasks.some((t) => t.dueAt && isToday(t.dueAt))) {
          setTimeout(() => toast.success("🎉 今日のタスクをすべて完了しました！お疲れ様！", { duration: 5000 }), 500)
        }
      } else if (nextStatus === "doing") {
        toast(`⏳ 進行中: ${task.title}`, { duration: 2000 })
      }
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    const res = await fetch(`/api/tasks/${deletingId}`, { method: "DELETE" })
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== deletingId))
      toast.success("タスクを削除しました")
    }
    setDeletingId(null)
  }

  const handleBulkComplete = async () => {
    if (selectedIds.size === 0) return
    setBulkCompleting(true)
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "done" }),
        })
      )
    )
    setTasks((prev) => prev.map((t) => selectedIds.has(t.id) ? { ...t, status: "done" } : t))
    toast.success(`${selectedIds.size}件のタスクを完了にしました`)
    setSelectedIds(new Set())
    setBulkCompleting(false)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDuplicateTask = async (task: TaskWithCompany) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${task.title} (コピー)`,
        description: task.description,
        status: "todo",
        priority: task.priority,
        dueAt: task.dueAt ? format(new Date(task.dueAt), "yyyy-MM-dd") : undefined,
        tags: task.tags,
        companyId: task.companyId,
      }),
    })
    if (res.ok) {
      const newTask = await res.json()
      setTasks((prev) => [...prev, newTask])
      toast.success("タスクを複製しました")
    }
  }

  const handleExportCSV = () => {
    const STATUS_MAP: Record<string, string> = { todo: "未着手", doing: "進行中", done: "完了" }
    const headers = ["タイトル", "ステータス", "優先度", "期限", "企業", "説明", "タグ"]
    const rows = filtered.map((t) => [
      t.title,
      STATUS_MAP[t.status] ?? t.status,
      t.priority?.toString() ?? "",
      t.dueAt ? formatDate(t.dueAt) : "",
      t.company?.name ?? "",
      t.description ?? "",
      t.tags ?? "",
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `tasks-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${filtered.length}件をCSVでエクスポートしました`)
  }

  const handleQuickReschedule = async (taskId: string, dueAt: Date) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueAt: format(dueAt, "yyyy-MM-dd") }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t))
      toast(`期限を${format(dueAt, "M/d")}に変更しました`, { duration: 2000 })
    }
  }

  const TASK_TEMPLATES = [
    {
      label: "面接準備セット",
      tasks: [
        { title: "企業研究・業界分析", priority: 5 },
        { title: "自己PR・志望動機の整理", priority: 5 },
        { title: "想定質問の回答準備", priority: 4 },
        { title: "逆質問リストの作成", priority: 4 },
        { title: "当日の服装・持ち物確認", priority: 3 },
      ],
    },
    {
      label: "ES提出チェック",
      tasks: [
        { title: "ES全体を読み返す", priority: 5 },
        { title: "誤字脱字・表現チェック", priority: 5 },
        { title: "文字数制限の確認", priority: 4 },
        { title: "ES提出・送信", priority: 5 },
      ],
    },
    {
      label: "OB訪問準備セット",
      tasks: [
        { title: "事前質問リスト作成（10問以上）", priority: 4 },
        { title: "OB訪問の日程調整", priority: 5 },
        { title: "OB訪問後のお礼メール", priority: 4 },
      ],
    },
  ]

  const handleBatchCreateTasks = async (templateIdx: number) => {
    const template = TASK_TEMPLATES[templateIdx]
    if (!template) return
    const today = new Date().toISOString().split("T")[0]
    const promises = template.tasks.map((t) =>
      fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t.title, priority: t.priority, status: "todo", dueAt: today }),
      }).then((r) => r.ok ? r.json() : null)
    )
    const results = await Promise.all(promises)
    const created = results.filter(Boolean)
    setTasks((prev) => [...prev, ...created])
    toast.success(`「${template.label}」${created.length}件のタスクを追加しました`)
  }

  const handleKanbanDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId)
  }

  const handleKanbanDrop = async (e: React.DragEvent, newStatus: "todo" | "doing" | "done") => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData("taskId")
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) { setDragOverCol(null); return }
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t))
    setDragOverCol(null)
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: task.status } : t))
      toast.error("ステータス更新に失敗しました")
    } else {
      const LABELS: Record<string, string> = { todo: "未着手", doing: "進行中", done: "完了" }
      toast.success(`「${task.title}」を${LABELS[newStatus]}に移動しました`)
    }
  }

  const todoCount = tasks.filter((t) => t.status !== "done").length
  const overdueCount = tasks.filter((t) => t.status !== "done" && t.dueAt && isPast(t.dueAt) && !isToday(t.dueAt)).length
  const todayDoneCount = tasks.filter((t) => {
    if (t.status !== "done") return false
    const updatedAt = new Date(t.updatedAt)
    const today = new Date()
    return updatedAt.toDateString() === today.toDateString()
  }).length

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">タスク</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">
              {todoCount}件 未完了
              {overdueCount > 0 && (
                <span className="ml-2 text-red-500 font-medium">
                  / {overdueCount}件 期限超過
                </span>
              )}
              {todayDoneCount > 0 && (
                <span className="ml-2 text-emerald-600 font-medium">
                  / 今日 {todayDoneCount}件完了 ✓
                </span>
              )}
            </p>
            {tasks.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="bg-muted rounded-full h-1.5 w-24">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${(tasks.filter((t) => t.status === "done").length / tasks.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {tasks.filter((t) => t.status === "done").length}/{tasks.length}
                  {tasks.length > 0 && ` (${Math.round(tasks.filter((t) => t.status === "done").length / tasks.length * 100)}%)`}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center border rounded-md overflow-hidden">
            <button
              onClick={toggleViewMode}
              className={cn("px-2.5 py-1.5 transition-colors", viewMode === "list" ? "bg-muted text-foreground" : "hover:bg-muted/50 text-muted-foreground")}
              title="リスト表示"
            >
              <LayoutList className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={toggleViewMode}
              className={cn("px-2.5 py-1.5 transition-colors", viewMode === "kanban" ? "bg-muted text-foreground" : "hover:bg-muted/50 text-muted-foreground")}
              title="カンバン表示"
            >
              <Columns3 className="h-3.5 w-3.5" />
            </button>
          </div>
          {viewMode === "list" && (
            <button
              onClick={() => setGroupBy(prev => {
                const next = prev === "status" ? "deadline" : "status"
                localStorage.setItem("tasks-group-by", next)
                return next
              })}
              className={cn("hidden md:flex items-center gap-1 text-xs h-8 px-2 border rounded-md transition-colors",
                groupBy === "deadline" ? "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" : "text-muted-foreground hover:text-foreground"
              )}
              title={groupBy === "status" ? "期限別グループに切替" : "ステータス別グループに切替"}
            >
              {groupBy === "deadline" ? "📅 期限別" : "📋 ステータス別"}
            </button>
          )}
          {filtered.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleExportCSV} className="gap-1.5 text-muted-foreground hidden md:flex">
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="hidden md:inline-flex items-center gap-1 h-8 px-3 text-sm font-medium border rounded-md bg-background hover:bg-muted transition-colors">
              テンプレ
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {TASK_TEMPLATES.map((t, i) => (
                <DropdownMenuItem key={i} onClick={() => handleBatchCreateTasks(i)}>
                  {t.label} ({t.tasks.length}件)
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline" size="sm"
            onClick={() => setShowPomodoro((p) => !p)}
            className={cn("gap-1.5 hidden md:flex", showPomodoro && "bg-red-50 border-red-300 text-red-600 dark:bg-red-950/30")}
            title="ポモドーロタイマー"
          >
            <Timer className="h-3.5 w-3.5" />
            🍅
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setTodayDue(true); setShowCreate(true) }} className="gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5" />
            今日
          </Button>
          <Button size="sm" onClick={() => { setTodayDue(false); setShowCreate(true) }}>
            <Plus className="h-3.5 w-3.5" />
            タスクを追加
          </Button>
        </div>
      </div>

      {/* 一括操作バー */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-medium">{selectedIds.size}件選択中</span>
          <Button
            size="sm"
            variant="outline"
            disabled={bulkCompleting}
            onClick={handleBulkComplete}
            className="gap-1.5 h-7 text-xs"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            {bulkCompleting ? "処理中..." : "一括完了"}
          </Button>
          <button
            onClick={async () => {
              const ids = Array.from(selectedIds)
              await Promise.all(ids.map((id) => fetch(`/api/tasks/${id}`, { method: "DELETE" })))
              setTasks((prev) => prev.filter((t) => !selectedIds.has(t.id)))
              toast.success(`${ids.length}件のタスクを削除しました`)
              setSelectedIds(new Set())
            }}
            className="text-xs text-destructive hover:text-destructive/80 transition-colors"
          >
            一括削除
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
          >
            選択解除
          </button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="タスク・企業名で検索..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); updateTaskUrl({ q: e.target.value }) }}
          className="h-8 w-48 text-sm"
        />
        <Select value={statusFilter} onValueChange={(v: string | null) => { setStatusFilter(v ?? "all"); updateTaskUrl({ status: v ?? "all" }) }}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべてのステータス</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {companies.length > 0 && (
          <Select value={companyFilter} onValueChange={(v: string | null) => { setCompanyFilter(v ?? "all"); updateTaskUrl({ company: v ?? "all" }) }}>
            <SelectTrigger className="h-8 w-40 text-sm">
              <SelectValue placeholder="企業" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての企業</SelectItem>
              <SelectItem value="none">企業なし</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={sort} onValueChange={(v: string | null) => { setSort((v ?? "priority") as typeof sort); updateTaskUrl({ sort: v ?? "priority" }) }}>
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">優先度順</SelectItem>
            <SelectItem value="dueAt">期限順</SelectItem>
            <SelectItem value="company">企業順</SelectItem>
            <SelectItem value="created">追加順</SelectItem>
          </SelectContent>
        </Select>
        <button
          onClick={() => {
            const next = !todayOnlyFilter
            setTodayOnlyFilter(next)
            updateTaskUrl({ today: next ? "1" : "" })
          }}
          className={cn(
            "h-8 px-3 rounded-md text-xs border transition-colors flex items-center gap-1.5",
            todayOnlyFilter
              ? "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-400"
              : "border-input text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <CalendarCheck className="h-3 w-3" />
          今日期限
          {todayCount > 0 && (
            <span className={cn(
              "rounded-full px-1 py-0.5 text-[10px] font-medium",
              todayOnlyFilter ? "bg-amber-200 dark:bg-amber-800" : "bg-muted"
            )}>
              {todayCount}
            </span>
          )}
        </button>
        {(search || statusFilter !== "all" || companyFilter !== "all" || sort !== "priority" || todayOnlyFilter) && (
          <button
            onClick={() => { setSearch(""); setStatusFilter("all"); setCompanyFilter("all"); setSort("priority"); setTodayOnlyFilter(false); router.replace("/tasks", { scroll: false }) }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
          >
            ✕ リセット
          </button>
        )}
      </div>

      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-h-[60vh]">
          {(["todo", "doing", "done"] as const).map((status) => {
            const items = grouped[status] ?? []
            const statusConfig = TASK_STATUSES.find((s) => s.value === status)!
            const Icon = STATUS_ICONS[status]
            const COLUMN_COLORS: Record<string, string> = {
              todo: "border-zinc-200 dark:border-zinc-700",
              doing: "border-blue-200 dark:border-blue-800",
              done: "border-emerald-200 dark:border-emerald-800",
            }
            const HEADER_COLORS: Record<string, string> = {
              todo: "bg-zinc-50 dark:bg-zinc-800/50",
              doing: "bg-blue-50 dark:bg-blue-950/30",
              done: "bg-emerald-50 dark:bg-emerald-950/30",
            }
            return (
              <div
                key={status}
                className={cn(
                  "rounded-xl border-2 flex flex-col transition-colors",
                  COLUMN_COLORS[status],
                  dragOverCol === status && "border-dashed ring-2 ring-inset ring-current opacity-80"
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(status) }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => handleKanbanDrop(e, status)}
              >
                <div className={cn("flex items-center gap-2 px-3 py-2.5 rounded-t-lg", HEADER_COLORS[status])}>
                  <Icon className={cn("h-4 w-4", statusConfig.color)} />
                  <span className={cn("text-sm font-semibold", statusConfig.color)}>{statusConfig.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground bg-background/60 rounded-full px-2 py-0.5">{items.length}</span>
                </div>
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {items.map((task) => {
                    const isOverdue = task.status !== "done" && task.dueAt && isPast(task.dueAt) && !isToday(task.dueAt)
                    const isDueToday = task.dueAt && isToday(task.dueAt)
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleKanbanDragStart(e, task.id)}
                        className={cn(
                          "group p-2.5 rounded-lg border bg-background shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all select-none",
                          isOverdue && "border-red-300 bg-red-50/50 dark:bg-red-950/20",
                          isDueToday && !isOverdue && "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20",
                          task.status === "done" && "opacity-50",
                        )}
                        onClick={() => setEditingTask(task)}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className={cn("text-xs font-medium leading-snug flex-1", task.status === "done" && "line-through text-muted-foreground")}>
                            {task.title}
                          </p>
                          {task.status !== "done" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setPomodoroTask(task); setShowPomodoro(true) }}
                              className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400 hover:text-red-600 transition-opacity shrink-0"
                              title="ポモドーロ開始"
                            >
                              🍅
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {task.company && (
                            <span className="text-[10px] bg-muted/70 px-1.5 py-0.5 rounded-full text-muted-foreground truncate max-w-[80px]">
                              {task.company.name}
                            </span>
                          )}
                          {task.dueAt && (
                            <span className={cn(
                              "text-[10px] flex items-center gap-0.5",
                              isOverdue ? "text-red-500 font-medium" : isDueToday ? "text-amber-600 font-medium" : "text-muted-foreground"
                            )}>
                              {isOverdue && <AlertCircle className="h-2.5 w-2.5" />}
                              {formatDate(task.dueAt)}
                            </span>
                          )}
                          {task.priority >= 4 && (
                            <span className={cn("text-[10px] font-bold", task.priority >= 5 ? "text-red-500" : "text-amber-500")}>
                              {"★".repeat(task.priority - 3)}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {items.length === 0 && (
                    <div className="flex items-center justify-center h-16 text-xs text-muted-foreground/50 border-2 border-dashed rounded-lg">
                      ここにドロップ
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-b-lg transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  追加
                </button>
              </div>
            )
          })}
        </div>
      )}

      {viewMode === "list" && (filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="タスクがありません"
          description="「タスクを追加」からやることリストを作りましょう"
          action={{ label: "タスクを追加", onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="space-y-6">
          {(groupBy === "deadline"
            ? (["overdue", "today", "thisWeek", "later", "noDue", "done"] as const)
            : (["todo", "doing", "done"] as const)
          ).map((status) => {
            const items = grouped[status] ?? []
            if (items.length === 0) return null
            const DEADLINE_LABELS: Record<string, { label: string; color: string }> = {
              overdue: { label: "🔴 期限超過", color: "text-red-500" },
              today: { label: "📅 今日中", color: "text-amber-600" },
              thisWeek: { label: "📆 今週中", color: "text-blue-500" },
              later: { label: "📋 来週以降", color: "text-muted-foreground" },
              noDue: { label: "⬜ 期限なし", color: "text-muted-foreground" },
              done: { label: "✅ 完了", color: "text-emerald-500" },
            }
            const isDeadlineGroup = groupBy === "deadline"
            const statusConfig = isDeadlineGroup ? null : TASK_STATUSES.find((s) => s.value === status)
            const Icon = !isDeadlineGroup ? STATUS_ICONS[status as "todo" | "doing" | "done"] : CheckSquare

            return (
              <div key={status}>
                <button
                  className="flex items-center gap-2 mb-2 w-full text-left group"
                  onClick={() => {
                    const collapsed = collapsedGroups.includes(status)
                    setCollapsedGroups(collapsed ? collapsedGroups.filter((s) => s !== status) : [...collapsedGroups, status])
                  }}
                >
                  <Icon className={cn("h-4 w-4", isDeadlineGroup ? DEADLINE_LABELS[status]?.color : statusConfig?.color)} />
                  <span className={cn("text-sm font-medium", isDeadlineGroup ? DEADLINE_LABELS[status]?.color : statusConfig?.color)}>
                    {isDeadlineGroup ? DEADLINE_LABELS[status]?.label : statusConfig?.label}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                    {items.length}
                  </span>
                  <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 ml-auto">
                    {collapsedGroups.includes(status) ? "▶" : "▼"}
                  </span>
                </button>

                {!collapsedGroups.includes(status) && <div className="space-y-1.5">
                  {items.map((task) => {
                    const isOverdue = task.status !== "done" && task.dueAt && isPast(task.dueAt) && !isToday(task.dueAt)
                    const isDueToday = task.dueAt && isToday(task.dueAt)

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "group flex items-start gap-3 p-3 rounded-xl border transition-colors hover:bg-muted/30",
                          isOverdue && "border-red-200 bg-red-50/50 dark:border-red-800/30 dark:bg-red-950/20",
                          isDueToday && !isOverdue && "border-amber-200 bg-amber-50/50 dark:border-amber-800/30",
                          task.status === "done" && "opacity-60",
                          selectedIds.has(task.id) && "bg-primary/5 border-primary/30",
                          !isOverdue && !isDueToday && task.status !== "done" && task.priority >= 5 && "border-l-4 border-l-red-400",
                          !isOverdue && !isDueToday && task.status !== "done" && task.priority === 4 && "border-l-4 border-l-amber-400",
                          !isOverdue && !isDueToday && task.status !== "done" && task.priority === 3 && "border-l-2 border-l-muted-foreground/30",
                        )}
                      >
                        {/* 選択チェックボックス */}
                        {task.status !== "done" && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(task.id)}
                            onChange={() => toggleSelect(task.id)}
                            className="shrink-0 mt-1 h-3.5 w-3.5 rounded cursor-pointer accent-primary opacity-0 group-hover:opacity-100 focus:opacity-100"
                            style={selectedIds.has(task.id) ? { opacity: 1 } : undefined}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`${task.title}を選択`}
                          />
                        )}
                        {task.status === "done" && <div className="w-3.5 shrink-0" />}
                        {/* ステータス切替ボタン */}
                        <button
                          onClick={() => handleStatusToggle(task)}
                          className="shrink-0 mt-0.5"
                          aria-label="ステータス切替"
                        >
                          {task.status === "done" ? (
                            <CheckSquare className="h-4 w-4 text-emerald-500" />
                          ) : task.status === "doing" ? (
                            <Clock className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-zinc-400 hover:text-blue-400 transition-colors" />
                          )}
                        </button>

                        {/* コンテンツ */}
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => setEditingTask(task)}
                        >
                          <p className={cn("text-sm font-medium", task.status === "done" && "line-through text-muted-foreground")}>
                            {task.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {task.company && (
                              <span className="text-xs text-muted-foreground">{task.company.name}</span>
                            )}
                            {task.dueAt && (
                              <span className={cn(
                                "text-xs flex items-center gap-0.5",
                                isOverdue ? "text-red-500 font-medium" : isDueToday ? "text-amber-600 font-medium" : "text-muted-foreground"
                              )}>
                                {isOverdue && <AlertCircle className="h-3 w-3" />}
                                {formatDate(task.dueAt)}
                              </span>
                            )}
                            <PriorityStars priority={task.priority} size="sm" />
                          </div>
                          {task.description && (() => {
                            const checkboxItems = task.description.split("\n").filter(l => l.match(/^- \[[ x]\] /))
                            if (checkboxItems.length > 0) {
                              const done = checkboxItems.filter(l => l.startsWith("- [x]")).length
                              return (
                                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                  <div className="bg-muted rounded-full h-1 w-12">
                                    <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${(done / checkboxItems.length) * 100}%` }} />
                                  </div>
                                  <span>{done}/{checkboxItems.length} 完了</span>
                                </div>
                              )
                            }
                            return <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                          })()}
                          {task.tags && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {task.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                                <button
                                  key={tag}
                                  onClick={(e) => { e.stopPropagation(); setSearch(tag); updateTaskUrl({ q: tag }) }}
                                  className="text-[10px] bg-muted/80 hover:bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground transition-colors"
                                >
                                  #{tag}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* クイック期限変更 */}
                        {task.status !== "done" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-muted text-muted-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <CalendarDays className="h-3 w-3" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              {task.status === "todo" && (
                                <DropdownMenuItem onClick={() => handleStatusToggle(task)}>
                                  ⏳ 進行中に変更
                                </DropdownMenuItem>
                              )}
                              {task.status === "doing" && (
                                <DropdownMenuItem onClick={() => handleStatusToggle(task)}>
                                  ✅ 完了にする
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleQuickReschedule(task.id, new Date())}>
                                📅 今日に設定
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickReschedule(task.id, addDays(new Date(), 1))}>
                                📅 明日に設定
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickReschedule(task.id, addDays(new Date(), 3))}>
                                📅 3日後
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickReschedule(task.id, nextMonday(new Date()))}>
                                📅 来週月曜
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateTask(task)}>
                                📋 複製
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setPomodoroTask(task); setShowPomodoro(true) }}>
                                🍅 ポモドーロ開始
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {/* 削除ボタン */}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeletingId(task.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-6 w-6"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}

                  {items.length === 0 && (
                    <p className="text-xs text-muted-foreground/50 pl-3 py-1">なし</p>
                  )}
                </div>}
              </div>
            )
          })}
        </div>
      ))}

      {(showCreate || editingTask) && (
        <TaskFormModal
          open={showCreate || !!editingTask}
          onOpenChange={(open) => {
            if (!open) { setShowCreate(false); setEditingTask(null); setTodayDue(false) }
          }}
          task={editingTask ?? undefined}
          companies={companies}
          initialDueAt={todayDue ? format(new Date(), "yyyy-MM-dd") : undefined}
          onSuccess={(result) => {
            if (editingTask) {
              setTasks((prev) => prev.map((t) => t.id === result.id ? result : t))
            } else {
              setTasks((prev) => [...prev, result])
            }
            setShowCreate(false)
            setEditingTask(null)
            setTodayDue(false)
          }}
        />
      )}

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="タスクを削除しますか？"
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleDelete}
      />

      {showPomodoro && (
        <PomodoroTimer
          taskTitle={pomodoroTask?.title}
          onClose={() => { setShowPomodoro(false); setPomodoroTask(null) }}
        />
      )}
    </div>
  )
}
