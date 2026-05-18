"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { X, Plus, Printer, Download, Sparkles } from "lucide-react"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CompanyStatusBadge } from "@/components/common/status-badge"
import { PriorityStars } from "@/components/common/priority-stars"
import { formatDate } from "@/lib/utils/date"
import type { Company, Stage, CompanyStatus } from "@/types"
import { cn } from "@/lib/utils"

type CompanyWithStages = Company & {
  stages: Stage[]
  _count?: { interviewLogs: number; tasks: number; entrySheets: number }
}

interface ComparePageClientProps {
  companies: CompanyWithStages[]
}

const MAX_COMPARE = 4

export function ComparePageClient({ companies }: ComparePageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlIds = searchParams.get("ids")?.split(",").filter(Boolean) ?? []
  const [selectedIds, setSelectedIds] = useState<string[]>(
    urlIds.length > 0
      ? urlIds.filter((id) => companies.some((c) => c.id === id))
      : companies.slice(0, 3).map((c) => c.id)
  )

  const updateUrl = (ids: string[]) => {
    const p = new URLSearchParams()
    if (ids.length > 0) p.set("ids", ids.join(","))
    router.replace(`/companies/compare${ids.length > 0 ? "?" + p.toString() : ""}`, { scroll: false })
  }

  const selected = selectedIds
    .map((id) => companies.find((c) => c.id === id))
    .filter(Boolean) as CompanyWithStages[]

  const addCompare = (id: string) => {
    if (selectedIds.includes(id) || selectedIds.length >= MAX_COMPARE) return
    const next = [...selectedIds, id]
    setSelectedIds(next)
    updateUrl(next)
  }

  const removeCompare = (id: string) => {
    const next = selectedIds.filter((i) => i !== id)
    setSelectedIds(next)
    updateUrl(next)
  }

  const availableToAdd = companies.filter((c) => !selectedIds.includes(c.id))

  // 総合スコア (優先度5点×20% + ステージ進捗×30% + アクティブ×50%)
  const computeScore = (c: CompanyWithStages) => {
    const priorityScore = c.priority * 20
    const passedStages = c.stages.filter((s) => s.status === "passed").length
    const totalStages = c.stages.length || 1
    const stageScore = Math.round((passedStages / totalStages) * 100)
    const statusScore = ["interview", "internship", "case", "final", "offer"].includes(c.status) ? 100
      : ["screening"].includes(c.status) ? 60
      : c.status === "applied" ? 30 : 20
    return Math.round(priorityScore * 0.2 + stageScore * 0.3 + statusScore * 0.5)
  }

  const rows = [
    {
      label: "総合スコア",
      render: (c: CompanyWithStages) => {
        const score = computeScore(c)
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-zinc-400"}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className={`text-sm font-bold ${score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-600" : "text-zinc-500"}`}>{score}</span>
          </div>
        )
      }
    },
    { label: "ステータス", render: (c: CompanyWithStages) => <CompanyStatusBadge status={c.status as CompanyStatus} /> },
    { label: "優先度", render: (c: CompanyWithStages) => <PriorityStars priority={c.priority} /> },
    { label: "業界", render: (c: CompanyWithStages) => <span className="text-sm">{c.industry || "-"}</span> },
    { label: "職種", render: (c: CompanyWithStages) => <span className="text-sm">{c.position || "-"}</span> },
    { label: "勤務地", render: (c: CompanyWithStages) => <span className="text-sm">{c.location || "-"}</span> },
    { label: "規模", render: (c: CompanyWithStages) => <span className="text-sm">{c.size || "-"}</span> },
    { label: "応募日", render: (c: CompanyWithStages) => <span className="text-sm">{formatDate(c.appliedAt)}</span> },
    {
      label: "選考ステージ",
      render: (c: CompanyWithStages) => (
        <div className="text-xs space-y-0.5">
          {c.stages.length === 0 ? (
            <span className="text-muted-foreground">未設定</span>
          ) : (
            c.stages.map((s) => (
              <div key={s.id} className="flex items-center gap-1">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  s.status === "passed" ? "bg-emerald-500" :
                  s.status === "failed" ? "bg-red-500" :
                  s.status === "scheduled" ? "bg-blue-500" : "bg-zinc-300"
                )} />
                {s.name}
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      label: "面接数",
      render: (c: CompanyWithStages) => (
        <span className="text-sm">{c._count?.interviewLogs ?? "-"}回</span>
      ),
    },
    {
      label: "タスク数",
      render: (c: CompanyWithStages) => (
        <span className="text-sm">{c._count?.tasks ?? "-"}件</span>
      ),
    },
    {
      label: "ES数",
      render: (c: CompanyWithStages) => (
        <span className="text-sm">{c._count?.entrySheets ?? "-"}枚</span>
      ),
    },
    {
      label: "最終更新",
      render: (c: CompanyWithStages) => (
        <span className="text-xs text-muted-foreground">{formatDate(c.updatedAt)}</span>
      ),
    },
    {
      label: "メモ",
      render: (c: CompanyWithStages) => (
        <p className="text-xs text-muted-foreground line-clamp-3">{c.notes || "-"}</p>
      ),
    },
  ]

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">企業比較</h1>
          <p className="text-sm text-muted-foreground">最大4社を並べて比較できます</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.length >= 2 && (
            <AiCompareButton companies={selected} computeScore={computeScore} />
          )}
          {selected.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => {
                  const headers = ["項目", ...selected.map((c) => c.name)]
                  const dataRows = rows.map((row) => [
                    row.label,
                    ...selected.map((c) => {
                      const rendered = row.render(c)
                      if (typeof rendered === "string" || typeof rendered === "number") return String(rendered)
                      return ""
                    }),
                  ])
                  const csv = [headers, ...dataRows]
                    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
                    .join("\n")
                  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url; a.download = `compare-${new Date().toISOString().split("T")[0]}.csv`; a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.print()} className="gap-1.5 text-muted-foreground">
                <Printer className="h-3.5 w-3.5" />
                印刷
              </Button>
            </>
          )}
        {availableToAdd.length > 0 && selected.length < MAX_COMPARE && (
          <Select onValueChange={(v: string | null) => { if (v) addCompare(v) }}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder="企業を追加..." />
            </SelectTrigger>
            <SelectContent>
              {availableToAdd.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        </div>
      </div>

      {selected.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>比較する企業を選択してください</p>
        </div>
      ) : (
        <>
        {selected.length >= 2 && (() => {
          const COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ef4444"]
          const radarData = [
            { subject: "優先度", ...Object.fromEntries(selected.map((c, i) => [c.name, c.priority * 20])) },
            {
              subject: "進捗",
              ...Object.fromEntries(selected.map((c, i) => {
                const p = c.stages.filter((s) => s.status === "passed").length
                const t = c.stages.length || 1
                return [c.name, Math.round((p / t) * 100)]
              }))
            },
            {
              subject: "選考段階",
              ...Object.fromEntries(selected.map((c) => {
                const score = ["interview", "internship", "case", "final", "offer", "accepted"].includes(c.status) ? 100
                  : ["screening"].includes(c.status) ? 60
                  : c.status === "applied" ? 30 : 20
                return [c.name, score]
              }))
            },
            { subject: "総合スコア", ...Object.fromEntries(selected.map((c) => [c.name, computeScore(c)])) },
            {
              subject: "面接数",
              ...Object.fromEntries(selected.map((c) => [c.name, Math.min(100, (c._count?.interviewLogs ?? 0) * 20)]))
            },
          ]
          return (
            <div className="border rounded-xl p-4 bg-muted/20">
              <p className="text-xs font-medium text-muted-foreground mb-3">レーダーチャート比較</p>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  {selected.map((c, i) => (
                    <Radar key={c.id} name={c.name} dataKey={c.name} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} />
                  ))}
                  <Legend iconSize={8} />
                  <Tooltip formatter={(value) => `${value}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )
        })()}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 text-sm text-muted-foreground w-28 shrink-0">項目</th>
                {selected.map((company) => (
                  <th key={company.id} className="p-2 min-w-[160px]">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        {selected.length > 1 && computeScore(company) === Math.max(...selected.map(computeScore)) && (
                          <span className="text-amber-500 text-xs" title="最高スコア">👑</span>
                        )}
                        <span className="text-sm font-semibold">{company.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeCompare(company.id)}
                        className="h-5 w-5 shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t">
                  <td className="p-2 text-xs text-muted-foreground font-medium align-top pt-3">
                    {row.label}
                  </td>
                  {selected.map((company) => (
                    <td key={company.id} className="p-2 align-top pt-3">
                      {row.render(company)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  )
}

function AiCompareButton({ companies, computeScore }: { companies: CompanyWithStages[]; computeScore: (c: CompanyWithStages) => number }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (result) { setResult(null); return }
    setLoading(true)
    try {
      const text = companies.map((c) => {
        const score = computeScore(c)
        return [
          `【${c.name}】`,
          `ステータス: ${c.status}`,
          `優先度: ${"★".repeat(c.priority)}`,
          `業界: ${c.industry ?? "未設定"}`,
          `職種: ${c.position ?? "未設定"}`,
          `総合スコア: ${score}/100`,
          `面接数: ${c._count?.interviewLogs ?? 0}回`,
          c.notes ? `メモ: ${c.notes.slice(0, 100)}` : "",
        ].filter(Boolean).join("\n")
      }).join("\n\n")

      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type: "selection_analysis" }),
      })
      if (res.ok) {
        const { summary } = await res.json()
        setResult(summary)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={loading} className="gap-1.5">
        <Sparkles className="h-3.5 w-3.5" />
        {loading ? "分析中..." : result ? "AI分析を閉じる" : "AI推薦分析"}
      </Button>
      {result && (
        <div className="border border-primary/20 rounded-xl p-4 bg-primary/5 text-sm whitespace-pre-wrap">
          {result}
        </div>
      )}
    </div>
  )
}
