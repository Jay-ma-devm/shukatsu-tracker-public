"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Kanban as KanbanIcon, Download, LayoutGrid, List, Star, ChevronDown, Layers } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CompanyTable } from "./company-table"
import { CompanyStatusBadge } from "@/components/common/status-badge"
import { PriorityStars } from "@/components/common/priority-stars"
import { CompanyFormModal } from "./company-form-modal"
import { COMPANY_STATUSES, INDUSTRIES } from "@/lib/constants"
import type { CompanyWithData } from "@/types/company"
import type { CompanyStatus } from "@/types"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/date"

interface CompaniesPageProps {
  initialCompanies: CompanyWithData[]
}

export function CompaniesPage({ initialCompanies }: CompaniesPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [companies, setCompanies] = useState(initialCompanies)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const pendingStatus = searchParams.get("status") as CompanyStatus | null

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowCreateModal(true)
      const p = new URLSearchParams(searchParams.toString())
      p.delete("new")
      router.replace(`/companies${p.toString() ? "?" + p.toString() : ""}`, { scroll: false })
    }
  }, [searchParams, router])
  const [search, setSearch] = useState(searchParams.get("q") ?? "")
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") ?? "all")
  const [industryFilter, setIndustryFilter] = useState<string>(searchParams.get("industry") ?? "all")
  const [priorityFilter, setPriorityFilter] = useState<string>(searchParams.get("priority") ?? "all")
  const [sort, setSort] = useState<"priority" | "name" | "appliedAt" | "updatedAt" | "nextEvent" | "urgency">(
    (searchParams.get("sort") as "priority" | "name" | "appliedAt" | "updatedAt" | "nextEvent" | "urgency") ?? "urgency"
  )
  const [starredOnly, setStarredOnly] = useState(searchParams.get("starred") === "1")
  const [periodFilter, setPeriodFilter] = useState(searchParams.get("period") ?? "all")
  const [upcomingFilter, setUpcomingFilter] = useState(searchParams.get("upcoming") === "1")
  const [stagnantFilter, setStagnantFilter] = useState(searchParams.get("stagnant") === "1")
  const [viewMode, setViewMode] = useState<"table" | "grid" | "industry">(() => {
    if (typeof window === "undefined") return "table"
    return (localStorage.getItem("companies-view") as "table" | "grid" | "industry") ?? "table"
  })

  const updateUrl = (params: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== "all" && v !== "" && v !== "priority") p.set(k, v)
      else p.delete(k)
    })
    router.replace(`/companies?${p.toString()}`, { scroll: false })
  }

  const filtered = useMemo(() => {
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const f = companies.filter((c) => {
      if (starredOnly && !c.starred) return false
      if (upcomingFilter && (!c.nextEvents || c.nextEvents.length === 0)) return false
      if (stagnantFilter && (Date.now() - new Date(c.updatedAt).getTime()) < 7 * 24 * 60 * 60 * 1000) return false
      if (stagnantFilter && ["rejected", "withdrawn", "accepted", "offer", "internship"].includes(c.status)) return false
      if (periodFilter === "this_month" && (!c.appliedAt || new Date(c.appliedAt) < thisMonthStart)) return false
      if (periodFilter === "last_month" && (!c.appliedAt || new Date(c.appliedAt) < lastMonthStart || new Date(c.appliedAt) > lastMonthEnd)) return false
      if (statusFilter !== "all" && c.status !== statusFilter) return false
      if (industryFilter !== "all" && c.industry !== industryFilter) return false
      if (priorityFilter !== "all" && c.priority !== parseInt(priorityFilter)) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          (c.position ?? "").toLowerCase().includes(q) ||
          (c.industry ?? "").toLowerCase().includes(q) ||
          (c.location ?? "").toLowerCase().includes(q) ||
          (c.notes ?? "").toLowerCase().includes(q)
        )
      }
      return true
    })
    if (sort === "name") return [...f].sort((a, b) => a.name.localeCompare(b.name, "ja"))
    if (sort === "appliedAt") return [...f].sort((a, b) => {
      if (!a.appliedAt && !b.appliedAt) return 0
      if (!a.appliedAt) return 1
      if (!b.appliedAt) return -1
      return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    })
    if (sort === "updatedAt") return [...f].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    if (sort === "nextEvent") return [...f].sort((a, b) => {
      const aDate = a.nextEvents?.[0]?.startAt ? new Date(a.nextEvents[0].startAt).getTime() : Infinity
      const bDate = b.nextEvents?.[0]?.startAt ? new Date(b.nextEvents[0].startAt).getTime() : Infinity
      return aDate - bDate
    })
    if (sort === "urgency") return [...f].sort((a, b) => {
      const getUrgency = (c: typeof f[0]) => {
        let score = 0
        const nextEv = c.nextEvents?.[0]
        if (nextEv) {
          const days = Math.ceil((new Date(nextEv.startAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          // 面接・ケース面接が近い
          if (["interview", "case_interview"].includes(nextEv.type)) {
            if (days <= 1) score += 200
            else if (days <= 3) score += 150
            else if (days <= 7) score += 80
          }
          // 締切イベントが近い
          if (nextEv.type === "deadline") {
            if (days <= 1) score += 180
            else if (days <= 3) score += 120
            else if (days <= 7) score += 60
          }
          // 説明会・ミーティングが近い
          if (["info_session", "meeting"].includes(nextEv.type) && days <= 2) {
            score += 40
          }
        }
        // 内定（承諾・辞退判断が必要）
        if (c.status === "offer") score += 200
        // 選考フェーズのスコア
        const statusBonus: Record<string, number> = { final: 35, case: 25, internship: 22, interview: 20, screening: 10, applied: 5 }
        score += (statusBonus[c.status] ?? 0)
        // 優先度
        score += c.priority * 4
        // 停滞ペナルティ
        if (["interview", "internship", "case", "final"].includes(c.status) &&
            new Date(c.updatedAt).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000) score -= 15
        return score
      }
      return getUrgency(b) - getUrgency(a)
    })
    return [...f].sort((a, b) => b.priority - a.priority)
  }, [companies, search, statusFilter, industryFilter, priorityFilter, sort, starredOnly, periodFilter, upcomingFilter])

  const handleCreated = (company: CompanyWithData) => {
    setCompanies((prev) => [company, ...prev])
    setShowCreateModal(false)
    router.refresh()
  }

  const handleDeleted = (id: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id))
  }

  const handleUpdated = (updated: CompanyWithData) => {
    setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  const handleExportCSV = () => {
    const headers = ["企業名", "職種", "業界", "ステータス", "優先度", "応募日", "URL", "備考"]
    const STATUS_LABELS: Record<string, string> = {
      wish: "志望", applied: "応募済", screening: "書類選考", es: "ES選考", test: "筆記試験",
      interview: "面接中", internship: "インターン参加", case: "ケース面接",
      final: "最終選考", offer: "内定", accepted: "承諾", rejected: "不採用", withdrawn: "辞退",
    }
    const rows = filtered.map((c) => [
      c.name,
      c.position ?? "",
      c.industry ?? "",
      STATUS_LABELS[c.status] ?? c.status,
      c.priority?.toString() ?? "",
      formatDate(c.appliedAt),
      c.url ?? "",
      c.notes ?? "",
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const bom = "﻿"
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `companies-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${filtered.length}社をCSVでエクスポートしました`)
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">企業管理</h1>
          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <span>{filtered.length} 社表示{filtered.length !== companies.length && ` (全${companies.length}社)`}</span>
            {companies.filter(c => ["interview", "internship", "case", "final"].includes(c.status)).length > 0 && (
              <button
                onClick={() => { setStatusFilter("interview"); updateUrl({ status: "interview" }) }}
                className="text-amber-600 font-medium hover:text-amber-700 transition-colors"
              >
                面接中 {companies.filter(c => ["interview", "internship", "case", "final"].includes(c.status)).length}社
              </button>
            )}
            {companies.filter(c => c.status === "offer").length > 0 && (
              <button
                onClick={() => { setStatusFilter("offer"); updateUrl({ status: "offer" }) }}
                className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
              >
                内定 {companies.filter(c => c.status === "offer").length}社
              </button>
            )}
            {companies.filter(c => c.status === "accepted").length > 0 && (
              <span className="text-emerald-700 font-medium">
                承諾済み {companies.filter(c => c.status === "accepted").length}社
              </span>
            )}
            {(() => {
              const stagnantCount = companies.filter((c) =>
                ["applied", "screening", "interview", "case", "final"].includes(c.status) &&
                new Date(c.updatedAt).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000
              ).length
              if (stagnantCount === 0) return null
              return (
                <span className="text-amber-500 font-medium" title="7日以上更新なし">
                  停滞 {stagnantCount}社
                </span>
              )
            })()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleExportCSV} className="gap-1.5 text-muted-foreground">
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
          <Link
            href="/companies/archived"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground gap-1.5")}
          >
            アーカイブ
          </Link>
          <div className="flex rounded-lg border overflow-hidden hidden sm:flex">
            <button
              onClick={() => { setViewMode("table"); localStorage.setItem("companies-view", "table") }}
              className={cn("h-8 px-2 flex items-center justify-center transition-colors", viewMode === "table" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
              title="テーブル表示"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setViewMode("grid"); localStorage.setItem("companies-view", "grid") }}
              className={cn("h-8 px-2 flex items-center justify-center transition-colors", viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
              title="グリッド表示"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setViewMode("industry"); localStorage.setItem("companies-view", "industry") }}
              className={cn("h-8 px-2 flex items-center justify-center transition-colors", viewMode === "industry" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
              title="業界別グループ表示"
            >
              <Layers className="h-3.5 w-3.5" />
            </button>
          </div>
          <Link
            href="/companies/kanban"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <KanbanIcon className="h-3.5 w-3.5" />
            カンバン
          </Link>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-3.5 w-3.5" />
            企業を追加
          </Button>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="企業名・職種で検索..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); updateUrl({ q: e.target.value }) }}
          className="h-8 w-48 text-sm"
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); updateUrl({ status: v ?? "all" }) }}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {COMPANY_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={industryFilter} onValueChange={(v) => { setIndustryFilter(v ?? "all"); updateUrl({ industry: v ?? "all" }) }}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="業界" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての業界</SelectItem>
            {INDUSTRIES.map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v ?? "all"); updateUrl({ priority: v ?? "all" }) }}>
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue placeholder="優先度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {[5, 4, 3, 2, 1].map((p) => (
              <SelectItem key={p} value={String(p)}>
                {"★".repeat(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => { setSort((v ?? "priority") as typeof sort); updateUrl({ sort: v ?? "priority" }) }}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="urgency">緊急度順</SelectItem>
            <SelectItem value="priority">優先度順</SelectItem>
            <SelectItem value="nextEvent">次回予定順</SelectItem>
            <SelectItem value="name">名前順</SelectItem>
            <SelectItem value="appliedAt">応募日順</SelectItem>
            <SelectItem value="updatedAt">更新日順</SelectItem>
          </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={(v) => { setPeriodFilter(v ?? "all"); updateUrl({ period: v ?? "all" }) }}>
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全期間</SelectItem>
            <SelectItem value="this_month">今月応募</SelectItem>
            <SelectItem value="last_month">先月応募</SelectItem>
          </SelectContent>
        </Select>
        <button
          onClick={() => {
            const isActive = ["screening", "interview", "internship", "case", "final"].includes(statusFilter)
            if (isActive) { setStatusFilter("all"); updateUrl({ status: "all" }) }
            else { setStatusFilter("screening"); updateUrl({ status: "screening" }) }
          }}
          className={`text-xs h-8 px-2 rounded-md border transition-colors flex items-center gap-1 ${["screening", "interview", "internship", "case", "final"].includes(statusFilter) ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
        >
          ⚡ 選考中
          <span className="bg-muted text-[10px] rounded-full px-1 font-bold">
            {companies.filter((c) => ["screening", "interview", "internship", "case", "final"].includes(c.status) && !c.archivedAt).length}
          </span>
        </button>
        <button
          onClick={() => {
            if (statusFilter === "final") { setStatusFilter("all"); updateUrl({ status: "all" }) }
            else { setStatusFilter("final"); updateUrl({ status: "final" }) }
          }}
          className={`text-xs h-8 px-2 rounded-md border transition-colors flex items-center gap-1 ${statusFilter === "final" ? "bg-orange-50 border-orange-300 text-orange-700 dark:bg-orange-950/30 dark:border-orange-700 dark:text-orange-400" : "text-muted-foreground hover:text-foreground"}`}
        >
          🔥 最終選考
          <span className="bg-muted text-[10px] rounded-full px-1 font-bold">
            {companies.filter((c) => c.status === "final" && !c.archivedAt).length}
          </span>
        </button>
        <button
          onClick={() => {
            if (statusFilter === "internship") { setStatusFilter("all"); updateUrl({ status: "all" }) }
            else { setStatusFilter("internship"); updateUrl({ status: "internship" }) }
          }}
          className={`text-xs h-8 px-2 rounded-md border transition-colors flex items-center gap-1 ${statusFilter === "internship" ? "bg-cyan-50 border-cyan-300 text-cyan-700 dark:bg-cyan-950/30 dark:border-cyan-700 dark:text-cyan-400" : "text-muted-foreground hover:text-foreground"}`}
        >
          🎯 インターン
          <span className="bg-muted text-[10px] rounded-full px-1 font-bold">
            {companies.filter((c) => c.status === "internship" && !c.archivedAt).length}
          </span>
        </button>
        <button
          onClick={() => { setStarredOnly(!starredOnly); updateUrl({ starred: !starredOnly ? "1" : "" }) }}
          className={`text-xs h-8 px-2 rounded-md border transition-colors flex items-center gap-1 ${starredOnly ? "bg-amber-50 border-amber-300 text-amber-700" : "text-muted-foreground hover:text-foreground"}`}
        >
          ★ お気に入りのみ
        </button>
        <button
          onClick={() => { setUpcomingFilter(!upcomingFilter); updateUrl({ upcoming: !upcomingFilter ? "1" : "" }) }}
          className={`text-xs h-8 px-2 rounded-md border transition-colors flex items-center gap-1 ${upcomingFilter ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/30 dark:border-blue-700 dark:text-blue-400" : "text-muted-foreground hover:text-foreground"}`}
        >
          📅 予定あり
        </button>
        <button
          onClick={() => { setStagnantFilter(!stagnantFilter); updateUrl({ stagnant: !stagnantFilter ? "1" : "" }) }}
          className={`text-xs h-8 px-2 rounded-md border transition-colors flex items-center gap-1 ${stagnantFilter ? "bg-zinc-100 border-zinc-400 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-300" : "text-muted-foreground hover:text-foreground"}`}
        >
          📭 停滞中
        </button>
        {(search || statusFilter !== "all" || industryFilter !== "all" || priorityFilter !== "all" || sort !== "priority" || starredOnly || periodFilter !== "all" || upcomingFilter || stagnantFilter) && (
          <button
            onClick={() => {
              setSearch(""); setStatusFilter("all"); setIndustryFilter("all"); setPriorityFilter("all"); setSort("priority"); setStarredOnly(false); setPeriodFilter("all"); setUpcomingFilter(false); setStagnantFilter(false)
              router.replace("/companies", { scroll: false })
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
          >
            ✕ リセット
          </button>
        )}
      </div>

      {/* 内定バナー */}
      {companies.filter(c => c.status === "offer").length > 0 && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-3 flex items-center gap-3">
          <span className="text-lg">🎉</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              内定企業が{companies.filter(c => c.status === "offer").length}社あります！
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              {companies.filter(c => c.status === "offer").map(c => c.name).join("、")} — 承諾期限を確認してください
            </p>
          </div>
          <button
            onClick={() => setStatusFilter("offer")}
            className="text-xs text-emerald-700 hover:text-emerald-900 underline shrink-0"
          >
            内定企業を表示
          </button>
        </div>
      )}

      {/* 業界別グループ表示 */}
      {viewMode === "industry" && (() => {
        const industryGroups = filtered.reduce<Record<string, typeof filtered>>((acc, company) => {
          const key = company.industry ?? "その他"
          if (!acc[key]) acc[key] = []
          acc[key].push(company)
          return acc
        }, {})
        const PRIORITY_INDUSTRIES = ["コンサルティング", "ITコンサルティング", "HR-tech", "FinTech/SaaS", "SaaS"]
        const sortedKeys = Object.keys(industryGroups).sort((a, b) => {
          const aIdx = PRIORITY_INDUSTRIES.indexOf(a)
          const bIdx = PRIORITY_INDUSTRIES.indexOf(b)
          if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
          if (aIdx !== -1) return -1
          if (bIdx !== -1) return 1
          return industryGroups[b].length - industryGroups[a].length
        })
        if (sortedKeys.length === 0) return (
          <p className="text-center text-sm text-muted-foreground py-8">該当する企業がありません</p>
        )
        return (
          <div className="space-y-4">
            {sortedKeys.map((industry) => {
              const items = industryGroups[industry]
              const activeCount = items.filter((c) => !["rejected", "withdrawn", "accepted"].includes(c.status)).length
              return (
                <div key={industry} className="border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/40 border-b">
                    <span className="font-semibold text-sm">{industry}</span>
                    <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full border">{items.length}社</span>
                    {activeCount > 0 && <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">選考中 {activeCount}</span>}
                  </div>
                  <div className="divide-y">
                    {items.map((company) => (
                      <Link
                        key={company.id}
                        href={`/companies/${company.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {company.starred && <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />}
                            <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{company.name}</span>
                            {company.position && <span className="text-xs text-muted-foreground hidden sm:block truncate">/ {company.position}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <PriorityStars priority={company.priority} size="sm" />
                          <CompanyStatusBadge status={company.status as CompanyStatus} />
                          {company.nextEvents && company.nextEvents[0] && (() => {
                            const days = Math.ceil((new Date(company.nextEvents![0].startAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                            return (
                              <span className={cn("text-[10px] font-medium", days <= 1 ? "text-red-500" : days <= 3 ? "text-amber-600" : "text-muted-foreground")}>
                                {days === 0 ? "今日" : days === 1 ? "明日" : `${days}日後`}
                              </span>
                            )
                          })()}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* テーブル / グリッド表示 */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.length === 0 ? (
            <p className="col-span-full text-center text-sm text-muted-foreground py-8">該当する企業がありません</p>
          ) : filtered.map((company) => {
              const daysStale = Math.floor((Date.now() - new Date(company.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
              const isStale = daysStale >= 7 && !["rejected", "withdrawn", "accepted", "offer", "internship"].includes(company.status)
              const nextEv = company.nextEvents?.[0]
              const nextEvDays = nextEv ? Math.ceil((new Date(nextEv.startAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
              const hasUrgentDeadline = nextEv && nextEvDays !== null && nextEvDays <= 3
              return (
                <div
                  key={company.id}
                  className={cn(
                    "group relative border rounded-xl p-4 hover:shadow-md transition-all bg-card hover:border-primary/30",
                    isStale && !hasUrgentDeadline && "border-zinc-300/70 dark:border-zinc-700/50",
                    hasUrgentDeadline && nextEvDays! <= 1 && "border-red-400 dark:border-red-700",
                    hasUrgentDeadline && nextEvDays! > 1 && "border-amber-400 dark:border-amber-700",
                  )}
                >
                  <Link href={`/companies/${company.id}`} className="block">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{company.name}</p>
                        {company.position && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{company.position}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isStale && (
                          <span className="text-[9px] text-zinc-400" title={`${daysStale}日間更新なし`}>
                            {daysStale}日
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                      <CompanyStatusBadge status={company.status as CompanyStatus} />
                      {company.industry && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{company.industry}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <PriorityStars priority={company.priority} size="sm" />
                        {(company._count?.events ?? 0) > 0 && (
                          <span className="text-[9px] text-muted-foreground/60">📅{company._count!.events}</span>
                        )}
                      </div>
                      {company.nextEvents && company.nextEvents[0] && (() => {
                        const days = Math.ceil((new Date(company.nextEvents![0].startAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        return (
                          <span className={`text-[10px] ${days <= 1 ? "text-red-500 font-medium" : days <= 3 ? "text-amber-600" : "text-muted-foreground"}`}>
                            {days === 0 ? "今日" : days === 1 ? "明日" : `${days}日後`}
                          </span>
                        )
                      })()}
                    </div>
                  </Link>
                  {/* クイックアクション（ホバー時表示） */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={async (e) => {
                        e.preventDefault()
                        const res = await fetch(`/api/companies/${company.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ starred: !company.starred }),
                        })
                        if (res.ok) {
                          const updated = await res.json()
                          handleUpdated({ ...company, ...updated })
                        }
                      }}
                      className="h-6 w-6 rounded-md bg-background/80 backdrop-blur border hover:bg-muted flex items-center justify-center transition-colors"
                      title={company.starred ? "スターを外す" : "スターを付ける"}
                    >
                      <Star className={cn("h-3 w-3", company.starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                    </button>
                    <Select
                      value={company.status}
                      onValueChange={async (v: string | null) => {
                        const val = v ?? company.status
                        const res = await fetch(`/api/companies/${company.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: val }),
                        })
                        if (res.ok) {
                          const updated = await res.json()
                          handleUpdated({ ...company, ...updated })
                        }
                      }}
                    >
                      <SelectTrigger className="h-6 w-6 border bg-background/80 backdrop-blur rounded-md p-0 flex items-center justify-center focus-visible:ring-0 [&>svg]:hidden">
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )
            })}
        </div>
      ) : viewMode === "table" ? (
        <CompanyTable
          companies={filtered}
          onDeleted={handleDeleted}
          onUpdated={handleUpdated}
          currentSort={sort}
          onSortChange={(s) => { setSort(s); updateUrl({ sort: s }) }}
        />
      ) : null}

      {/* 作成モーダル */}
      {showCreateModal && (
        <CompanyFormModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          initialStatus={pendingStatus ?? undefined}
          onSuccess={handleCreated}
        />
      )}
    </div>
  )
}
