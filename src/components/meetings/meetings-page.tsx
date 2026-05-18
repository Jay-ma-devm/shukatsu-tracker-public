"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Plus, Users, Check, Pencil, Trash2, Mail, Download } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { MeetingFormModal } from "./meeting-form-modal"
import { MEETING_TYPES } from "@/lib/constants"
import { formatDate } from "@/lib/utils/date"
import type { Meeting } from "@/types"

type MeetingWithData = Meeting & {
  company: { id: string; name: string } | null
  contact: { id: string; name: string; role: string | null } | null
}
type CompanyOption = { id: string; name: string }

interface MeetingsPageClientProps {
  initialMeetings: MeetingWithData[]
  companies: CompanyOption[]
  activeCompanies?: { id: string; name: string; status: string }[]
}

export function MeetingsPageClient({ initialMeetings, companies, activeCompanies = [] }: MeetingsPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [meetings, setMeetings] = useState(initialMeetings)
  const [showCreate, setShowCreate] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<MeetingWithData | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [companyFilter, setCompanyFilter] = useState(searchParams.get("company") ?? "all")
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") ?? "all")
  const [sort, setSort] = useState<"newest" | "oldest" | "company">((searchParams.get("sort") as "newest" | "oldest" | "company") ?? "newest")
  const [search, setSearch] = useState(searchParams.get("q") ?? "")
  const [thankYouFilter, setThankYouFilter] = useState(searchParams.get("thankYou") === "unsent")
  const [followUpFilter, setFollowUpFilter] = useState(searchParams.get("followUp") === "1")

  const updateUrl = (params: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== "all" && v !== "" && v !== "newest") p.set(k, v)
      else p.delete(k)
    })
    router.replace(`/meetings?${p.toString()}`, { scroll: false })
  }

  const displayedMeetings = (() => {
    const f = meetings.filter((m) => {
      if (companyFilter !== "all" && m.companyId !== companyFilter) return false
      if (typeFilter !== "all" && m.type !== typeFilter) return false
      if (thankYouFilter && m.thankYouSent) return false
      if (followUpFilter && !m.followUp) return false
      if (search) {
        const q = search.toLowerCase()
        return m.title.toLowerCase().includes(q) ||
          (m.company?.name ?? "").toLowerCase().includes(q) ||
          (m.topics ?? "").toLowerCase().includes(q) ||
          (m.insights ?? "").toLowerCase().includes(q)
      }
      return true
    })
    if (sort === "oldest") return [...f].sort((a, b) => new Date(a.conductedAt).getTime() - new Date(b.conductedAt).getTime())
    if (sort === "company") return [...f].sort((a, b) => (a.company?.name ?? "").localeCompare(b.company?.name ?? "", "ja"))
    return [...f].sort((a, b) => new Date(b.conductedAt).getTime() - new Date(a.conductedAt).getTime())
  })()

  const pendingCompanyId = searchParams.get("companyId")

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowCreate(true)
      router.replace("/meetings", { scroll: false })
    }
  }, [searchParams, router])

  const handleDelete = async () => {
    if (!deletingId) return
    const res = await fetch(`/api/meetings/${deletingId}`, { method: "DELETE" })
    if (res.ok) {
      setMeetings((prev) => prev.filter((m) => m.id !== deletingId))
      toast.success("記録を削除しました")
    }
    setDeletingId(null)
  }

  const handleToggleThankYou = async (meeting: MeetingWithData) => {
    const res = await fetch(`/api/meetings/${meeting.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thankYouSent: !meeting.thankYouSent }),
    })
    if (res.ok) {
      const updated = await res.json()
      setMeetings((prev) => prev.map((m) => m.id === meeting.id ? { ...m, ...updated } : m))
    }
  }

  const thankYouSentCount = meetings.filter((m) => m.thankYouSent).length
  const uniqueCompanies = new Set(meetings.filter((m) => m.companyId).map((m) => m.companyId)).size

  const handleMarkAllThankYou = async () => {
    const unsent = meetings.filter((m) => !m.thankYouSent)
    if (unsent.length === 0) return
    await Promise.all(unsent.map((m) =>
      fetch(`/api/meetings/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thankYouSent: true }),
      })
    ))
    setMeetings((prev) => prev.map((m) => ({ ...m, thankYouSent: true })))
    toast.success(`${unsent.length}件のお礼送信済みにしました`)
  }

  const handleExportCSV = () => {
    const headers = ["タイトル", "種別", "企業", "担当者", "日時", "時間(分)", "場所", "お礼送信", "トピック", "気づき"]
    const rows = displayedMeetings.map((m) => {
      const typeConfig = MEETING_TYPES.find((t) => t.value === m.type)
      return [
        m.title,
        typeConfig?.label ?? m.type,
        m.company?.name ?? "",
        m.contact?.name ?? "",
        new Date(m.conductedAt).toLocaleDateString("ja-JP"),
        m.duration?.toString() ?? "",
        m.location ?? "",
        m.thankYouSent ? "済" : "未送信",
        m.topics ?? "",
        m.insights ?? "",
      ]
    })
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `meetings-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${displayedMeetings.length}件をCSVでエクスポートしました`)
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">OB訪問・カジュアル面談</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
            <span>計{meetings.length}件</span>
            <span>{uniqueCompanies}社</span>
            <span className={thankYouSentCount < meetings.length ? "text-amber-600 font-medium" : "text-emerald-600"}>
              お礼送信済: {thankYouSentCount}/{meetings.length}
              {meetings.length > 0 && ` (${Math.round(thankYouSentCount / meetings.length * 100)}%)`}
            </span>
            {MEETING_TYPES.filter((t) => meetings.some((m) => m.type === t.value)).map((t) => (
              <span key={t.value}>
                {t.label}: {meetings.filter((m) => m.type === t.value).length}
              </span>
            ))}
            {(() => {
              const withDuration = meetings.filter((m) => m.duration)
              if (withDuration.length === 0) return null
              const avg = Math.round(withDuration.reduce((s, m) => s + (m.duration ?? 0), 0) / withDuration.length)
              return <span>平均 {avg}分</span>
            })()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {thankYouSentCount < meetings.length && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllThankYou} className="gap-1.5 text-muted-foreground text-xs">
              <Check className="h-3.5 w-3.5" />
              一括お礼済
            </Button>
          )}
          {displayedMeetings.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleExportCSV} className="gap-1.5 text-muted-foreground">
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
          )}
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" />
            記録を追加
          </Button>
        </div>
      </div>

      {meetings.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <input
            placeholder="タイトル・企業・内容で検索..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); updateUrl({ q: e.target.value }) }}
            className="h-8 text-sm px-3 border rounded-lg w-52 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
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
          <Select value={typeFilter} onValueChange={(v: string | null) => { const val = v ?? "all"; setTypeFilter(val); updateUrl({ type: val }) }}>
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue placeholder="種別" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての種別</SelectItem>
              {MEETING_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v: string | null) => { const val = (v ?? "newest") as typeof sort; setSort(val); updateUrl({ sort: val }) }}>
            <SelectTrigger className="h-8 w-28 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">新しい順</SelectItem>
              <SelectItem value="oldest">古い順</SelectItem>
              <SelectItem value="company">企業順</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => { setThankYouFilter(!thankYouFilter); updateUrl({ thankYou: !thankYouFilter ? "unsent" : "" }) }}
            className={`text-xs h-8 px-2 rounded-md border transition-colors flex items-center gap-1 ${thankYouFilter ? "bg-amber-50 border-amber-300 text-amber-700" : "text-muted-foreground hover:text-foreground"}`}
          >
            ✉️ お礼未送信のみ
          </button>
          <button
            onClick={() => { setFollowUpFilter(!followUpFilter); updateUrl({ followUp: !followUpFilter ? "1" : "" }) }}
            className={`text-xs h-8 px-2 rounded-md border transition-colors flex items-center gap-1 ${followUpFilter ? "bg-blue-50 border-blue-300 text-blue-700" : "text-muted-foreground hover:text-foreground"}`}
          >
            📌 フォローアップあり
          </button>
          {(search || companyFilter !== "all" || typeFilter !== "all" || sort !== "newest" || thankYouFilter || followUpFilter) && (
            <button
              onClick={() => { setSearch(""); setCompanyFilter("all"); setTypeFilter("all"); setSort("newest"); setThankYouFilter(false); setFollowUpFilter(false); router.replace("/meetings", { scroll: false }) }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕ リセット
            </button>
          )}
        </div>
      )}

      {/* OB訪問未実施の選考中企業 */}
      {activeCompanies.length > 0 && (() => {
        const visitedCompanyIds = new Set(meetings.filter((m) => m.companyId).map((m) => m.companyId))
        const unvisited = activeCompanies.filter((c) => !visitedCompanyIds.has(c.id))
        if (unvisited.length === 0) return null
        return (
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-3">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1.5">💡 OB訪問未実施の選考中企業</p>
            <div className="flex flex-wrap gap-1.5">
              {unvisited.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setShowCreate(true) }}
                  className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )
      })()}

      {meetings.length === 0 ? (
        <EmptyState
          icon={Users}
          title="OB訪問の記録がありません"
          description="OB訪問やカジュアル面談の記録を残しましょう"
          action={{ label: "記録を追加", onClick: () => setShowCreate(true) }}
        />
      ) : displayedMeetings.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">該当する記録がありません</p>
      ) : (
        <div className="space-y-3">
          {displayedMeetings.map((meeting) => {
            const typeConfig = MEETING_TYPES.find((t) => t.value === meeting.type)
            const isExpanded = expandedId === meeting.id

            return (
              <Card key={meeting.id}>
                <CardContent className="p-0">
                  <div
                    className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : meeting.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{meeting.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {typeConfig?.label ?? meeting.type}
                        </Badge>
                        {!meeting.thankYouSent && (
                          <Link
                            href="/templates"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs px-1.5 py-0.5 border border-amber-300 text-amber-600 rounded-full hover:bg-amber-50 transition-colors"
                          >
                            お礼メールを送る
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {meeting.company && (
                          <Link href={`/companies/${meeting.company.id}`} className="hover:text-primary" onClick={(e) => e.stopPropagation()}>
                            {meeting.company.name}
                          </Link>
                        )}
                        {meeting.contact && <span>{meeting.contact.name}</span>}
                        <span>{formatDate(meeting.conductedAt)}</span>
                        {meeting.duration && <span>{meeting.duration}分</span>}
                        {meeting.location && <span>{meeting.location}</span>}
                      </div>
                      {!isExpanded && meeting.insights && (
                        <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">
                          💡 {meeting.insights}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7"
                        title={meeting.thankYouSent ? "お礼メール送信済み" : "お礼メール未送信"}
                        onClick={() => handleToggleThankYou(meeting)}
                      >
                        {meeting.thankYouSent ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Mail className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="h-7 w-7" onClick={() => setEditingMeeting(meeting)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeletingId(meeting.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t pt-3">
                      {meeting.topics && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">話したトピック</p>
                          <p className="text-sm whitespace-pre-wrap bg-muted/50 p-2 rounded-lg">{meeting.topics}</p>
                        </div>
                      )}
                      {meeting.insights && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">学んだこと・気づき</p>
                          <p className="text-sm whitespace-pre-wrap bg-muted/50 p-2 rounded-lg">{meeting.insights}</p>
                        </div>
                      )}
                      {meeting.followUp && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">フォローアップ</p>
                          <p className="text-sm whitespace-pre-wrap text-primary">{meeting.followUp}</p>
                        </div>
                      )}
                      {!meeting.thankYouSent && (
                        <AiThankYouButton meeting={meeting} />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {(showCreate || editingMeeting) && (
        <MeetingFormModal
          open={showCreate || !!editingMeeting}
          onOpenChange={(open) => {
            if (!open) { setShowCreate(false); setEditingMeeting(null) }
          }}
          meeting={editingMeeting ?? undefined}
          companies={companies}
          defaultCompanyId={pendingCompanyId ?? undefined}
          onSuccess={(result) => {
            const r = result as MeetingWithData
            if (editingMeeting) {
              setMeetings((prev) => prev.map((m) => m.id === r.id ? r : m))
            } else {
              setMeetings((prev) => [r, ...prev])
              // 新規作成時にノート自動作成を提案
              if (r.companyId) {
                toast.success("OB訪問を記録しました", {
                  description: "企業ノートに訪問メモを保存しますか？",
                  action: {
                    label: "ノートを作成",
                    onClick: async () => {
                      const content = `# ${r.title}\n\n## 訪問者情報\n- 氏名: ${r.contact?.name ?? ""}\n\n## 話したトピック\n${r.topics ?? ""}\n\n## 学んだこと・気づき\n${r.insights ?? ""}\n\n## フォローアップ\n${r.followUp ?? ""}\n`
                      const res = await fetch("/api/notes", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ title: `OB訪問: ${r.title}`, content, companyId: r.companyId, category: "ob_visit" }),
                      })
                      if (res.ok) {
                        const note = await res.json()
                        window.location.href = `/notes?id=${note.id}`
                      }
                    },
                  },
                  duration: 8000,
                })
              }
            }
            setShowCreate(false)
            setEditingMeeting(null)
          }}
        />
      )}

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="記録を削除しますか？"
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}

function AiThankYouButton({ meeting }: { meeting: { title: string; company: { name: string } | null; contact: { name: string } | null; insights: string | null; topics: string | null } }) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState<{ subject: string; body: string } | null>(null)

  const handleGenerate = async () => {
    const context = [
      `OB訪問タイトル: ${meeting.title}`,
      meeting.company ? `企業: ${meeting.company.name}` : "",
      meeting.contact ? `担当者: ${meeting.contact.name}` : "",
      meeting.topics ? `話したトピック: ${meeting.topics}` : "",
      meeting.insights ? `気づき: ${meeting.insights}` : "",
    ].filter(Boolean).join("\n")

    setLoading(true)
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: context, type: "thank_you_email" }),
      })
      if (res.ok) {
        const { summary } = await res.json()
        const sig = typeof window !== "undefined" ? localStorage.getItem("student-signature") ?? "" : ""
        const body = `${meeting.contact ? meeting.contact.name : "担当者"}様\n\n${summary}${sig ? "\n\n" + sig : ""}`
        setEmail({ subject: `【お礼】${meeting.company?.name ?? ""}様 OB訪問のご対応について`, body })
      }
    } finally {
      setLoading(false)
    }
  }

  if (email) {
    const fullText = `件名: ${email.subject}\n\n${email.body}`
    const mailtoLink = `mailto:${meeting.contact?.name ? "" : ""}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">AI生成お礼メール文面</p>
        <div className="bg-muted/50 p-3 rounded-lg text-xs whitespace-pre-wrap font-mono">{fullText}</div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { navigator.clipboard.writeText(fullText); toast("コピーしました") }} className="text-[10px] text-muted-foreground hover:text-foreground underline">コピー</button>
          <a href={mailtoLink} className="text-[10px] text-primary hover:text-primary/80 underline">メーラーで開く</a>
          <button onClick={() => setEmail(null)} className="text-[10px] text-muted-foreground hover:text-foreground underline">閉じる</button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="text-[10px] text-primary hover:text-primary/80 transition-colors"
    >
      {loading ? "⏳" : "✨ AIでお礼メールを生成"}
    </button>
  )
}
