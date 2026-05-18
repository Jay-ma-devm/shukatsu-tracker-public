"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Plus, MessageSquare, Star, Pencil, Trash2, Download, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { CompanyStatusBadge } from "@/components/common/status-badge"
import type { CompanyStatus } from "@/types"
import { InterviewFormModal } from "./interview-form-modal"
import { InterviewRadarChart } from "./interview-radar-chart"
import { InterviewPracticeModal } from "./interview-practice-modal"
import { INTERVIEW_TYPES } from "@/lib/constants"
import { formatDate } from "@/lib/utils/date"
import type { InterviewLog } from "@/types"
import { cn } from "@/lib/utils"

type LogWithData = InterviewLog & {
  company: { id: string; name: string; status?: string }
  stage: { id: string; name: string } | null
}
type CompanyOption = { id: string; name: string }

interface InterviewsPageClientProps {
  initialLogs: LogWithData[]
  companies: CompanyOption[]
}

const OUTCOME_COLORS = {
  passed: "text-emerald-600 bg-emerald-100",
  failed: "text-red-500 bg-red-100",
  pending: "text-amber-600 bg-amber-100",
}

export function InterviewsPageClient({ initialLogs, companies }: InterviewsPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [logs, setLogs] = useState(initialLogs)
  const [showCreate, setShowCreate] = useState(false)
  const [editingLog, setEditingLog] = useState<LogWithData | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showPractice, setShowPractice] = useState(false)
  const [companyFilter, setCompanyFilter] = useState(searchParams.get("company") ?? "all")
  const [outcomeFilter, setOutcomeFilter] = useState(searchParams.get("outcome") ?? "all")
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") ?? "all")
  const [ratingFilter, setRatingFilter] = useState(searchParams.get("rating") ?? "all")
  const [noRatingFilter, setNoRatingFilter] = useState(searchParams.get("noRating") === "1")
  const [sort, setSort] = useState<"newest" | "oldest" | "rating" | "company">((searchParams.get("sort") as "newest" | "oldest" | "rating" | "company") ?? "newest")
  const [search, setSearch] = useState(searchParams.get("q") ?? "")
  const [archiveSearch, setArchiveSearch] = useState("")

  const updateUrl = (params: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== "all" && v !== "" && v !== "newest") p.set(k, v)
      else p.delete(k)
    })
    router.replace(`/interviews?${p.toString()}`, { scroll: false })
  }

  const filteredLogs = (() => {
    const base = logs.filter((l) => {
      if (companyFilter !== "all" && l.company.id !== companyFilter) return false
      if (outcomeFilter !== "all" && (l.outcome ?? "pending") !== outcomeFilter) return false
      if (typeFilter !== "all" && l.type !== typeFilter) return false
      if (ratingFilter !== "all" && String(l.rating ?? "") !== ratingFilter) return false
      if (noRatingFilter && l.rating) return false
      if (search) {
        const q = search.toLowerCase()
        return l.company.name.toLowerCase().includes(q) ||
          (l.questions ?? "").toLowerCase().includes(q) ||
          (l.feedback ?? "").toLowerCase().includes(q) ||
          (l.interviewerName ?? "").toLowerCase().includes(q)
      }
      return true
    })
    if (sort === "oldest") return [...base].sort((a, b) => new Date(a.conductedAt).getTime() - new Date(b.conductedAt).getTime())
    if (sort === "rating") return [...base].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    if (sort === "company") return [...base].sort((a, b) => a.company.name.localeCompare(b.company.name, "ja"))
    return [...base].sort((a, b) => new Date(b.conductedAt).getTime() - new Date(a.conductedAt).getTime())
  })()

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowCreate(true)
      router.replace("/interviews", { scroll: false })
    }
  }, [searchParams, router])

  const handleUpdateOutcome = async (id: string, outcome: string | null) => {
    const log = logs.find(l => l.id === id)
    const res = await fetch(`/api/interviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome }),
    })
    if (res.ok) {
      const updated = await res.json()
      setLogs((prev) => prev.map((l) => l.id === id ? { ...l, outcome: updated.outcome } : l))
      // 通過の場合、ステージ更新を提案
      if (outcome === "passed" && log?.company.id) {
        toast.success("面接通過を記録しました 🎉", {
          description: "次の選考ステージを更新しましょう",
          action: {
            label: "ステージを更新",
            onClick: () => { window.location.href = `/companies/${log.company.id}?tab=stages` },
          },
          duration: 6000,
        })
      } else if (outcome === "failed" && log?.company.id) {
        toast("不通過を記録しました", {
          action: {
            label: "振り返りを記録",
            onClick: () => { window.location.href = `/companies/${log.company.id}?tab=interviews` },
          },
          duration: 5000,
        })
      }
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    const res = await fetch(`/api/interviews/${deletingId}`, { method: "DELETE" })
    if (res.ok) {
      setLogs((prev) => prev.filter((l) => l.id !== deletingId))
      toast.success("面接ログを削除しました")
    }
    setDeletingId(null)
  }

  const handleExportCSV = () => {
    const OUTCOME_MAP: Record<string, string> = { passed: "通過", failed: "不通過", pending: "結果待ち" }
    const headers = ["企業名", "面接種別", "実施日", "結果", "自己評価", "面接官", "役職", "時間(分)", "質問内容", "自分の回答", "振り返り", "次のステップ"]
    const rows = filteredLogs.map((l) => {
      const typeConfig = INTERVIEW_TYPES.find((t) => t.value === l.type)
      return [
        l.company.name,
        typeConfig?.label ?? l.type,
        new Date(l.conductedAt).toLocaleDateString("ja-JP"),
        OUTCOME_MAP[l.outcome ?? ""] ?? "",
        l.rating?.toString() ?? "",
        l.interviewerName ?? "",
        l.interviewerRole ?? "",
        l.duration?.toString() ?? "",
        l.questions ?? "",
        l.myAnswers ?? "",
        l.feedback ?? "",
        l.nextStepNotes ?? "",
      ]
    })
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `interviews-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${filteredLogs.length}件をCSVでエクスポートしました`)
  }

  const hasFilters = companyFilter !== "all" || outcomeFilter !== "all" || typeFilter !== "all" || ratingFilter !== "all" || noRatingFilter || search
  const statsBase = hasFilters ? filteredLogs : logs

  const stats = (() => {
    const rated = statsBase.filter((l) => l.rating)
    const withOutcome = statsBase.filter((l) => l.outcome)
    const passRate = withOutcome.length > 0
      ? Math.round(statsBase.filter((l) => l.outcome === "passed").length / withOutcome.length * 100)
      : null
    const avgRating = rated.length > 0
      ? (rated.reduce((s, l) => s + (l.rating ?? 0), 0) / rated.length).toFixed(1)
      : null
    const passed = statsBase.filter((l) => l.outcome === "passed").length
    const failed = statsBase.filter((l) => l.outcome === "failed").length
    const pending = statsBase.filter((l) => l.outcome === "pending" || !l.outcome).length
    const totalMinutes = statsBase.filter((l) => l.duration).reduce((s, l) => s + (l.duration ?? 0), 0)
    // 最近5件 vs 以前の通過率比較
    const recentWithOutcome = withOutcome.slice(0, 5)
    const olderWithOutcome = withOutcome.slice(5)
    const recentPassRate = recentWithOutcome.length > 0 ? recentWithOutcome.filter((l) => l.outcome === "passed").length / recentWithOutcome.length * 100 : null
    const olderPassRate = olderWithOutcome.length > 0 ? olderWithOutcome.filter((l) => l.outcome === "passed").length / olderWithOutcome.length * 100 : null
    const trend = recentPassRate !== null && olderPassRate !== null
      ? recentPassRate > olderPassRate ? "↑" : recentPassRate < olderPassRate ? "↓" : "→"
      : null
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const thisWeekCount = statsBase.filter((l) => new Date(l.conductedAt) >= sevenDaysAgo).length
    return { passRate, avgRating, passed, failed, pending, totalMinutes, trend, thisWeekCount }
  })()

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">面接ログ</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{logs.length}件</span>
            {stats.passed > 0 && <span className="text-emerald-600">通過 {stats.passed}</span>}
            {stats.failed > 0 && <span className="text-red-500">不通過 {stats.failed}</span>}
            {stats.passRate !== null && (
              <span className={stats.passRate >= 50 ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                通過率 {stats.passRate}%
                {stats.trend && (
                  <span className={`ml-0.5 ${stats.trend === "↑" ? "text-emerald-600" : stats.trend === "↓" ? "text-red-500" : "text-zinc-500"}`}>
                    {stats.trend}
                  </span>
                )}
              </span>
            )}
            {stats.avgRating && (
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                平均 {stats.avgRating}
              </span>
            )}
            {stats.totalMinutes > 0 && (
              <span>合計 {Math.round(stats.totalMinutes / 60)}時間{stats.totalMinutes % 60}分</span>
            )}
            {stats.thisWeekCount > 0 && (
              <span className="text-primary font-medium">今週 {stats.thisWeekCount}件</span>
            )}
            {stats.pending > 0 && (
              <span className="text-amber-600 font-medium">結果待ち {stats.pending}件</span>
            )}
          </div>
          {/* 結果待ち一覧 */}
          {logs.filter((l) => !l.outcome || l.outcome === "pending").length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {logs
                .filter((l) => !l.outcome || l.outcome === "pending")
                .sort((a, b) => new Date(a.conductedAt).getTime() - new Date(b.conductedAt).getTime())
                .slice(0, 5)
                .map((l) => {
                  const daysWaiting = Math.floor((Date.now() - new Date(l.conductedAt).getTime()) / (1000 * 60 * 60 * 24))
                  const isStale = daysWaiting >= 7
                  return (
                    <Link
                      key={l.id}
                      href={`/companies/${l.company.id}`}
                      className={`text-[10px] px-1.5 py-0.5 rounded-full hover:opacity-80 transition-opacity flex items-center gap-1 ${
                        isStale
                          ? "bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-700/50 text-red-700 dark:text-red-400"
                          : "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400"
                      }`}
                      title={`${daysWaiting}日待機中`}
                    >
                      {l.company.name}
                      <span className="opacity-70">{daysWaiting}日</span>
                      {isStale && <span>⚠</span>}
                    </Link>
                  )
                })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {filteredLogs.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleExportCSV} className="gap-1.5 text-muted-foreground">
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
          )}
          {logs.length >= 2 && (() => {
            const [aiCoach, setAiCoach] = useState<string | null>(null)
            const [loading, setLoading] = useState(false)
            const handleCoach = async () => {
              if (aiCoach) { setAiCoach(null); return }
              setLoading(true)
              try {
                const text = `面接ログサマリー:\n${logs.slice(0, 5).map((l) => `- ${l.company.name} ${l.type} 評価:${l.rating ?? "未"} 結果:${l.outcome ?? "未"}`).join("\n")}\n\n詳細:\n${logs.slice(0, 3).map((l) => `企業:${l.company.name}\n設問:${(l.questions ?? "").slice(0, 100)}\n回答:${(l.myAnswers ?? "").slice(0, 100)}\nFB:${l.feedback ?? "なし"}`).join("\n---\n")}`
                const res = await fetch("/api/ai/summarize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, type: "selection_analysis" }) })
                if (res.ok) { const d = await res.json(); setAiCoach(d.summary) }
              } finally { setLoading(false) }
            }
            return (
              <div>
                <Button variant="ghost" size="sm" onClick={handleCoach} disabled={loading} className="gap-1.5 text-emerald-600">
                  <Sparkles className="h-3.5 w-3.5" />
                  {loading ? "分析中..." : aiCoach ? "閉じる" : "AI診断"}
                </Button>
                {aiCoach && <div className="mt-2 text-xs bg-emerald-50/50 dark:bg-emerald-950/20 border rounded-xl p-3 whitespace-pre-wrap">{aiCoach}</div>}
              </div>
            )
          })()}
          {logs.some((l) => l.questions) && (
            <Button variant="outline" size="sm" onClick={() => setShowPractice(true)} className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              練習
            </Button>
          )}
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" />
            面接ログを追加
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          placeholder="企業・質問・フィードバックで検索..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); updateUrl({ q: e.target.value }) }}
          className="h-8 text-sm px-3 border rounded-lg w-56 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {companies.length > 0 && (
          <Select value={companyFilter} onValueChange={(v: string | null) => { const val = v ?? "all"; setCompanyFilter(val); updateUrl({ company: val }) }}>
            <SelectTrigger className="h-8 w-44 text-sm">
              <SelectValue placeholder="企業でフィルタ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての企業</SelectItem>
              {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={outcomeFilter} onValueChange={(v: string | null) => { const val = v ?? "all"; setOutcomeFilter(val); updateUrl({ outcome: val }) }}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="結果でフィルタ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての結果</SelectItem>
            <SelectItem value="passed">通過</SelectItem>
            <SelectItem value="failed">不通過</SelectItem>
            <SelectItem value="pending">結果待ち</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v: string | null) => { const val = v ?? "all"; setTypeFilter(val); updateUrl({ type: val }) }}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="種別" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての種別</SelectItem>
            {INTERVIEW_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v: string | null) => { const val = (v ?? "newest") as typeof sort; setSort(val); updateUrl({ sort: val }) }}>
          <SelectTrigger className="h-8 w-28 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">新しい順</SelectItem>
            <SelectItem value="oldest">古い順</SelectItem>
            <SelectItem value="rating">評価順</SelectItem>
            <SelectItem value="company">企業順</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ratingFilter} onValueChange={(v: string | null) => { const val = v ?? "all"; setRatingFilter(val); updateUrl({ rating: val }) }}>
          <SelectTrigger className="h-8 w-24 text-sm">
            <SelectValue placeholder="評価" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">評価: 全</SelectItem>
            {[5,4,3,2,1].map((r) => (
              <SelectItem key={r} value={String(r)}>{"★".repeat(r)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={() => { setNoRatingFilter(!noRatingFilter); updateUrl({ noRating: !noRatingFilter ? "1" : "" }) }}
          className={`text-xs h-8 px-2 rounded-md border transition-colors flex items-center gap-1 ${noRatingFilter ? "bg-amber-50 border-amber-300 text-amber-700" : "text-muted-foreground hover:text-foreground"}`}
        >
          ★ 未評価のみ
        </button>
        {(search || companyFilter !== "all" || outcomeFilter !== "all" || typeFilter !== "all" || ratingFilter !== "all" || sort !== "newest" || noRatingFilter) && (
          <button
            onClick={() => { setSearch(""); setCompanyFilter("all"); setOutcomeFilter("all"); setTypeFilter("all"); setRatingFilter("all"); setSort("newest"); setNoRatingFilter(false); router.replace("/interviews", { scroll: false }) }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕ リセット
          </button>
        )}
      </div>

      {/* 結果待ちバナー */}
      {logs.filter((l) => !l.outcome || l.outcome === "pending").length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl">
          <span className="text-amber-500">⏳</span>
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            結果待ち {logs.filter((l) => !l.outcome || l.outcome === "pending").length}件 —
            {logs.filter((l) => !l.outcome || l.outcome === "pending").map((l) => l.company.name).slice(0, 3).join("・")}
            {logs.filter((l) => !l.outcome || l.outcome === "pending").length > 3 ? "..." : ""}
          </span>
          <button
            onClick={() => { setOutcomeFilter("pending"); updateUrl({ outcome: "pending" }) }}
            className="ml-auto text-xs text-amber-700 dark:text-amber-400 underline hover:no-underline"
          >
            表示 →
          </button>
        </div>
      )}

      {logs.filter((l) => l.rating).length >= 2 && (
        <div className="border rounded-xl p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">面接自己評価チャート</p>
          <InterviewRadarChart logs={logs} />
        </div>
      )}

      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="面接ログがありません"
          description="面接を終えたら振り返りを記録しましょう"
          action={{ label: "面接ログを追加", onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const typeConfig = INTERVIEW_TYPES.find((t) => t.value === log.type)
            const isExpanded = expandedId === log.id

            return (
              <Card key={log.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div
                    className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/companies/${log.company.id}?tab=interviews`}
                          className="font-semibold hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          title={`${log.company.name}の面接タブへ`}
                        >
                          {log.company.name}
                        </Link>
                        {log.company.status && (
                          <CompanyStatusBadge status={log.company.status as CompanyStatus} />
                        )}
                        <Badge variant="outline" className="text-xs">
                          {typeConfig?.label ?? log.type}
                        </Badge>
                        <Select
                          value={log.outcome ?? ""}
                          onValueChange={(v: string | null) => {
                            handleUpdateOutcome(log.id, v || null)
                          }}
                        >
                          <SelectTrigger className="h-5 w-auto border-0 bg-transparent p-0 focus-visible:ring-0 hover:bg-muted rounded px-1" onClick={(e) => e.stopPropagation()}>
                            {log.outcome ? (
                              <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium cursor-pointer",
                                OUTCOME_COLORS[log.outcome as keyof typeof OUTCOME_COLORS] ?? "text-zinc-500"
                              )}>
                                {log.outcome === "passed" ? "通過" : log.outcome === "failed" ? "不通過" : "結果待ち"}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground px-1.5 py-0.5">結果を設定</span>
                            )}
                          </SelectTrigger>
                          <SelectContent onClick={(e) => e.stopPropagation()}>
                            <SelectItem value="">未設定</SelectItem>
                            <SelectItem value="passed">通過</SelectItem>
                            <SelectItem value="failed">不通過</SelectItem>
                            <SelectItem value="pending">結果待ち</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{formatDate(log.conductedAt)}</span>
                        {log.duration && <span>{log.duration}分</span>}
                        {log.interviewerName && (
                          <span>
                            面接官: {log.interviewerName}
                            {log.interviewerRole && <span className="text-muted-foreground/60"> ({log.interviewerRole})</span>}
                          </span>
                        )}
                        {log.rating && (
                          <span className="flex items-center gap-0.5 text-amber-500" title={["準備不足","改善必要","普通","良かった","完璧"][log.rating - 1]}>
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {log.rating}
                            <span className="text-[10px] text-muted-foreground hidden sm:inline">
                              {["準備不足","改善必要","普通","良かった","完璧"][log.rating - 1]}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon-sm" className="h-7 w-7" onClick={() => setEditingLog(log)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeletingId(log.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t pt-3">
                      {log.questions && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">質問内容</p>
                          <p className="text-sm whitespace-pre-wrap bg-muted/50 p-2 rounded-lg">{log.questions}</p>
                        </div>
                      )}
                      {log.myAnswers && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">自分の回答</p>
                          <p className="text-sm whitespace-pre-wrap bg-muted/50 p-2 rounded-lg">{log.myAnswers}</p>
                        </div>
                      )}
                      {log.feedback && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">振り返り・改善点</p>
                          <p className="text-sm whitespace-pre-wrap bg-muted/50 p-2 rounded-lg">{log.feedback}</p>
                        </div>
                      )}
                      {log.nextStepNotes && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">次のステップ</p>
                          <p className="text-sm whitespace-pre-wrap text-primary">{log.nextStepNotes}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link
                          href={`/companies/${log.company.id}`}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
                        >
                          企業詳細
                        </Link>
                        <Link
                          href={`/companies/${log.company.id}?tab=stages`}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
                        >
                          ステージを更新
                        </Link>
                        <Link
                          href={`/companies/${log.company.id}?tab=tasks`}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
                        >
                          準備タスクを確認
                        </Link>
                        <Link
                          href={`/companies/${log.company.id}?tab=es`}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
                        >
                          ESを確認
                        </Link>
                        <Link
                          href="/templates"
                          className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
                        >
                          お礼メールを送る
                        </Link>
                        <AiNextStepButton log={log} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 質問アーカイブ */}
      {logs.some((l) => l.questions) && (
        <details className="border rounded-xl p-4">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground select-none flex items-center gap-2">
            📚 質問アーカイブ
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
              {logs.filter((l) => l.questions).flatMap((l) => (l.questions ?? "").split("\n").filter((q) => q.trim())).length}件
            </span>
          </summary>
          <div className="mt-3 space-y-2">
            <input
              placeholder="質問を検索..."
              value={archiveSearch}
              onChange={(e) => setArchiveSearch(e.target.value)}
              className="h-7 w-full text-xs px-3 border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="space-y-1">
            {(() => {
              const questionMap = new Map<string, { companies: string[]; count: number }>()
              logs.filter((l) => l.questions).forEach((l) => {
                const companyName = l.company.name;
                (l.questions ?? "").split("\n")
                  .filter((q) => q.trim())
                  .map((q) => q.replace(/^[・\-\d]+\.?\s*/, "").trim())
                  .filter(Boolean)
                  .forEach((q) => {
                    if (!questionMap.has(q)) questionMap.set(q, { companies: [], count: 0 })
                    const entry = questionMap.get(q)!
                    entry.count++
                    if (!entry.companies.includes(companyName)) entry.companies.push(companyName)
                  })
              })
              const filtered = Array.from(questionMap.entries())
                .sort((a, b) => b[1].count - a[1].count)
                .filter(([q]) => !archiveSearch || q.toLowerCase().includes(archiveSearch.toLowerCase()))
                .slice(0, archiveSearch ? 50 : 25)
              if (filtered.length === 0) {
                return <p className="text-xs text-muted-foreground text-center py-2">「{archiveSearch}」に一致する質問がありません</p>
              }
              return filtered.map(([question, data]) => (
                  <div key={question} className="flex items-start gap-2 text-xs bg-muted/30 px-3 py-1.5 rounded-lg group">
                    <p className={cn("text-muted-foreground flex-1", archiveSearch && question.toLowerCase().includes(archiveSearch.toLowerCase()) && "text-foreground")}>
                      {archiveSearch ? question.split(new RegExp(`(${archiveSearch})`, "gi")).map((part, i) =>
                        part.toLowerCase() === archiveSearch.toLowerCase()
                          ? <mark key={i} className="bg-amber-200 dark:bg-amber-800 rounded px-0.5">{part}</mark>
                          : part
                      ) : question}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {data.count > 1 && (
                        <span className="bg-amber-100 text-amber-700 px-1 py-0.5 rounded text-[9px] font-bold">{data.count}回</span>
                      )}
                      <span className="text-[9px] text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity">
                        {data.companies.slice(0, 2).join("・")}
                      </span>
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-muted-foreground hover:text-foreground"
                        title="コピー"
                        onClick={() => { navigator.clipboard.writeText(question); toast("コピーしました", { duration: 1500 }) }}
                      >
                        📋
                      </button>
                    </div>
                  </div>
                ))
            })()}
            </div>
          </div>
        </details>
      )}

      {(showCreate || editingLog) && (
        <InterviewFormModal
          open={showCreate || !!editingLog}
          onOpenChange={(open) => {
            if (!open) { setShowCreate(false); setEditingLog(null) }
          }}
          log={editingLog ?? undefined}
          companies={companies}
          defaultCompanyId={!editingLog && companyFilter !== "all" ? companyFilter : undefined}
          onSuccess={(result) => {
            const r = result as LogWithData
            if (editingLog) {
              setLogs((prev) => prev.map((l) => l.id === r.id ? r : l))
            } else {
              setLogs((prev) => [r, ...prev])
              // 結果に応じたスマートトースト
              if (r.outcome === "passed") {
                toast.success("面接通過！おめでとう！🎉", {
                  description: "次の選考に備えましょう",
                  action: { label: "準備タスクを作成", onClick: () => window.location.href = `/tasks?new=1&company=${r.company.id}` },
                  duration: 6000,
                })
              } else if (r.outcome === "failed") {
                toast("不通過を記録しました", {
                  description: "振り返りをもとに次に活かしましょう",
                  action: { label: "ケース練習で強化", onClick: () => window.location.href = "/cases" },
                  duration: 6000,
                })
              }
            }
            setShowCreate(false)
            setEditingLog(null)
          }}
        />
      )}

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="面接ログを削除しますか？"
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleDelete}
      />
      <InterviewPracticeModal
        open={showPractice}
        onOpenChange={setShowPractice}
        questions={(() => {
          const seen = new Set<string>()
          const fromLogs = logs
            .filter((l) => l.questions)
            .flatMap((l) =>
              (l.questions ?? "").split("\n")
                .filter((q) => q.trim())
                .map((q) => ({
                  question: q.trim(),
                  companyName: l.company.name,
                  interviewType: l.type,
                }))
            )
            .filter((q) => {
              if (seen.has(q.question)) return false
              seen.add(q.question)
              return true
            })
          // コンサル定番質問を追加（ログがない場合のサンプルとして）
          const defaultQuestions = [
            "自己紹介をしてください",
            "志望動機を教えてください",
            "学生時代に最も力を入れて取り組んだことは何ですか？",
            "自分の強みと弱みを教えてください",
            "コンサルタントとしてどのように社会に貢献したいですか？",
            "チームでリーダーシップを発揮した経験を教えてください",
            "失敗した経験と、そこから何を学びましたか？",
            "なぜコンサルティング業界を志望しているのですか？",
            "5年後、10年後のキャリアビジョンを教えてください",
            "ケース面接の準備はどのようにしていますか？",
            // コンサル特有の質問
            "AIがコンサルタントの仕事に与える影響についてどう思いますか？",
            "コンサルタントに最も必要なスキルは何だと思いますか？",
            "どんなクライアント・業界の課題に関わりたいですか？",
            "コンサルの厳しい働き方についてどう考えていますか？",
            "あなたの強みをコンサルタントとしてどう活かせますか？",
          ].filter((q) => !seen.has(q))
          return [...fromLogs, ...defaultQuestions.map((q) => ({ question: q, companyName: "定番質問", interviewType: "standard" as const }))]
        })()}
      />
    </div>
  )
}

