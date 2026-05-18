"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, BookOpen, Star, Clock, Download, Shuffle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/common/empty-state"
import { CaseFormModal } from "./case-form-modal"
import { CaseTimer } from "./case-timer"
import { formatRelative } from "@/lib/utils/date"
import { CASE_CATEGORIES } from "@/lib/constants"
import type { CaseLog, Company } from "@/types"
import { cn } from "@/lib/utils"

type CaseWithCompany = CaseLog & { company: { id: string; name: string } | null }
type CompanyOption = { id: string; name: string }

interface CasesPageClientProps {
  initialCases: CaseWithCompany[]
  companies: CompanyOption[]
  interviewCompanies?: { id: string; name: string; status: string }[]
}

export function CasesPageClient({ initialCases, companies, interviewCompanies = [] }: CasesPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cases, setCases] = useState(initialCases)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowCreate(true)
      router.replace("/cases", { scroll: false })
    }
  }, [searchParams, router])
  const [timerDuration, setTimerDuration] = useState<number | undefined>(undefined)
  const [search, setSearch] = useState(searchParams.get("q") ?? "")
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") ?? "all")
  const [difficultyFilter, setDifficultyFilter] = useState(searchParams.get("difficulty") ?? "all")
  const [tagFilter, setTagFilter] = useState(searchParams.get("tag") ?? "")
  const [sort, setSort] = useState<"newest" | "rating" | "weak" | "difficulty" | "starred">((searchParams.get("sort") as "newest" | "rating" | "weak" | "difficulty" | "starred") ?? "newest")
  const [monthlyGoal, setMonthlyGoal] = useState<number>(() => {
    if (typeof window === "undefined") return 8
    return parseInt(localStorage.getItem("case-monthly-goal") ?? "8")
  })
  const [weeklyGoal, setWeeklyGoal] = useState<number>(() => {
    if (typeof window === "undefined") return 3
    return parseInt(localStorage.getItem("case-weekly-goal") ?? "3")
  })

  const updateCasesUrl = (params: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== "all" && v !== "" && v !== "newest") p.set(k, v)
      else p.delete(k)
    })
    router.replace(`/cases?${p.toString()}`, { scroll: false })
  }
  const [starredIds, setStarredIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set()
    try { return new Set(JSON.parse(localStorage.getItem("starred-cases") ?? "[]")) } catch { return new Set() }
  })

  const toggleStar = (id: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem("starred-cases", JSON.stringify(Array.from(next)))
      return next
    })
  }

  const allTags = useMemo(() => Array.from(new Set(cases.flatMap((c) => (c.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean)))).sort(), [cases])

  const filtered = useMemo(() => {
    const f = cases.filter((c) => {
      if (categoryFilter !== "all" && c.category !== categoryFilter) return false
      if (difficultyFilter !== "all" && String(c.difficulty) !== difficultyFilter) return false
      if (tagFilter && !(c.tags ?? "").split(",").map((t) => t.trim()).includes(tagFilter)) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          c.title.toLowerCase().includes(q) ||
          (c.category ?? "").toLowerCase().includes(q) ||
          (c.tags ?? "").toLowerCase().includes(q)
        )
      }
      return true
    })
    if (sort === "rating") return [...f].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    if (sort === "weak") return [...f].sort((a, b) => (a.rating ?? 6) - (b.rating ?? 6)) // 未評価 or 低評価を優先
    if (sort === "difficulty") return [...f].sort((a, b) => (b.difficulty ?? 0) - (a.difficulty ?? 0))
    if (sort === "starred") return [...f].sort((a, b) => (starredIds.has(b.id) ? 1 : 0) - (starredIds.has(a.id) ? 1 : 0))
    return f // newest (already ordered by createdAt desc from server)
  }, [cases, search, categoryFilter, difficultyFilter, tagFilter, sort, starredIds])

  const ratedCases = cases.filter((c) => c.rating)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentCases = cases.filter((c) => new Date(c.createdAt) >= sevenDaysAgo)
  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0)
  const lastMonthStart = new Date(thisMonth); lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
  const thisMonthCases = cases.filter((c) => new Date(c.createdAt) >= thisMonth)
  const lastMonthCases = cases.filter((c) => new Date(c.createdAt) >= lastMonthStart && new Date(c.createdAt) < thisMonth)
  // 練習ストリーク計算
  const streak = (() => {
    const practicedDays = new Set(cases.map((c) => new Date(c.createdAt).toISOString().split("T")[0]))
    let count = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split("T")[0]
      if (practicedDays.has(key)) {
        count++
      } else if (i > 0) {
        break
      }
    }
    return count
  })()

  const stats = {
    total: cases.length,
    streak,
    avgRating: ratedCases.length > 0
      ? (ratedCases.reduce((s, c) => s + (c.rating ?? 0), 0) / ratedCases.length).toFixed(1)
      : "-",
    topCategory: Array.from(
      cases.reduce((acc, c) => {
        const key = c.category ?? "未分類"
        acc.set(key, (acc.get(key) ?? 0) + 1)
        return acc
      }, new Map<string, number>())
    ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-",
    avgDuration: cases.filter((c) => c.duration).length > 0
      ? Math.round(cases.filter((c) => c.duration).reduce((s, c) => s + (c.duration ?? 0), 0) / cases.filter((c) => c.duration).length)
      : null,
    difficultyDist: [1, 2, 3, 4, 5].map((d) => cases.filter((c) => c.difficulty === d).length),
    recentCount: recentCases.length,
    recentAvgRating: recentCases.filter((c) => c.rating).length > 0
      ? (recentCases.filter((c) => c.rating).reduce((s, c) => s + (c.rating ?? 0), 0) / recentCases.filter((c) => c.rating).length).toFixed(1)
      : null,
    recentTotalMinutes: recentCases.filter((c) => c.duration).reduce((s, c) => s + (c.duration ?? 0), 0),
  }

  const handleExportCSV = () => {
    const headers = ["タイトル", "カテゴリ", "難易度", "自己評価", "時間(分)", "企業", "問い", "振り返り", "タグ", "作成日"]
    const rows = filtered.map((c) => [
      c.title,
      c.category ?? "",
      c.difficulty?.toString() ?? "",
      c.rating?.toString() ?? "",
      c.duration?.toString() ?? "",
      c.company?.name ?? "",
      c.prompt ?? "",
      c.feedback ?? "",
      c.tags ?? "",
      new Date(c.createdAt).toLocaleDateString("ja-JP"),
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cases-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${filtered.length}件をCSVでエクスポートしました`)
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">ケース練習</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{stats.total}件</span>
            {stats.avgRating !== "-" && <span>平均評価 ★{stats.avgRating}</span>}
            {stats.topCategory !== "-" && <span>最多: {stats.topCategory}</span>}
            {stats.avgDuration && <span>平均{stats.avgDuration}分</span>}
            {stats.streak > 0 && (
              <span className={cn(
                "flex items-center gap-0.5 font-medium",
                stats.streak >= 7 ? "text-orange-500" : stats.streak >= 3 ? "text-amber-500" : "text-muted-foreground"
              )}>
                🔥 {stats.streak}日連続
              </span>
            )}
          </div>
          {stats.total > 0 && stats.difficultyDist.some((n) => n > 0) && (
            <div className="flex items-center gap-1 mt-1.5" title="難易度分布">
              {stats.difficultyDist.map((count, i) => {
                const max = Math.max(...stats.difficultyDist, 1)
                const colors = ["bg-green-400", "bg-lime-400", "bg-amber-400", "bg-orange-400", "bg-red-400"]
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div
                      className={cn("w-4 rounded-sm transition-all", colors[i])}
                      style={{ height: `${Math.max(4, (count / max) * 24)}px`, opacity: count === 0 ? 0.2 : 1 }}
                    />
                    <span className="text-[8px] text-muted-foreground">{i + 1}</span>
                  </div>
                )
              })}
            </div>
          )}
          {(stats.recentCount > 0 || cases.length > 0) && (
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground bg-muted/40 rounded-lg px-2.5 py-1.5">
              <span className="font-medium text-foreground">直近7日:</span>
              <span className={cn(stats.recentCount >= weeklyGoal ? "text-emerald-600 font-medium" : "")}>
                {stats.recentCount}/{weeklyGoal}件
                {stats.recentCount >= weeklyGoal ? "🎯" : ""}
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={weeklyGoal}
                  onChange={(e) => {
                    const v = parseInt(e.target.value)
                    if (v > 0) { setWeeklyGoal(v); localStorage.setItem("case-weekly-goal", String(v)) }
                  }}
                  className="h-4 w-6 text-[9px] border rounded px-0.5 bg-transparent ml-0.5"
                  title="週次目標件数"
                />
              </span>
              {stats.recentTotalMinutes > 0 && <span>{stats.recentTotalMinutes}分</span>}
              {stats.recentAvgRating && <span>★{stats.recentAvgRating}</span>}
              {lastMonthCases.length > 0 && (
                <span className="ml-2 border-l pl-2">
                  今月: {thisMonthCases.length}件
                  <span className={thisMonthCases.length >= lastMonthCases.length ? "text-emerald-600 ml-1" : "text-red-500 ml-1"}>
                    ({thisMonthCases.length >= lastMonthCases.length ? "+" : ""}{thisMonthCases.length - lastMonthCases.length}件vs先月)
                  </span>
                </span>
              )}
              <span className="ml-2 border-l pl-2 flex items-center gap-1.5">
                <span className={cn(thisMonthCases.length >= monthlyGoal ? "text-emerald-600 font-medium" : "")}>
                  目標: {thisMonthCases.length}/{monthlyGoal}{thisMonthCases.length >= monthlyGoal ? "🎯" : ""}
                </span>
                <div className="bg-muted rounded-full h-1 w-12">
                  <div
                    className={cn("h-1 rounded-full transition-all", thisMonthCases.length >= monthlyGoal ? "bg-emerald-500" : "bg-primary")}
                    style={{ width: `${Math.min(100, (thisMonthCases.length / monthlyGoal) * 100)}%` }}
                  />
                </div>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={monthlyGoal}
                  onChange={(e) => {
                    const v = parseInt(e.target.value)
                    if (v > 0) {
                      setMonthlyGoal(v)
                      localStorage.setItem("case-monthly-goal", String(v))
                    }
                  }}
                  className="h-4 w-8 text-[9px] border rounded px-0.5 bg-transparent"
                  title="月次目標件数"
                />
              </span>
            </div>
          )}
        </div>
        <div className="flex items-start gap-3">
          {filtered.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleExportCSV} className="gap-1.5 text-muted-foreground hidden md:flex">
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
          )}
          <CaseTimer
            className="hidden md:flex"
            onComplete={(mins) => {
              setTimerDuration(mins)
              setShowCreate(true)
            }}
          />
          {cases.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  // Prefer most recently low-rated cases or cases without rating
                  const weakCases = cases.filter((c) => !c.rating || c.rating <= 3)
                  // Sort by rating ascending (lowest first), then by date descending (most recent first)
                  const sorted = [...(weakCases.length > 0 ? weakCases : cases)]
                    .sort((a, b) => {
                      const ratingDiff = (a.rating ?? 0) - (b.rating ?? 0)
                      if (ratingDiff !== 0) return ratingDiff
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    })
                  // Pick from top 5 weakest randomly
                  const pool = sorted.slice(0, 5)
                  const randomCase = pool[Math.floor(Math.random() * pool.length)]
                  if (randomCase) router.push(`/cases/${randomCase.id}`)
                }}
                title="評価が低いケースを優先して復習"
              >
                <Shuffle className="h-3.5 w-3.5" />
                弱点復習
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => {
                  const randomCase = cases[Math.floor(Math.random() * cases.length)]
                  if (randomCase) router.push(`/cases/${randomCase.id}`)
                }}
                title="全ケースからランダムに復習"
              >
                <Shuffle className="h-3.5 w-3.5" />
                ランダム
              </Button>
            </>
          )}
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" />
            ケースを記録
          </Button>
        </div>
      </div>

      {/* 面接中企業バナー */}
      {interviewCompanies.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium text-amber-700 dark:text-amber-300 shrink-0">🎯 面接中企業のためにケース練習しよう:</span>
          <div className="flex flex-wrap gap-1.5">
            {interviewCompanies.map((c) => (
              <button
                key={c.id}
                onClick={() => { setCategoryFilter("all"); updateCasesUrl({ company: c.id }); setShowCreate(true) }}
                className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="タイトル・カテゴリ・タグで検索..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); updateCasesUrl({ q: e.target.value }) }}
          className="h-8 w-52 text-sm"
        />
        <Select value={categoryFilter} onValueChange={(v: string | null) => { const val = v ?? "all"; setCategoryFilter(val); updateCasesUrl({ category: val }) }}>
          <SelectTrigger className="h-8 w-40 text-sm">
            <SelectValue placeholder="カテゴリ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {CASE_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={difficultyFilter} onValueChange={(v: string | null) => { const val = v ?? "all"; setDifficultyFilter(val); updateCasesUrl({ difficulty: val }) }}>
          <SelectTrigger className="h-8 w-28 text-sm">
            <SelectValue placeholder="難易度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての難易度</SelectItem>
            {[1, 2, 3, 4, 5].map((d) => (
              <SelectItem key={d} value={String(d)}>難易度{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v: string | null) => { const val = (v ?? "newest") as typeof sort; setSort(val); updateCasesUrl({ sort: val }) }}>
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">新しい順</SelectItem>
            <SelectItem value="rating">評価順（高い順）</SelectItem>
            <SelectItem value="weak">弱点優先（低評価順）</SelectItem>
            <SelectItem value="difficulty">難易度順</SelectItem>
            <SelectItem value="starred">スター優先</SelectItem>
          </SelectContent>
        </Select>
        {(search || categoryFilter !== "all" || difficultyFilter !== "all" || tagFilter || sort !== "newest") && (
          <button
            onClick={() => { setSearch(""); setCategoryFilter("all"); setDifficultyFilter("all"); setTagFilter(""); setSort("newest"); router.replace("/cases", { scroll: false }) }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕ リセット
          </button>
        )}
      </div>

      {/* タグフィルター */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tagFilter && (
            <button onClick={() => { setTagFilter(""); updateCasesUrl({ tag: "" }) }} className="text-[10px] bg-primary/10 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full">
              #{tagFilter} ×
            </button>
          )}
          {!tagFilter && allTags.slice(0, 8).map((tag) => (
            <button
              key={tag}
              onClick={() => { setTagFilter(tag); updateCasesUrl({ tag }) }}
              className="text-[10px] bg-muted/80 hover:bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="ケースログがありません"
          description="「ケースを記録」からケース面接の振り返りを保存しましょう"
          action={{ label: "ケースを記録する", onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((caseLog) => (
            <div key={caseLog.id} className="relative">
              <button
                onClick={(e) => { e.preventDefault(); toggleStar(caseLog.id) }}
                className="absolute top-2 right-2 z-10 h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                title={starredIds.has(caseLog.id) ? "スター解除" : "スターを付ける"}
              >
                <Star className={cn("h-3.5 w-3.5", starredIds.has(caseLog.id) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30")} />
              </button>
            <Link href={`/cases/${caseLog.id}`}>
              <Card className={cn("hover:shadow-md transition-shadow h-full cursor-pointer", starredIds.has(caseLog.id) && "border-amber-300")}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-tight flex-1 line-clamp-2 pr-5">
                      {caseLog.title}
                    </p>
                    {caseLog.rating && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-medium">{caseLog.rating}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {caseLog.category && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0.5 cursor-pointer hover:bg-muted"
                        onClick={(e) => { e.preventDefault(); setCategoryFilter(caseLog.category!); updateCasesUrl({ category: caseLog.category! }) }}
                      >
                        {caseLog.category}
                      </Badge>
                    )}
                    {caseLog.difficulty && (
                      <Badge variant="outline" className={cn(
                        "text-[10px] px-1.5 py-0.5",
                        caseLog.difficulty >= 4 ? "border-red-300 text-red-600" :
                        caseLog.difficulty >= 3 ? "border-amber-300 text-amber-600" :
                        "border-green-300 text-green-600"
                      )}>
                        難易度{caseLog.difficulty}
                      </Badge>
                    )}
                  </div>

                  {caseLog.tags && (
                    <div className="flex flex-wrap gap-1">
                      {caseLog.tags.split(",").map((tag) => (
                        <button
                          key={tag.trim()}
                          onClick={(e) => { e.preventDefault(); setTagFilter(tag.trim()); updateCasesUrl({ tag: tag.trim() }) }}
                          className="text-[10px] bg-muted/80 hover:bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground transition-colors"
                        >
                          #{tag.trim()}
                        </button>
                      ))}
                    </div>
                  )}
                  {caseLog.company && (
                    <p className="text-xs text-muted-foreground">{caseLog.company.name}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelative(caseLog.createdAt)}
                    </span>
                    {caseLog.duration && (
                      <span>{caseLog.duration}分</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
            </div>
          ))}
        </div>
      )}

      {/* フレームワーク参照ライブラリ */}
      <FrameworkLibrary />

      {showCreate && (
        <CaseFormModal
          open={showCreate}
          onOpenChange={(open) => { setShowCreate(open); if (!open) setTimerDuration(undefined) }}
          companies={companies}
          initialDuration={timerDuration}
          initialTitle={timerDuration ? `${new Date().toLocaleDateString("ja-JP", { month: "short", day: "numeric" })} ケース練習` : undefined}
          onSuccess={(newCase) => {
            setCases((prev) => [newCase, ...prev])
            setShowCreate(false)
            setTimerDuration(undefined)
          }}
        />
      )}
    </div>
  )
}

const FRAMEWORKS = [
  {
    name: "利益ツリー",
    category: "収益改善",
    formula: "利益 = 売上 − コスト",
    steps: ["売上 = 客数 × 客単価", "コスト = 固定費 + 変動費 × 販売量", "どちらが問題か仮説→分析"],
    tags: ["売上向上", "コスト削減", "利益改善"],
  },
  {
    name: "市場規模推定 (フェルミ推定)",
    category: "市場分析",
    formula: "市場規模 = 対象人口 × 購入率 × 単価 × 頻度",
    steps: ["日本の総人口から対象セグメントを絞る", "購入率・頻度を推定", "単価を推定し掛け合わせる", "サニティチェック"],
    tags: ["フェルミ推定", "市場規模"],
  },
  {
    name: "MECE分解",
    category: "構造化",
    formula: "Mutually Exclusive, Collectively Exhaustive",
    steps: ["要素を網羅的にリスト", "重複を排除", "ツリー構造で整理（縦×横）"],
    tags: ["MECE", "ロジックツリー", "構造化"],
  },
  {
    name: "3C分析",
    category: "戦略分析",
    formula: "Customer / Company / Competitor",
    steps: ["顧客: ニーズ・規模・トレンド", "自社: 強み・弱み・資源", "競合: ポジション・差別化"],
    tags: ["3C", "戦略"],
  },
  {
    name: "新規事業立案",
    category: "新規事業",
    formula: "WHY（なぜ今？）→ WHAT（何をする？）→ HOW（どう実現？）",
    steps: ["市場機会の特定（ペイン・ゲイン）", "ターゲット顧客の定義", "競合優位性の確認", "収益モデルの設計", "実行計画"],
    tags: ["新規事業", "ビジネスモデル"],
  },
  {
    name: "オペレーション改善",
    category: "業務改善",
    formula: "現状把握 → ボトルネック特定 → 改善策 → KPI設定",
    steps: ["プロセスをAs-Isで可視化", "非効率・ムダを特定", "改善施策の優先度付け（インパクト×難易度）", "KPIと期待効果を定量化"],
    tags: ["オペレーション", "業務改善", "DX"],
  },
  {
    name: "4P分析",
    category: "マーケティング",
    formula: "Product / Price / Place / Promotion",
    steps: ["Product: 製品特性・競合差別化", "Price: 価格戦略・価格弾力性", "Place: チャネル・流通戦略", "Promotion: 広告・PR・認知向上"],
    tags: ["マーケティング", "4P", "製品戦略"],
  },
  {
    name: "M&A・事業評価",
    category: "企業価値評価",
    formula: "企業価値 = DCF / 類似企業倍率 / 類似取引法",
    steps: ["事業・財務状況の把握", "シナジー効果の定量化", "バリュエーション手法の選択（DCF/EV/EBITDA）", "リスク・統合コストの評価", "投資判断（Go/No-go）"],
    tags: ["M&A", "バリュエーション", "企業買収"],
  },
  {
    name: "事業成長戦略",
    category: "成長戦略",
    formula: "アンゾフマトリクス：既存/新規 × 市場/製品",
    steps: ["既存市場×既存製品：市場浸透（シェア拡大）", "既存市場×新製品：製品開発", "新市場×既存製品：市場開拓", "新市場×新製品：多角化（最高リスク）", "最適な戦略の選択と実行計画"],
    tags: ["成長戦略", "アンゾフ", "多角化"],
  },
  {
    name: "AI活用戦略分析",
    category: "AI×戦略",
    formula: "課題発見 → AI適用可能性評価 → ROI算出 → 実装ロードマップ",
    steps: ["業務プロセスの課題・非効率を特定（As-Is分析）", "AIで自動化・高度化できる箇所を評価（技術的実現可能性）", "導入コストvs効果のROI試算（人員削減・品質向上・速度改善）", "段階的導入ロードマップ（Quick Win→Full Scale）", "KPI設定と効果測定の仕組みづくり"],
    tags: ["AI", "DX", "ロードマップ", "Northstar Bank向け"],
  },
  {
    name: "顧客体験（CX）改善",
    category: "マーケティング",
    formula: "カスタマージャーニー × NPS向上 × LTV最大化",
    steps: ["顧客セグメントとペルソナの定義", "カスタマージャーニーマップの作成（接触点を全列挙）", "各タッチポイントのペイン・ゲイン分析", "改善施策の優先度付け（インパクト×実現容易性）", "KPI設定（NPS・リテンション率・LTV）と測定"],
    tags: ["CX", "マーケ", "LTV", "UX"],
  },
]

function FrameworkLibrary() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          📚 ケースフレームワーク参照
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground font-normal">{FRAMEWORKS.length}種</span>
        </span>
        <span className={cn("text-muted-foreground text-xs transition-transform", open && "rotate-180")}>▾</span>
      </button>
      {open && (
        <div className="border-t p-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {FRAMEWORKS.map((fw) => (
              <button
                key={fw.name}
                onClick={() => setSelected(selected === fw.name ? null : fw.name)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-lg border transition-colors",
                  selected === fw.name
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted border-muted-foreground/20"
                )}
              >
                {fw.name}
              </button>
            ))}
          </div>
          {selected && (() => {
            const fw = FRAMEWORKS.find(f => f.name === selected)
            if (!fw) return null
            return (
              <div className="mt-2 p-3 bg-muted/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{fw.name}</span>
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{fw.category}</span>
                </div>
                <p className="text-xs font-mono bg-background/80 px-2 py-1 rounded text-primary">{fw.formula}</p>
                <ol className="text-xs space-y-0.5 text-muted-foreground">
                  {fw.steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-primary font-medium shrink-0">{i + 1}.</span>
                      {s}
                    </li>
                  ))}
                </ol>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {fw.tags.map((t) => (
                    <span key={t} className="text-[9px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">#{t}</span>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
