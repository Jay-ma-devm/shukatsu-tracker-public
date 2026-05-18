"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Plus, Milestone, Pencil, Trash2, ExternalLink, Download, Printer, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { CareerFormModal } from "./career-form-modal"
import { CAREER_ENTRY_TYPES } from "@/lib/constants"
import type { CareerEntry } from "@/types"
import { cn } from "@/lib/utils"

interface CareerPageClientProps {
  initialEntries: CareerEntry[]
}

const TYPE_COLORS: Record<string, string> = {
  internship: "bg-blue-100 text-blue-700 border-blue-200",
  event: "bg-violet-100 text-violet-700 border-violet-200",
  milestone: "bg-emerald-100 text-emerald-700 border-emerald-200",
  achievement: "bg-amber-100 text-amber-700 border-amber-200",
}

export function CareerPageClient({ initialEntries }: CareerPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [entries, setEntries] = useState(initialEntries)
  const [showCreate, setShowCreate] = useState(false)
  const [editingEntry, setEditingEntry] = useState<CareerEntry | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") ?? "all")
  const [search, setSearch] = useState(searchParams.get("q") ?? "")
  const [showAiAnalysis, setShowAiAnalysis] = useState(false)
  const [selfPr, setSelfPr] = useState<string | null>(null)
  const [selfPrLoading, setSelfPrLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowCreate(true)
      router.replace("/career", { scroll: false })
    }
  }, [searchParams, router])

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return e.title.toLowerCase().includes(q) || (e.organization ?? "").toLowerCase().includes(q)
      }
      return true
    })
  }, [entries, typeFilter, search])

  // スキル集計
  const allSkills = useMemo(() => {
    const skillMap = new Map<string, number>()
    entries.forEach((e) => {
      if (e.skills) {
        e.skills.split(",").map((s) => s.trim()).filter(Boolean).forEach((skill) => {
          skillMap.set(skill, (skillMap.get(skill) ?? 0) + 1)
        })
      }
    })
    return Array.from(skillMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12)
  }, [entries])

  const handleDelete = async () => {
    if (!deletingId) return
    const res = await fetch(`/api/career/${deletingId}`, { method: "DELETE" })
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== deletingId))
      toast.success("エントリーを削除しました")
    }
    setDeletingId(null)
  }

  const handleExportCSV = () => {
    const headers = ["タイトル", "種別", "組織", "役割", "開始日", "終了日", "説明", "学び・成果", "スキル", "URL"]
    const rows = filteredEntries.map((e) => {
      const typeConfig = CAREER_ENTRY_TYPES.find((t) => t.value === e.type)
      return [
        e.title,
        typeConfig?.label ?? e.type,
        e.organization ?? "",
        e.role ?? "",
        format(new Date(e.startAt), "yyyy年M月", { locale: ja }),
        e.endAt ? format(new Date(e.endAt), "yyyy年M月", { locale: ja }) : "現在",
        e.description ?? "",
        e.takeaways ?? "",
        e.skills ?? "",
        e.url ?? "",
      ]
    })
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `career-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${filteredEntries.length}件をCSVでエクスポートしました`)
  }

  // 年度別グループ化（年内は月降順ソート）
  const grouped = filteredEntries.reduce((acc, entry) => {
    const year = new Date(entry.startAt).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(entry)
    return acc
  }, {} as Record<number, CareerEntry[]>)

  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a)
  years.forEach((year) => {
    grouped[year].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
  })

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">キャリア軌跡</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>計{entries.length}件</span>
              {CAREER_ENTRY_TYPES.filter((t) => entries.some((e) => e.type === t.value)).map((t) => (
                <span key={t.value}>{t.label}: {entries.filter((e) => e.type === t.value).length}</span>
              ))}
              {years.length > 1 && (
                <span>{years[years.length - 1]}〜{years[0]}年</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {filteredEntries.length > 0 && (
              <>
                <Button variant="ghost" size="sm" onClick={() => window.print()} className="gap-1.5 text-muted-foreground">
                  <Printer className="h-3.5 w-3.5" />
                  印刷
                </Button>
                <Button variant="ghost" size="sm" onClick={handleExportCSV} className="gap-1.5 text-muted-foreground">
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </Button>
              </>
            )}
            {entries.length > 2 && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs"
                onClick={() => setShowAiAnalysis((v) => !v)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI強み分析
              </Button>
            )}
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-3.5 w-3.5" />
              エントリーを追加
            </Button>
          </div>
        </div>
        {showAiAnalysis && entries.length > 2 && (
          <AiStrengthAnalysisPanel entries={entries} skills={allSkills.map(([s]) => s)} onClose={() => setShowAiAnalysis(false)} />
        )}
      </div>

      {allSkills.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">スキル・経験</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(allSkills.map(([s]) => s).join("、"))
                toast("スキル一覧をコピーしました", { duration: 2000 })
              }}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              コピー
            </button>
            <button
              onClick={async () => {
                if (selfPr) { setSelfPr(null); return }
                const text = [
                  "スキル・経験: " + allSkills.slice(0, 10).map(([s]) => s).join("、"),
                  "",
                  ...entries.slice(0, 7).map((e) => [
                    `[${e.type}] ${e.title} at ${e.organization ?? "不明"}`,
                    e.role ? `役割: ${e.role}` : "",
                    e.takeaways ? `学び・成果: ${e.takeaways}` : "",
                  ].filter(Boolean).join("\n")),
                ].join("\n\n")
                setSelfPrLoading(true)
                try {
                  const res = await fetch("/api/ai/summarize", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text, type: "self_pr" }),
                  })
                  if (res.ok) setSelfPr((await res.json()).summary)
                } finally { setSelfPrLoading(false) }
              }}
              disabled={selfPrLoading || allSkills.length === 0}
              className="text-[10px] text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
            >
              {selfPrLoading ? "⏳" : selfPr ? "✕ 閉じる" : "✨ AI自己PR生成"}
            </button>
          </div>
          {selfPr && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-sm whitespace-pre-wrap">
              {selfPr}
              <div className="flex gap-2 mt-2">
                <button onClick={() => { navigator.clipboard.writeText(selfPr); toast("コピーしました") }} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">コピー</button>
                <button onClick={() => setSelfPr(null)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">閉じる</button>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {allSkills.map(([skill, count]) => (
              <button
                key={skill}
                onClick={() => {
                  setSearch(skill)
                  const p = new URLSearchParams(searchParams.toString())
                  p.set("q", skill)
                  router.replace(`/career?${p.toString()}`, { scroll: false })
                }}
                className="text-xs bg-muted hover:bg-muted/80 px-2 py-0.5 rounded-full text-muted-foreground transition-colors"
                title={`${count}件のエントリーで使用`}
              >
                {skill}{count > 1 && <span className="ml-0.5 text-primary font-medium">×{count}</span>}
              </button>
            ))}
          </div>
          {allSkills.length >= 3 && (() => {
            const maxCount = Math.max(...allSkills.map(([, c]) => c))
            return (
              <div className="space-y-1 mt-2">
                {allSkills.slice(0, 6).map(([skill, count]) => (
                  <div key={skill} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground w-24 truncate text-right">{skill}</span>
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground w-4 text-center">{count}</span>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          placeholder="タイトル・組織で検索..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            const p = new URLSearchParams(searchParams.toString())
            if (e.target.value) p.set("q", e.target.value)
            else p.delete("q")
            router.replace(`/career?${p.toString()}`, { scroll: false })
          }}
          className="h-8 text-sm px-3 border rounded-lg flex-1 min-w-32 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {[{ value: "all", label: "すべて" }, ...CAREER_ENTRY_TYPES].map((type) => (
          <button
            key={type.value}
            onClick={() => {
              setTypeFilter(type.value)
              const p = new URLSearchParams(searchParams.toString())
              if (type.value !== "all") p.set("type", type.value)
              else p.delete("type")
              router.replace(`/career?${p.toString()}`, { scroll: false })
            }}
            className={cn(
              "h-8 px-3 text-xs rounded-lg border transition-colors",
              typeFilter === type.value ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
            )}
          >
            {type.label}
          </button>
        ))}
        {(search || typeFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setTypeFilter("all"); router.replace("/career", { scroll: false }) }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕ リセット
          </button>
        )}
      </div>

      {filteredEntries.length === 0 ? (
        <EmptyState
          icon={Milestone}
          title="キャリア軌跡がありません"
          description="インターン・イベント・マイルストーンを記録してアピールポイントを整理しましょう"
          action={{ label: "エントリーを追加", onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="space-y-8">
          {years.map((year) => (
            <div key={year}>
              <h2 className="text-lg font-bold text-muted-foreground mb-4 sticky top-0 bg-background py-1">
                {year}
              </h2>
              <div className="relative pl-6 space-y-4">
                {/* タイムラインライン */}
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />

                {grouped[year].map((entry) => {
                  const typeConfig = CAREER_ENTRY_TYPES.find((t) => t.value === entry.type)
                  const colorClass = TYPE_COLORS[entry.type] ?? "bg-zinc-100 text-zinc-700"

                  return (
                    <div key={entry.id} className="group relative">
                      {/* タイムラインドット */}
                      <div className={cn(
                        "absolute -left-[21px] top-3 h-3 w-3 rounded-full border-2 border-background",
                        entry.type === "internship" ? "bg-blue-500" :
                        entry.type === "event" ? "bg-violet-500" :
                        entry.type === "milestone" ? "bg-emerald-500" : "bg-amber-500"
                      )} />

                      <div className="border rounded-xl p-4 space-y-2 hover:shadow-sm transition-shadow bg-card">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold">{entry.title}</p>
                              <Badge variant="outline" className={cn("text-xs", colorClass)}>
                                {typeConfig?.label ?? entry.type}
                              </Badge>
                            </div>
                            {entry.organization && (
                              <p className="text-sm text-muted-foreground">{entry.organization}</p>
                            )}
                            {entry.role && (
                              <p className="text-xs text-muted-foreground">{entry.role}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {entry.url && (
                              <a href={entry.url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </a>
                            )}
                            <Button variant="ghost" size="icon-sm" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => setEditingEntry(entry)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => setDeletingId(entry.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(entry.startAt), "yyyy年M月", { locale: ja })}
                            {entry.endAt ? ` 〜 ${format(new Date(entry.endAt), "M月", { locale: ja })}` : " 〜 現在"}
                          </p>
                          {!entry.endAt && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-medium">進行中</span>
                          )}
                        </div>

                        {entry.description && (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.description}</p>
                        )}

                        {entry.takeaways && (
                          <div className="bg-muted/50 rounded-lg p-2.5">
                            <p className="text-xs font-medium text-muted-foreground mb-1">学び・成果</p>
                            <p className="text-xs whitespace-pre-wrap">{entry.takeaways}</p>
                          </div>
                        )}

                        {entry.skills && (
                          <div className="flex flex-wrap gap-1">
                            {entry.skills.split(",").map((skill) => (
                              <button
                                key={skill.trim()}
                                onClick={() => {
                                  setSearch(skill.trim())
                                  const p = new URLSearchParams(searchParams.toString())
                                  p.set("q", skill.trim())
                                  router.replace(`/career?${p.toString()}`, { scroll: false })
                                }}
                                className="text-[10px] bg-muted hover:bg-muted/80 px-1.5 py-0.5 rounded-full text-muted-foreground transition-colors"
                              >
                                {skill.trim()}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {(showCreate || editingEntry) && (
        <CareerFormModal
          open={showCreate || !!editingEntry}
          onOpenChange={(open) => {
            if (!open) { setShowCreate(false); setEditingEntry(null) }
          }}
          entry={editingEntry ?? undefined}
          onSuccess={(result) => {
            const r = result as CareerEntry
            if (editingEntry) {
              setEntries((prev) => prev.map((e) => e.id === r.id ? r : e))
            } else {
              setEntries((prev) => [r, ...prev].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()))
            }
            setShowCreate(false)
            setEditingEntry(null)
          }}
        />
      )}

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="エントリーを削除しますか？"
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}

function AiStrengthAnalysisPanel({ entries, skills, onClose }: { entries: CareerEntry[]; skills: string[]; onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<string | null>(null)

  useEffect(() => {
    const text = [
      `経験${entries.length}件・スキル: ${skills.slice(0, 10).join("、")}`,
      ...entries.slice(0, 8).map((e) => `[${e.type}] ${e.title}: ${e.takeaways ?? e.description ?? ""}`)
    ].join("\n")
    fetch("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `以下の経験を分析して、強み・弱み・就活での差別化ポイントをそれぞれ3点以内で教えてください:\n\n${text}`, type: "selection_analysis" }),
    }).then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setAnalysis(data.summary) })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-primary flex items-center gap-1"><Sparkles className="h-3 w-3" />AI強み分析</p>
        <button onClick={onClose} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">閉じる</button>
      </div>
      {loading ? (
        <p className="text-xs text-muted-foreground">分析中...</p>
      ) : (
        <p className="whitespace-pre-wrap text-xs">{analysis}</p>
      )}
    </div>
  )
}
