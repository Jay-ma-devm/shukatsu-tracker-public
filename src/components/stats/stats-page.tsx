"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, LineChart, Line } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { COMPANY_STATUSES } from "@/lib/constants"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Printer, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsPageClientProps {
  companies: { status: string; industry?: string | null; priority: number; appliedAt?: Date | null; archivedAt?: Date | null }[]
  tasks: { status: string; priority: number; dueAt?: Date | null; createdAt: Date }[]
  interviews: { type: string; outcome?: string | null; rating?: number | null; conductedAt: Date; duration?: number | null }[]
  cases: { category?: string | null; rating?: number | null; difficulty: number; duration?: number | null; createdAt: Date }[]
  meetings: { type: string; thankYouSent: boolean; conductedAt: Date; duration?: number | null }[]
  esStats?: { totalSheets: number; totalQuestions: number; answeredQuestions: number }
  activityData?: { date: string; count: number }[]
  careerStats?: { type: string; count: number }[]
}

export function StatsPageClient({ companies, tasks, interviews, cases, meetings, esStats, activityData = [], careerStats = [] }: StatsPageClientProps) {
  const activeCompanies = companies.filter((c) => !c.archivedAt)

  // ステータス分布
  const statusData = COMPANY_STATUSES.map((s) => ({
    name: s.label,
    value: companies.filter((c) => c.status === s.value).length,
  })).filter((d) => d.value > 0)

  // 業界分布
  const industryData = Array.from(
    activeCompanies.reduce((acc, c) => {
      const key = c.industry ?? "未設定"
      acc.set(key, (acc.get(key) ?? 0) + 1)
      return acc
    }, new Map<string, number>())
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)

  // 月別応募数
  const applicationsByMonth = useMemo(() => {
    const map = new Map<string, number>()
    companies.filter((c) => c.appliedAt).forEach((c) => {
      const key = new Date(c.appliedAt!).toLocaleDateString("ja-JP", { year: "numeric", month: "short" })
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return Array.from(map.entries()).sort().slice(-6).map(([name, value]) => ({ name, value }))
  }, [companies])

  // 月別面接数
  const interviewsByMonth = useMemo(() => {
    const map = new Map<string, number>()
    interviews.forEach((i) => {
      const key = new Date(i.conductedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "short" })
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return Array.from(map.entries()).slice(-6).map(([name, value]) => ({ name, value }))
  }, [interviews])

  // ケース月別練習
  const casesByMonth = useMemo(() => {
    const map = new Map<string, number>()
    cases.forEach((c) => {
      const key = new Date(c.createdAt).toLocaleDateString("ja-JP", { year: "numeric", month: "short" })
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return Array.from(map.entries()).slice(-6).map(([name, value]) => ({ name, value }))
  }, [cases])

  // 月別活動データ（面接+ケース統合）
  const combinedMonthlyActivity = useMemo(() => {
    const allMonths = new Set([...interviewsByMonth.map((d) => d.name), ...casesByMonth.map((d) => d.name)])
    return Array.from(allMonths).sort().slice(-6).map((month) => ({
      name: month,
      interviews: interviewsByMonth.find((d) => d.name === month)?.value ?? 0,
      cases: casesByMonth.find((d) => d.name === month)?.value ?? 0,
    }))
  }, [interviewsByMonth, casesByMonth])

  // 月別ケース平均評価（トレンド）
  const monthlyRatingTrend = useMemo(() => {
    const map = new Map<string, number[]>()
    cases.filter((c) => c.rating).forEach((c) => {
      const key = new Date(c.createdAt).toLocaleDateString("ja-JP", { year: "numeric", month: "short" })
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c.rating ?? 0)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([name, ratings]) => ({
        name,
        avg: parseFloat((ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)),
      }))
  }, [cases])

  // KPI
  const interviewPassRate = interviews.filter((i) => i.outcome).length > 0
    ? Math.round(interviews.filter((i) => i.outcome === "passed").length / interviews.filter((i) => i.outcome).length * 100)
    : null
  const avgInterviewRating = interviews.filter((i) => i.rating).length > 0
    ? (interviews.filter((i) => i.rating).reduce((s, i) => s + (i.rating ?? 0), 0) / interviews.filter((i) => i.rating).length).toFixed(1)
    : null
  const taskCompletionRate = tasks.length > 0
    ? Math.round(tasks.filter((t) => t.status === "done").length / tasks.length * 100)
    : null

  // 最も活発な曜日 (面接+ケース)
  const dayOfWeekActivity = [0, 1, 2, 3, 4, 5, 6].map((day) => {
    const count = [
      ...interviews.filter((i) => new Date(i.conductedAt).getDay() === day),
      ...cases.filter((c) => new Date(c.createdAt).getDay() === day),
    ].length
    return { day, count }
  })
  const busiestDay = dayOfWeekActivity.sort((a, b) => b.count - a.count)[0]
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"]
  const busiestDayName = busiestDay && busiestDay.count > 0 ? `${dayNames[busiestDay.day]}曜日` : null

  // 面接種別通過率
  const interviewPassRateByType = Array.from(
    interviews.reduce((acc, i) => {
      if (!acc.has(i.type)) acc.set(i.type, { passed: 0, total: 0 })
      const r = acc.get(i.type)!
      if (i.outcome) {
        r.total++
        if (i.outcome === "passed") r.passed++
      }
      return acc
    }, new Map<string, { passed: number; total: number }>())
  )
    .filter(([, v]) => v.total > 0)
    .map(([name, v]) => ({ name, rate: Math.round(v.passed / v.total * 100), total: v.total }))

  // 就活開始日からの経過日数
  const firstApplied = companies
    .filter((c) => c.appliedAt)
    .sort((a, b) => new Date(a.appliedAt!).getTime() - new Date(b.appliedAt!).getTime())[0]?.appliedAt
  const daysSinceStart = firstApplied
    ? Math.floor((Date.now() - new Date(firstApplied).getTime()) / (1000 * 60 * 60 * 24))
    : null

  // ケースカテゴリー分布
  const caseCategoryData = Array.from(
    cases.reduce((acc, c) => {
      const key = c.category ?? "未分類"
      acc.set(key, (acc.get(key) ?? 0) + 1)
      return acc
    }, new Map<string, number>())
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6)

  // ケース弱点カテゴリ（低評価の多いカテゴリ）
  const caseWeakCategories = useMemo(() => {
    const catRatings = new Map<string, number[]>()
    cases.filter((c) => c.category && c.rating).forEach((c) => {
      const key = c.category!
      if (!catRatings.has(key)) catRatings.set(key, [])
      catRatings.get(key)!.push(c.rating ?? 0)
    })
    return Array.from(catRatings.entries())
      .map(([name, ratings]) => ({
        name,
        avgRating: ratings.reduce((s, r) => s + r, 0) / ratings.length,
        count: ratings.length,
      }))
      .filter((c) => c.count >= 2 && c.avgRating < 3.5)
      .sort((a, b) => a.avgRating - b.avgRating)
      .slice(0, 4)
  }, [cases])

  // 面接自己評価分布
  const ratingDistribution = [1, 2, 3, 4, 5].map((r) => ({
    rating: r,
    count: interviews.filter((i) => i.rating === r).length,
  }))

  // 面接種別分布
  const interviewTypeData = Array.from(
    interviews.reduce((acc, i) => {
      acc.set(i.type, (acc.get(i.type) ?? 0) + 1)
      return acc
    }, new Map<string, number>())
  ).map(([name, value]) => ({ name, value }))

  const kpis = [
    { label: "応募企業総数", value: companies.length, color: "text-blue-500" },
    { label: "アクティブ企業", value: activeCompanies.length, color: "text-emerald-500" },
    { label: "面接通過率", value: interviewPassRate !== null ? `${interviewPassRate}%` : "-", color: "text-amber-500" },
    { label: "面接平均評価", value: avgInterviewRating ? `★${avgInterviewRating}` : "-", color: "text-amber-500" },
    { label: "タスク完了率", value: taskCompletionRate !== null ? `${taskCompletionRate}%` : "-", color: "text-violet-500" },
    { label: "ケース練習総数", value: cases.length, color: "text-emerald-500" },
    { label: "OB訪問総数", value: meetings.length, color: "text-violet-500" },
    ...(meetings.length > 0 ? [{
      label: "お礼メール送信率",
      value: `${Math.round(meetings.filter((m) => m.thankYouSent).length / meetings.length * 100)}%`,
      color: meetings.filter((m) => m.thankYouSent).length === meetings.length ? "text-emerald-500" : "text-amber-500",
    }] : []),
    { label: "面接総数", value: interviews.length, color: "text-amber-500" },
    ...(daysSinceStart !== null ? [
      { label: "就活開始から", value: `${daysSinceStart}日`, color: "text-primary" },
    ] : []),
    ...(careerStats.length > 0 ? [
      { label: "インターン経験", value: `${careerStats.find((c) => c.type === "internship")?.count ?? 0}件`, color: "text-blue-500" },
    ] : []),
    ...(busiestDayName ? [
      { label: "最活発な曜日", value: busiestDayName, color: "text-teal-500" },
    ] : []),
    ...(esStats ? [
      { label: "ES設問総数", value: esStats.totalQuestions, color: "text-blue-500" },
      { label: "ES回答率", value: esStats.totalQuestions > 0 ? `${Math.round(esStats.answeredQuestions / esStats.totalQuestions * 100)}%` : "-", color: "text-blue-500" },
    ] : []),
    ...((() => {
      const caseMins = cases.filter((c) => c.duration).reduce((s, c) => s + (c.duration ?? 0), 0)
      const interviewMins = interviews.filter((i) => i.duration).reduce((s, i) => s + (i.duration ?? 0), 0)
      const meetingMins = meetings.filter((m) => m.duration).reduce((s, m) => s + (m.duration ?? 0), 0)
      const totalMins = caseMins + interviewMins + meetingMins
      if (totalMins === 0) return []
      const hours = Math.floor(totalMins / 60)
      const mins = totalMins % 60
      return [{ label: "総活動時間", value: hours > 0 ? `${hours}時間${mins > 0 ? mins + "分" : ""}` : `${mins}分`, color: "text-teal-500" }]
    })()),
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">就活統計</h1>
          <p className="text-sm text-muted-foreground">就活全体の進捗とパフォーマンス</p>
        </div>
        <div className="flex items-center gap-2">
          <AiStatsAnalysisButton
            companies={companies}
            interviews={interviews}
            cases={cases}
            interviewPassRate={interviewPassRate}
          />
          <Button variant="ghost" size="sm" onClick={() => window.print()} className="gap-1.5 text-muted-foreground">
            <Printer className="h-3.5 w-3.5" />
            印刷
          </Button>
          <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}>
            ダッシュボードへ
          </Link>
        </div>
      </div>

      {/* 就活進捗サマリー */}
      {(companies.length > 0 || interviews.length > 0) && (
        <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground leading-relaxed">
          {daysSinceStart !== null && (
            <span>就活開始から<span className="font-bold text-foreground"> {daysSinceStart}日</span>が経過。</span>
          )}
          {companies.length > 0 && (
            <span> <span className="font-bold text-foreground">{companies.length}社</span>に応募し、アクティブな企業は<span className="font-bold text-foreground"> {activeCompanies.length}社</span>。</span>
          )}
          {interviewPassRate !== null && (
            <span> 面接通過率は<span className={`font-bold ${interviewPassRate >= 50 ? "text-emerald-600" : "text-amber-600"}`}> {interviewPassRate}%</span>で、</span>
          )}
          {avgInterviewRating && (
            <span>平均面接評価は<span className="font-bold text-amber-500"> ★{avgInterviewRating}</span>。</span>
          )}
          {cases.length > 0 && (
            <span> ケース練習<span className="font-bold text-foreground"> {cases.length}回</span>完了。</span>
          )}
          {meetings.length > 0 && (
            <span> OB訪問<span className="font-bold text-foreground"> {meetings.length}件</span>実施。</span>
          )}
        </div>
      )}

      {/* KPIカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(({ label, value, color }) => (
          <div key={label} className="border rounded-xl p-3 text-center">
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* 活動ヒートマップ (90日間) */}
      {(interviews.length > 0 || cases.length > 0 || meetings.length > 0) && (() => {
        const today = new Date()
        const days: { date: string; count: number }[] = []
        for (let i = 89; i >= 0; i--) {
          const d = new Date(today)
          d.setDate(d.getDate() - i)
          const key = d.toISOString().split("T")[0]
          const count =
            interviews.filter((x) => new Date(x.conductedAt).toISOString().split("T")[0] === key).length +
            cases.filter((x) => new Date(x.createdAt).toISOString().split("T")[0] === key).length +
            meetings.filter((x) => new Date(x.conductedAt).toISOString().split("T")[0] === key).length
          days.push({ date: key, count })
        }
        const maxCount = Math.max(...days.map((d) => d.count), 1)
        return (
          <div className="border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">直近90日の活動</p>
              <span className="text-xs text-muted-foreground">面接・ケース・OB訪問</span>
            </div>
            <div className="flex flex-wrap gap-0.5">
              {days.map((d) => (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.count}件`}
                  className="h-3 w-3 rounded-sm"
                  style={{
                    backgroundColor: d.count === 0
                      ? "hsl(var(--muted))"
                      : `hsl(142 71% ${Math.max(20, 65 - (d.count / maxCount) * 45)}%)`,
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">少ない</span>
              {[0, 0.25, 0.5, 0.75, 1].map((level, i) => (
                <div
                  key={i}
                  className="h-3 w-3 rounded-sm"
                  style={{
                    backgroundColor: level === 0
                      ? "hsl(var(--muted))"
                      : `hsl(142 71% ${Math.max(20, 65 - level * 45)}%)`,
                  }}
                />
              ))}
              <span className="text-xs text-muted-foreground">多い</span>
            </div>
          </div>
        )
      })()}

      {/* 選考コンバージョンファネル */}
      {companies.length >= 3 && (() => {
        const stages = [
          { label: "応募", status: "applied", color: "bg-slate-500" },
          { label: "ES選考", status: "screening", color: "bg-blue-500" },
          { label: "面接", status: "interview", color: "bg-amber-500" },
          { label: "インターン", status: "internship", color: "bg-cyan-500" },
          { label: "ケース/最終", statuses: ["case", "final"], color: "bg-orange-500" },
          { label: "内定", statuses: ["offer", "accepted"], color: "bg-emerald-500" },
        ]
        const getStageStatuses = (s: typeof stages[0]) => {
          if ("statuses" in s) return (s as { statuses: string[] }).statuses
          return [(s as { status: string }).status]
        }
        const counts = stages.map((_, idx) => {
          const remainingStages = stages.slice(idx)
          return companies.filter((c) =>
            remainingStages.some((later) => getStageStatuses(later).includes(c.status))
          ).length
        })
        const maxCount = counts[0] || 1
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">選考コンバージョン</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {stages.map((stage, i) => {
                  const count = counts[i]
                  const convRate = i > 0 && counts[i - 1] > 0 ? Math.round((count / counts[i - 1]) * 100) : null
                  const stageStatuses = "statuses" in stage ? (stage as { statuses: string[] }).statuses : [(stage as { status: string }).status]
                  const href = `/companies?status=${stageStatuses[0]}`
                  return (
                    <a key={stage.label} href={href} className="flex items-center gap-2 group">
                      <span className="text-xs text-muted-foreground w-20 shrink-0 group-hover:text-primary transition-colors">{stage.label}</span>
                      <div className="flex-1 bg-muted rounded-full h-5 relative overflow-hidden cursor-pointer">
                        <div
                          className={`h-5 rounded-full transition-all ${stage.color}`}
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-start pl-2 text-[10px] font-medium text-white mix-blend-normal">
                          {count}社
                        </span>
                      </div>
                      {convRate !== null && (
                        <span className={`text-[10px] w-10 text-right ${convRate >= 50 ? "text-emerald-600" : convRate >= 30 ? "text-amber-600" : "text-red-500"}`}>
                          {convRate}%
                        </span>
                      )}
                    </a>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ステータス分布 */}
        {statusData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">選考ステータス分布</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={statusData} margin={{ left: -20, right: 4, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 業界分布 */}
        {industryData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">業界別応募数</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={industryData} layout="vertical" margin={{ left: 4, right: 4, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={Math.min(120, Math.max(60, Math.max(...industryData.map((d) => d.name.length)) * 7))} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 月別活動推移（面接+ケース統合） */}
        {combinedMonthlyActivity.length > 1 && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-3">
                月別活動推移
                <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 inline-block"></span>面接</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-violet-500 inline-block"></span>ケース</span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={combinedMonthlyActivity} margin={{ left: -20, right: 4, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="interviews" name="面接" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="cases" name="ケース練習" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        {/* 面接評価分布 */}
        {interviews.filter((i) => i.rating).length >= 3 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">面接自己評価分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {ratingDistribution.map(({ rating, count }) => {
                  const max = Math.max(...ratingDistribution.map((r) => r.count), 1)
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-xs text-amber-500 w-12 shrink-0">{"★".repeat(rating)}</span>
                      <div className="flex-1 bg-muted rounded-full h-3 relative overflow-hidden">
                        <div
                          className="h-3 rounded-full bg-amber-400 transition-all"
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ケース評価トレンド */}
        {applicationsByMonth.length >= 2 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">月別応募数</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={applicationsByMonth} margin={{ left: -20, right: 4, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value}社`, "応募数"]} />
                  <Bar dataKey="value" fill="#64748b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {monthlyRatingTrend.length >= 2 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">ケース評価の推移</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthlyRatingTrend} margin={{ left: -20, right: 4, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 5]} allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value}/5`, "平均評価"]} />
                  <Line type="monotone" dataKey="avg" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 面接種別通過率 */}
        {interviewPassRateByType.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">面接種別通過率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {interviewPassRateByType.map(({ name, rate, total }) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-28 truncate">{name}</span>
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div
                        className={cn("h-1.5 rounded-full", rate >= 60 ? "bg-emerald-500" : rate >= 40 ? "bg-amber-500" : "bg-red-400")}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">{rate}% ({total}件)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ケースカテゴリー */}
        {caseCategoryData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">ケース練習カテゴリー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {caseCategoryData.map(({ name, value }) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-28 truncate">{name}</span>
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div
                        className="bg-violet-500 h-1.5 rounded-full"
                        style={{ width: `${(value / Math.max(...caseCategoryData.map((c) => c.value))) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-4 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 面接種別 */}
        {interviewTypeData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">面接種別内訳</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {interviewTypeData.map(({ name, value }) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-28 truncate">{name}</span>
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full"
                        style={{ width: `${(value / Math.max(...interviewTypeData.map((i) => i.value))) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-4 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ケース弱点分析 */}
      {caseWeakCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              🎯 ケース弱点カテゴリ (要練習)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {caseWeakCategories.map(({ name, avgRating, count }) => (
                <a
                  key={name}
                  href={`/cases?category=${encodeURIComponent(name)}`}
                  className="flex items-center gap-3 group hover:bg-muted/30 rounded-lg px-1 transition-colors"
                >
                  <span className="text-xs text-muted-foreground w-32 truncate group-hover:text-primary transition-colors">{name}</span>
                  <div className="flex-1 bg-muted rounded-full h-1.5">
                    <div
                      className="bg-red-400 h-1.5 rounded-full"
                      style={{ width: `${(avgRating / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-24 text-right">
                    ★{avgRating.toFixed(1)} ({count}件)
                  </span>
                </a>
              ))}
              <p className="text-[10px] text-muted-foreground mt-2">平均評価3.5未満・2件以上のカテゴリを表示</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* データ根拠のアクション提案 */}
      {companies.length > 0 && (() => {
        const actions: { icon: string; text: string; href: string; priority: "high" | "medium" }[] = []
        const activeCompanies = companies.filter(c => !c.archivedAt)
        const interviewCompanies = activeCompanies.filter(c => ["interview", "internship", "case", "final"].includes(c.status))

        // ケース練習が少ない
        if (interviewCompanies.length > 0 && cases.length < interviewCompanies.length * 3) {
          actions.push({ icon: "🧠", text: `面接中企業${interviewCompanies.length}社に対しケース練習が不足気味です`, href: "/cases?new=1", priority: "high" })
        }
        // 面接通過率が低い
        if (interviewPassRate !== null && interviewPassRate < 40 && interviews.length >= 3) {
          actions.push({ icon: "💬", text: `面接通過率${interviewPassRate}%は改善余地があります。フィードバックを見直しましょう`, href: "/interviews", priority: "high" })
        }
        // OB訪問数が少ない
        if (interviewCompanies.length > 0 && meetings.length < interviewCompanies.length) {
          actions.push({ icon: "🤝", text: `面接中企業のOB訪問を増やすと情報収集と志望度向上に有効です`, href: "/meetings?new=1", priority: "medium" })
        }
        // アクティブ企業が多すぎる
        if (activeCompanies.length >= 10 && interviewCompanies.length === 0) {
          actions.push({ icon: "📭", text: "応募済み企業が多いですが面接中の企業がありません。選考フォローアップをしましょう", href: "/companies?status=applied", priority: "medium" })
        }
        // 内定がある場合は企業比較を勧める
        const acceptedCompanies = companies.filter(c => c.status === "accepted")
        if (acceptedCompanies.length > 0 && interviewCompanies.length > 0) {
          actions.push({ icon: "⚖️", text: `内定${acceptedCompanies.length}社と他選考中企業を比較して承諾判断を進めましょう`, href: "/companies/compare", priority: "high" })
        }
        // ESが多く未回答
        if (esStats && esStats.totalSheets > 0 && esStats.totalQuestions > 0 && esStats.answeredQuestions < esStats.totalQuestions * 0.5) {
          actions.push({ icon: "✏️", text: `ES回答率が${Math.round(esStats.answeredQuestions / esStats.totalQuestions * 100)}%です。ES記入を進めましょう`, href: "/entry-sheets", priority: "high" })
        }
        // screeningが多い（書類通過後のアクション不足）
        // 最終選考中はオファー確認を促す
        const finalCompanies = activeCompanies.filter(c => c.status === "final")
        if (finalCompanies.length > 0) {
          actions.push({ icon: "🔥", text: `最終選考中${finalCompanies.length}社のオファー・次ステップを確認しましょう`, href: "/companies?status=final", priority: "high" })
        }
        const screeningCompanies = activeCompanies.filter(c => c.status === "screening")
        if (screeningCompanies.length >= 3 && interviewCompanies.length === 0) {
          actions.push({ icon: "📋", text: `書類通過${screeningCompanies.length}社の次のステップ（WEBテスト・グループ選考）を確認しましょう`, href: "/today", priority: "high" })
        }

        if (actions.length === 0) return null
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">📊 データから見るアクション提案</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {actions.map((a, i) => (
                <a key={i} href={a.href} className={cn(
                  "flex items-start gap-2 p-2 rounded-lg hover:opacity-80 transition-opacity",
                  a.priority === "high" ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800" : "bg-muted/30"
                )}>
                  <span>{a.icon}</span>
                  <span className="text-xs">{a.text}</span>
                </a>
              ))}
            </CardContent>
          </Card>
        )
      })()}

      {/* 活動カレンダー */}
      {activityData.some((d) => d.count > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">活動カレンダー (直近90日)</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityHeatmap activityData={activityData} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ActivityHeatmap({ activityData }: { activityData: { date: string; count: number }[] }) {
  const dayLabels = ["日", "月", "火", "水", "木", "金", "土"]
  const totalActive = activityData.filter((d) => d.count > 0).length
  const maxCount = Math.max(...activityData.map((d) => d.count), 1)

  // activityData を週単位に整理 (各週 0=日 〜 6=土)
  // まず最初のデータポイントの曜日を求めて、週ごとに並べる
  const firstDate = new Date(activityData[0]?.date ?? new Date().toISOString())
  const firstDow = firstDate.getDay() // 0=日
  // 先頭を0埋めして週の頭(日)から始める
  const padded = Array(firstDow).fill(null).concat(activityData)
  const weeks: ({ date: string; count: number } | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7))
  }
  // 最後の週を7マス補完
  const lastWeek = weeks[weeks.length - 1]
  while (lastWeek && lastWeek.length < 7) lastWeek.push(null)

  const getColor = (count: number) => {
    if (count === 0) return "bg-muted/40"
    const ratio = count / maxCount
    if (ratio < 0.25) return "bg-emerald-200 dark:bg-emerald-800"
    if (ratio < 0.5) return "bg-emerald-300 dark:bg-emerald-700"
    if (ratio < 0.75) return "bg-emerald-500 dark:bg-emerald-500"
    return "bg-emerald-600 dark:bg-emerald-400"
  }

  // 月ラベル (各週の最初のセルが月初めなら表示)
  const monthLabels: { weekIdx: number; label: string }[] = []
  weeks.forEach((week, wi) => {
    const firstCell = week.find((d) => d !== null)
    if (firstCell) {
      const d = new Date(firstCell.date)
      if (d.getDate() <= 7) {
        monthLabels.push({ weekIdx: wi, label: `${d.getMonth() + 1}月` })
      }
    }
  })

  return (
    <div className="space-y-1">
      {/* 月ラベル */}
      <div className="flex gap-0.5 ml-5">
        {weeks.map((_, wi) => {
          const ml = monthLabels.find((m) => m.weekIdx === wi)
          return (
            <div key={wi} className="w-3 shrink-0 text-[8px] text-muted-foreground/60 truncate">
              {ml?.label ?? ""}
            </div>
          )
        })}
      </div>
      {/* グリッド本体 */}
      <div className="flex gap-1">
        {/* 曜日ラベル */}
        <div className="flex flex-col gap-0.5 mr-0.5">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-3 text-[8px] text-muted-foreground/50 leading-3 w-4 text-right">
              {i % 2 === 1 ? label : ""}
            </div>
          ))}
        </div>
        {/* 週ごとのカラム */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day, di) => (
              <div
                key={di}
                title={day ? `${day.date}: ${day.count}件` : ""}
                className={cn(
                  "h-3 w-3 rounded-sm transition-colors",
                  day === null ? "bg-transparent" : getColor(day.count)
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
        <span>少ない</span>
        <div className="flex gap-0.5">
          {["bg-muted/40", "bg-emerald-200 dark:bg-emerald-800", "bg-emerald-400 dark:bg-emerald-600", "bg-emerald-600 dark:bg-emerald-400"].map((c) => (
            <div key={c} className={`h-3 w-3 rounded-sm ${c}`} />
          ))}
        </div>
        <span>多い</span>
        <span className="ml-auto">{totalActive}日間 活動</span>
      </div>
    </div>
  )
}

function AiStatsAnalysisButton({
  companies, interviews, cases, interviewPassRate,
}: {
  companies: StatsPageClientProps["companies"]
  interviews: StatsPageClientProps["interviews"]
  cases: StatsPageClientProps["cases"]
  interviewPassRate: number | null
}) {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (analysis) { setAnalysis(null); return }
    setLoading(true)
    try {
      const activeCompanies = companies.filter((c) => !c.archivedAt)
      const text = [
        `応募企業総数: ${companies.length}社（アクティブ: ${activeCompanies.length}社）`,
        `面接通過率: ${interviewPassRate !== null ? interviewPassRate + "%" : "データなし"}`,
        `面接総数: ${interviews.length}件`,
        `ケース練習: ${cases.length}回`,
        `通過企業: ${companies.filter((c) => ["offer", "accepted", "final"].includes(c.status)).length}社`,
        `落選企業: ${companies.filter((c) => ["rejected", "withdrawn"].includes(c.status)).length}社`,
      ].join("\n")
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "selection_analysis", text }),
      })
      if (res.ok) {
        const data = await res.json()
        setAnalysis(data.summary)
      }
    } finally {
      setLoading(false)
    }
  }

  if (companies.length === 0) return null

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleAnalyze}
        disabled={loading}
        className="gap-1.5 text-muted-foreground"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {loading ? "分析中..." : analysis ? "閉じる" : "AI分析"}
      </Button>
      {analysis && (
        <div className="mt-3 p-3 rounded-xl border border-primary/20 bg-primary/5 text-sm whitespace-pre-wrap">
          {analysis}
        </div>
      )}
    </div>
  )
}
