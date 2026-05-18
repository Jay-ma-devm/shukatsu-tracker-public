"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Plus, FileText, Trash2, Clock, AlertCircle, Download } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { EntrySheetFormModal } from "./entry-sheet-form-modal"
import { ES_STATUSES } from "@/lib/constants"
import { formatDate, isPast, isToday } from "@/lib/utils/date"
import type { EntrySheet, EsQuestion } from "@/types"
import { cn } from "@/lib/utils"

type SheetWithData = EntrySheet & {
  company: { id: string; name: string }
  questions: EsQuestion[]
}
type CompanyOption = { id: string; name: string }

interface EntrySheetListClientProps {
  initialSheets: SheetWithData[]
  companies: CompanyOption[]
}

export function EntrySheetListClient({ initialSheets, companies }: EntrySheetListClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [sheets, setSheets] = useState(initialSheets)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all")
  const [companyFilter, setCompanyFilter] = useState(searchParams.get("company") ?? "all")
  const [sort, setSort] = useState<"newest" | "deadline" | "company">((searchParams.get("sort") as "newest" | "deadline" | "company") ?? "deadline")
  const [search, setSearch] = useState(searchParams.get("q") ?? "")

  const updateUrl = (params: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== "all" && v !== "" && v !== "newest") p.set(k, v)
      else p.delete(k)
    })
    router.replace(`/entry-sheets?${p.toString()}`, { scroll: false })
  }

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowCreate(true)
      router.replace("/entry-sheets", { scroll: false })
    }
  }, [searchParams, router])

  const filtered = useMemo(() => {
    const f = sheets.filter((s) => {
      if (statusFilter === "incomplete") {
        const answered = s.questions.filter((q) => q.answer && q.answer.length > 0).length
        if (answered >= s.questions.length) return false
        // Still apply other filters
      } else if (statusFilter !== "all" && s.status !== statusFilter) {
        return false
      }
      if (companyFilter !== "all" && s.company.id !== companyFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return s.title.toLowerCase().includes(q) || s.company.name.toLowerCase().includes(q) ||
          s.questions.some((sq) => sq.question?.toLowerCase().includes(q) || sq.answer?.toLowerCase().includes(q))
      }
      return true
    })
    if (sort === "deadline") return [...f].sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    })
    if (sort === "company") return [...f].sort((a, b) => a.company.name.localeCompare(b.company.name, "ja"))
    return f // newest: server order
  }, [sheets, statusFilter, sort])

  const nearDeadlineCount = sheets.filter((s) => {
    if (!s.deadline || ["submitted", "passed", "failed"].includes(s.status)) return false
    const days = (new Date(s.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return days <= 3 && days >= 0
  }).length

  const handleDelete = async () => {
    if (!deletingId) return
    const res = await fetch(`/api/entry-sheets/${deletingId}`, { method: "DELETE" })
    if (res.ok) {
      setSheets((prev) => prev.filter((s) => s.id !== deletingId))
      toast.success("ESを削除しました")
    }
    setDeletingId(null)
  }

  const handleStatusChange = async (id: string, status: string) => {
    const res = await fetch(`/api/entry-sheets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setSheets((prev) => prev.map((s) => s.id === id ? { ...s, ...updated } : s))
    }
  }

  const handleExportCSV = () => {
    const STATUS_LABELS: Record<string, string> = {
      writing: "執筆中", reviewing: "見直し中", submitted: "提出済", passed: "通過", failed: "不通過",
    }
    const headers = ["タイトル", "企業", "ステータス", "締切", "質問数", "回答済み数"]
    const rows = filtered.map((s) => {
      const answered = s.questions.filter((q) => q.answer && q.answer.length > 0).length
      return [
        s.title,
        s.company.name,
        STATUS_LABELS[s.status] ?? s.status,
        s.deadline ? formatDate(s.deadline) : "",
        String(s.questions.length),
        String(answered),
      ]
    })
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `entry-sheets-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${filtered.length}件をCSVでエクスポートしました`)
  }

  const urgentSheets = sheets.filter((s) => {
    if (!s.deadline || ["submitted", "passed", "failed"].includes(s.status)) return false
    const days = (new Date(s.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return days <= 3 && days >= -1
  })

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      {urgentSheets.length > 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-700 p-3">
          <p className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-1.5 mb-1.5">
            <AlertCircle className="h-4 w-4" />
            ES締め切り迫る！
          </p>
          <div className="flex flex-wrap gap-2">
            {urgentSheets.map((s) => {
              const daysLeft = Math.ceil((new Date(s.deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return (
                <Link
                  key={s.id}
                  href={`/entry-sheets/${s.id}`}
                  className="text-xs px-2.5 py-1 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg hover:opacity-80 transition-opacity flex items-center gap-1.5"
                >
                  <span className="font-medium">{s.company.name}</span>
                  <span className="opacity-70">{daysLeft <= 0 ? "今日！" : `${daysLeft}日後`}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">エントリーシート</h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{sheets.length}件</span>
            {(() => {
              const total = sheets.reduce((s, sh) => s + sh.questions.length, 0)
              const answered = sheets.reduce((s, sh) => s + sh.questions.filter((q) => q.answer && q.answer.length > 0).length, 0)
              if (total === 0) return null
              return <span className={answered === total ? "text-emerald-600 font-medium" : ""}>回答 {answered}/{total}問 ({Math.round(answered/total*100)}%)</span>
            })()}
            {nearDeadlineCount > 0 && (
              <span className="flex items-center gap-0.5 text-amber-600 font-medium">
                <AlertCircle className="h-3 w-3" />
                {nearDeadlineCount}件 締切迫る
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            placeholder="タイトル・企業で検索..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); updateUrl({ q: e.target.value }) }}
            className="h-8 text-sm px-3 border rounded-lg w-44 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {filtered.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleExportCSV} className="gap-1.5 text-muted-foreground">
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
          )}
          {companies.length > 0 && (
            <Select value={companyFilter} onValueChange={(v: string | null) => { const val = v ?? "all"; setCompanyFilter(val); updateUrl({ company: val }) }}>
              <SelectTrigger className="h-8 w-40 text-sm">
                <SelectValue placeholder="企業でフィルタ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての企業</SelectItem>
                {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={statusFilter} onValueChange={(v: string | null) => { const val = v ?? "all"; setStatusFilter(val); updateUrl({ status: val }) }}>
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="incomplete">未回答あり</SelectItem>
              {ES_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v: string | null) => { const val = (v ?? "newest") as typeof sort; setSort(val); updateUrl({ sort: val }) }}>
            <SelectTrigger className="h-8 w-28 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">新しい順</SelectItem>
              <SelectItem value="deadline">締切順</SelectItem>
              <SelectItem value="company">企業順</SelectItem>
            </SelectContent>
          </Select>
          {(search || statusFilter !== "all" || companyFilter !== "all" || sort !== "newest") && (
            <button
              onClick={() => { setSearch(""); setStatusFilter("all"); setCompanyFilter("all"); setSort("newest"); router.replace("/entry-sheets", { scroll: false }) }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕ リセット
            </button>
          )}
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" />
            ESを追加
          </Button>
        </div>
      </div>

      {sheets.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="ESがありません"
          description="「ESを追加」からエントリーシートを管理しましょう"
          action={{ label: "ESを追加", onClick: () => setShowCreate(true) }}
        />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">該当するESがありません</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((sheet) => {
            const statusConfig = ES_STATUSES.find((s) => s.value === sheet.status)
            const answerCount = sheet.questions.filter((q) => q.answer && q.answer.length > 0).length
            const totalCount = sheet.questions.length
            const isDeadlineOverdue = sheet.deadline && isPast(sheet.deadline) && !isToday(sheet.deadline) && !["submitted", "passed", "failed"].includes(sheet.status)
            const isDeadlineSoon = sheet.deadline && !isDeadlineOverdue && !["submitted", "passed", "failed"].includes(sheet.status) && (new Date(sheet.deadline).getTime() - Date.now()) <= 3 * 24 * 60 * 60 * 1000

            return (
              <div key={sheet.id} className={cn(
                "group flex items-start gap-3 p-4 border rounded-xl hover:shadow-sm transition-shadow bg-card",
                isDeadlineOverdue && "border-red-200 bg-red-50/30 dark:border-red-800/30",
                isDeadlineSoon && "border-amber-200 bg-amber-50/30 dark:border-amber-800/30"
              )}>
                <div className="flex-1 min-w-0">
                  <Link href={`/entry-sheets/${sheet.id}`} className="hover:text-primary transition-colors">
                    <p className="font-semibold">{sheet.title}</p>
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Link href={`/companies/${sheet.company.id}`} className="text-xs text-muted-foreground hover:text-primary">
                      {sheet.company.name}
                    </Link>
                    <Select value={sheet.status} onValueChange={(v: string | null) => v && handleStatusChange(sheet.id, v)}>
                      <SelectTrigger className="h-5 w-auto border-0 bg-transparent p-0 text-xs gap-0.5 focus-visible:ring-0 hover:bg-muted rounded px-1">
                        {statusConfig ? (
                          <Badge variant="outline" className={cn("text-xs cursor-pointer", statusConfig.color)}>
                            {statusConfig.label}
                          </Badge>
                        ) : <span className="text-xs text-muted-foreground">設定</span>}
                      </SelectTrigger>
                      <SelectContent>
                        {ES_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {totalCount > 0 && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="bg-muted rounded-full h-1.5 w-16">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${(answerCount / totalCount) * 100}%` }}
                          />
                        </div>
                        {answerCount}/{totalCount}問
                      </span>
                    )}
                    {sheet.deadline && (
                      <span className={cn(
                        "text-xs flex items-center gap-0.5",
                        isDeadlineOverdue ? "text-red-500 font-medium" : isDeadlineSoon ? "text-amber-600 font-medium" : "text-muted-foreground"
                      )}>
                        {(isDeadlineOverdue || isDeadlineSoon) && <AlertCircle className="h-3 w-3" />}
                        <Clock className={cn("h-3 w-3", (isDeadlineOverdue || isDeadlineSoon) && "hidden")} />
                        締切: {formatDate(sheet.deadline)}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeletingId(sheet.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-7 w-7"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <EntrySheetFormModal
          open={showCreate}
          onOpenChange={setShowCreate}
          companies={companies}
          onSuccess={(sheet) => {
            setSheets((prev) => [sheet as SheetWithData, ...prev])
            setShowCreate(false)
          }}
        />
      )}

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="ESを削除しますか？"
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