function AiNextStepButton({ log }: { log: LogWithData }) {
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)

  const handleGenerate = async () => {
    const text = [
      `企業: ${log.company.name}`,
      `面接種別: ${log.type}`,
      log.questions ? `質問: ${log.questions}` : "",
      log.myAnswers ? `自分の回答: ${log.myAnswers}` : "",
      log.feedback ? `振り返り: ${log.feedback}` : "",
      log.outcome ? `結果: ${log.outcome === "passed" ? "通過" : log.outcome === "failed" ? "不通過" : "結果待ち"}` : "",
    ].filter(Boolean).join("\n")

    setLoading(true)
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type: "interview_next_step" }),
      })
      if (res.ok) {
        const { summary } = await res.json()
        setSuggestion(summary)
      }
    } finally {
      setLoading(false)
    }
  }

  if (suggestion) {
    return (
      <div className="w-full mt-2 p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/50 rounded-xl space-y-1.5">
        <p className="text-xs font-medium text-violet-700 dark:text-violet-300">✨ AI 次ステップ提案</p>
        <p className="text-xs whitespace-pre-wrap text-violet-800 dark:text-violet-200">{suggestion}</p>
        <button onClick={() => setSuggestion(null)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">閉じる</button>
      </div>
    )
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="text-xs text-violet-600 hover:text-violet-800 transition-colors underline"
    >
      {loading ? "⏳" : "✨ AI 次ステップ提案"}
    </button>
  )
}
