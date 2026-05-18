"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Star,
  Pencil,
  Trash2,
  ExternalLink,
  Calendar,
  BookOpen,
  Users,
  Paperclip,
  FileText,
  GitBranch,
  CheckSquare,
  MessageSquare,
  Circle,
  Clock,
  Plus,
  Printer,
  GitCompareArrows,
  Milestone,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Copy,
} from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CompanyStatusBadge, EventTypeBadge } from "@/components/common/status-badge"
import { PriorityStars } from "@/components/common/priority-stars"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { CompanyFormModal } from "./company-form-modal"
import { StagesTab } from "./stages-tab"
import { ContactsTab } from "./contacts-tab"
import { formatDate, formatRelative } from "@/lib/utils/date"
import type { Company, Stage, Event, CaseLog, Contact, Attachment, Task, EntrySheet, EsQuestion, InterviewLog, Note, CompanyStatus, EventType } from "@/types"
import { cn } from "@/lib/utils"
import { TASK_STATUSES, ES_STATUSES, INTERVIEW_TYPES, COMPANY_STATUSES } from "@/lib/constants"

type ContactWithCount = Contact & { _count: { meetings: number } }

type FullCompany = Company & {
  stages: Stage[]
  events: Event[]
  caseLogs: CaseLog[]
  contacts: ContactWithCount[]
  attachments: Attachment[]
  tasks: Task[]
  entrySheets: (EntrySheet & { questions: EsQuestion[] })[]
  interviewLogs: (InterviewLog & { stage: { id: string; name: string } | null })[]
  companyNotes: Note[]
}

interface CompanyDetailPageProps {
  company: FullCompany
  allCompanies: { id: string; name: string }[]
}

export function CompanyDetailPage({ company: initialCompany, allCompanies }: CompanyDetailPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [company, setCompany] = useState(initialCompany)
  const activeTab = searchParams.get("tab") ?? "overview"

  const setTab = (tab: string) => {
    const p = new URLSearchParams(searchParams.toString())
    if (tab === "overview") p.delete("tab")
    else p.set("tab", tab)
    router.replace(`/companies/${initialCompany.id}${p.toString() ? "?" + p.toString() : ""}`, { scroll: false })
  }
  // 訪問を記録（コマンドパレットの「最近見た企業」用）
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const key = "cmd-recent-companies"
        const prev = JSON.parse(localStorage.getItem(key) ?? "[]") as { id: string; name: string }[]
        const filtered = prev.filter((c) => c.id !== initialCompany.id)
        localStorage.setItem(key, JSON.stringify([{ id: initialCompany.id, name: initialCompany.name }, ...filtered].slice(0, 5)))
      } catch {}
    }
  }, [initialCompany.id, initialCompany.name])

  // キーボードショートカット
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName) || (e.target as HTMLElement)?.isContentEditable
      if (isTyping) return
      if (e.key === "s" && !e.metaKey && !e.ctrlKey) handleToggleStar()
      if (e.key === "e" && !e.metaKey && !e.ctrlKey) setShowEdit(true)
      if (e.key === "1" && !e.metaKey && !e.ctrlKey) setTab("overview")
      if (e.key === "2" && !e.metaKey && !e.ctrlKey) setTab("stages")
      if (e.key === "3" && !e.metaKey && !e.ctrlKey) setTab("tasks")
      if (e.key === "4" && !e.metaKey && !e.ctrlKey) setTab("interviews")
      if (e.key === "5" && !e.metaKey && !e.ctrlKey) setTab("notes")
      if (e.key === "n" && !e.metaKey && !e.ctrlKey) setTab("notes")
      if (e.key === "t" && !e.metaKey && !e.ctrlKey) setTab("tasks")
      if (e.key === "i" && !e.metaKey && !e.ctrlKey) setTab("interviews")
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [company.starred]) // handleToggleStar needs company.starred

  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showInterviewPrepDialog, setShowInterviewPrepDialog] = useState(false)
  const [interviewPrepDate, setInterviewPrepDate] = useState("")
  const [showEsCreateDialog, setShowEsCreateDialog] = useState(false)
  const [esTitle, setEsTitle] = useState("")

  const handleDelete = async () => {
    const res = await fetch(`/api/companies/${company.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("企業を削除しました")
      router.push("/companies")
    } else {
      toast.error("削除に失敗しました")
    }
  }

  const handleToggleStar = async () => {
    const res = await fetch(`/api/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starred: !company.starred }),
    })
    if (res.ok) {
      const updated = await res.json()
      setCompany((prev) => ({ ...prev, ...updated }))
    }
  }

  const currentIdx = allCompanies.findIndex((c) => c.id === company.id)
  const prevCompany = currentIdx > 0 ? allCompanies[currentIdx - 1] : null
  const nextCompany = currentIdx < allCompanies.length - 1 ? allCompanies[currentIdx + 1] : null

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* パンくず + アクション */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <Link
            href="/companies"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 -ml-2")}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            企業一覧
          </Link>
          {allCompanies.length > 1 && (
            <div className="flex items-center gap-0.5 ml-1">
              <Link
                href={prevCompany ? `/companies/${prevCompany.id}` : "#"}
                className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), !prevCompany && "opacity-30 pointer-events-none")}
                title={prevCompany?.name}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Link>
              <span className="text-xs text-muted-foreground">{currentIdx + 1}/{allCompanies.length}</span>
              <Link
                href={nextCompany ? `/companies/${nextCompany.id}` : "#"}
                className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), !nextCompany && "opacity-30 pointer-events-none")}
                title={nextCompany?.name}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/companies/compare?ids=${company.id}`}
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
            title="比較ページに追加"
          >
            <GitCompareArrows className="h-4 w-4" />
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            title="AI用データをコピー"
            onClick={() => {
              const lines = [
                `企業名: ${company.name}`,
                company.industry ? `業界: ${company.industry}` : "",
                company.position ? `職種: ${company.position}` : "",
                company.location ? `勤務地: ${company.location}` : "",
                company.size ? `規模: ${company.size}` : "",
                `ステータス: ${company.status}`,
                company.notes ? `\n企業メモ:\n${company.notes}` : "",
                company.interviewLogs.length > 0 ? `\n面接履歴:\n${company.interviewLogs.map((l) => `- ${l.type}: ${l.outcome ?? "結果待ち"}`).join("\n")}` : "",
                company.companyNotes.length > 0 ? `\nノート:\n${company.companyNotes.map((n) => `【${n.title}】${n.content}`).join("\n")}` : "",
              ].filter(Boolean).join("\n")
              navigator.clipboard.writeText(lines)
              toast.success("AI用データをコピーしました")
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => window.print()} aria-label="印刷" title="印刷">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleToggleStar} aria-label="お気に入り">
            <Star className={cn("h-4 w-4", company.starred ? "text-amber-400 fill-amber-400" : "")} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setShowEdit(true)} aria-label="編集">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowDelete(true)}
            className="text-destructive hover:text-destructive"
            aria-label="削除"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ヘッダー */}
      <div>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {company.name}
              {company.starred && (
                <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
              )}
            </h1>
            {company.position && (
              <p className="text-muted-foreground mt-0.5">{company.position}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <CompanyStatusBadge status={company.status as CompanyStatus} />
            <PriorityStars
              priority={company.priority}
              size="md"
              interactive
              onChange={async (p) => {
                const res = await fetch(`/api/companies/${company.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ priority: p }),
                })
                if (res.ok) {
                  setCompany((prev) => ({ ...prev, priority: p }))
                  toast.success(`優先度を${p}に変更しました`)
                }
              }}
            />
          </div>
        </div>

        {/* メタ情報 */}
        <div className="flex flex-wrap gap-2 mt-3">
          {company.industry && (
            <Link href={`/companies?industry=${encodeURIComponent(company.industry)}`} title="同じ業界の企業を見る">
              <Badge variant="outline" className="hover:bg-muted cursor-pointer transition-colors">{company.industry}</Badge>
            </Link>
          )}
          {company.size && (
            <Badge variant="outline">{company.size}</Badge>
          )}
          {company.location && (
            <Badge variant="outline">{company.location}</Badge>
          )}
          {company.url && (
            <div className="flex items-center gap-1">
              <a
                href={company.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs px-2 py-1 border rounded-full text-muted-foreground hover:text-primary hover:border-primary transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                公式サイト
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(company.url!)
                  toast.success("URLをコピーしました")
                }}
                className="text-xs px-1.5 py-1 text-muted-foreground hover:text-foreground transition-colors"
                title="URLをコピー"
              >
                📋
              </button>
            </div>
          )}
        </div>

        {/* 応募日 + 選考期間 */}
        {company.appliedAt && (
          <p className="text-xs text-muted-foreground mt-2">
            応募日: {formatDate(company.appliedAt)}
            <span className="ml-2">
              (選考 {Math.floor((Date.now() - new Date(company.appliedAt).getTime()) / (1000 * 60 * 60 * 24))}日目)
            </span>
          </p>
        )}

        {/* インターン参加確定バナー */}
        {company.status === "internship" && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-300 dark:border-cyan-700 rounded-lg">
            <span className="text-lg">🎯</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-cyan-700 dark:text-cyan-400">インターン参加確定！</p>
              <p className="text-xs text-cyan-600 dark:text-cyan-500">全力で取り組んで早期内定パスを狙いましょう</p>
            </div>
            <button onClick={() => setTab("events")} className="text-xs text-cyan-700 dark:text-cyan-400 underline shrink-0">日程確認 →</button>
          </div>
        )}

        {/* 内定承諾バナー */}
        {company.status === "accepted" && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-amber-50 dark:from-emerald-950/30 dark:to-amber-950/30 border border-emerald-300 dark:border-emerald-700 rounded-lg">
            <span className="text-lg">🎉</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{company.name} 内定おめでとう！</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">他社と比較して承諾/辞退の判断を進めましょう</p>
            </div>
            <Link href="/companies/compare" className="text-xs text-emerald-700 dark:text-emerald-400 underline shrink-0">企業比較 →</Link>
          </div>
        )}

        {/* 不採用バナー */}
        {company.status === "rejected" && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-lg">
            <span className="text-lg">💪</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">お疲れ様でした。次に向けて進みましょう</p>
              <p className="text-xs text-zinc-500">面接ログで振り返り、次の選考に活かしましょう</p>
            </div>
            <button onClick={() => setTab("interviews")} className="text-xs text-zinc-500 hover:text-foreground underline shrink-0">振り返り →</button>
          </div>
        )}

        {/* 停滞警告 */}
        {(() => {
          if (!["applied", "screening", "interview", "case", "final"].includes(company.status)) return null
          const daysSinceUpdate = Math.floor((Date.now() - new Date(company.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
          if (daysSinceUpdate < 7) return null
          return (
            <div className="mt-2 flex items-center gap-2 text-xs px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-amber-700 dark:text-amber-400">
              <span>⚠️</span>
              <span>{daysSinceUpdate}日間更新がありません。進捗を確認しましょう。</span>
              <button
                onClick={() => setTab("tasks")}
                className="ml-auto underline hover:no-underline shrink-0"
              >
                タスクを確認
              </button>
            </div>
          )
        })()}

        {/* 選考フロービジュアル */}
        {!["rejected", "withdrawn", "wish"].includes(company.status) && (() => {
          const FLOW: { status: CompanyStatus; label: string }[] = [
            { status: "applied", label: "応募" },
            { status: "screening", label: "ES" },
            { status: "interview", label: "面接" },
            { status: "internship", label: "インターン" },
            { status: "case", label: "ケース" },
            { status: "final", label: "最終" },
            { status: "offer", label: "内定" },
          ]
          const TERMINAL: CompanyStatus[] = ["accepted", "rejected", "withdrawn"]
          if (TERMINAL.includes(company.status as CompanyStatus)) return null
          const currentIdx = FLOW.findIndex((s) => s.status === company.status)
          return (
            <div className="flex items-center gap-0.5 mt-3 overflow-x-auto">
              {FLOW.map((step, i) => (
                <div key={step.status} className="flex items-center gap-0.5 shrink-0">
                  {i > 0 && (
                    <div className={`h-0.5 w-4 ${i <= currentIdx ? "bg-primary" : "bg-muted"}`} />
                  )}
                  <div className={`flex items-center justify-center h-5 min-w-[36px] px-1.5 rounded-full text-[9px] font-medium transition-colors ${
                    i === currentIdx
                      ? "bg-primary text-primary-foreground"
                      : i < currentIdx
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground/50"
                  }`}>
                    {step.label}
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      {/* タブ */}
      <Tabs value={activeTab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto p-1 gap-1">
          <TabsTrigger value="overview" className="text-xs gap-1 h-7">
            <FileText className="h-3.5 w-3.5" />
            概要
          </TabsTrigger>
          <TabsTrigger value="stages" className="text-xs gap-1 h-7">
            <GitBranch className="h-3.5 w-3.5" />
            ステージ ({company.stages.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs gap-1 h-7">
            <CheckSquare className="h-3.5 w-3.5" />
            タスク ({company.tasks.filter(t => t.status !== "done").length})
          </TabsTrigger>
          <TabsTrigger value="interviews" className="text-xs gap-1 h-7">
            <MessageSquare className="h-3.5 w-3.5" />
            面接 ({company.interviewLogs.length})
          </TabsTrigger>
          <TabsTrigger value="events" className="text-xs gap-1 h-7">
            <Calendar className="h-3.5 w-3.5" />
            イベント ({company.events.length})
          </TabsTrigger>
          <TabsTrigger value="cases" className="text-xs gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            ケース ({company.caseLogs.length})
          </TabsTrigger>
          <TabsTrigger value="es" className="text-xs gap-1 h-7">
            <FileText className="h-3.5 w-3.5" />
            ES ({company.entrySheets.reduce((s, es) => s + es.questions.filter((q) => q.answer && q.answer.length > 0).length, 0)}/{company.entrySheets.reduce((s, es) => s + es.questions.length, 0)})
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs gap-1 h-7">
            <FileText className="h-3.5 w-3.5" />
            ノート ({company.companyNotes.length})
          </TabsTrigger>
          <TabsTrigger value="contacts" className="text-xs gap-1 h-7">
            <Users className="h-3.5 w-3.5" />
            連絡先 ({company.contacts.length})
          </TabsTrigger>
          <TabsTrigger value="attachments" className="text-xs gap-1 h-7">
            <Paperclip className="h-3.5 w-3.5" />
            書類 ({company.attachments.length})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs gap-1 h-7">
            <Milestone className="h-3.5 w-3.5" />
            タイムライン
          </TabsTrigger>
        </TabsList>

        {/* 概要タブ */}
        <TabsContent value="overview" className="space-y-4">
          {/* クイック統計 */}
          {(company.tasks.length > 0 || company.interviewLogs.length > 0 || company.entrySheets.length > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {company.tasks.length > 0 && (
                <button className="border rounded-xl p-3 text-center hover:bg-muted/30 transition-colors" onClick={() => setTab("tasks")}>
                  <p className="text-2xl font-bold text-primary">
                    {company.tasks.filter((t) => t.status === "done").length}/{company.tasks.length}
                  </p>
                  <p className="text-xs text-muted-foreground">タスク完了</p>
                  <div className="mt-1.5 bg-muted rounded-full h-1">
                    <div
                      className="bg-emerald-500 h-1 rounded-full transition-all"
                      style={{ width: `${(company.tasks.filter((t) => t.status === "done").length / company.tasks.length) * 100}%` }}
                    />
                  </div>
                </button>
              )}
              {company.interviewLogs.length > 0 && (
                <button className="border rounded-xl p-3 text-center hover:bg-muted/30 transition-colors" onClick={() => setTab("interviews")}>
                  <p className="text-2xl font-bold text-amber-600">
                    {company.interviewLogs.filter((l) => l.outcome === "passed").length}/{company.interviewLogs.filter((l) => l.outcome).length || company.interviewLogs.length}
                  </p>
                  <p className="text-xs text-muted-foreground">面接通過</p>
                </button>
              )}
              {company.entrySheets.length > 0 && (
                <button className="border rounded-xl p-3 text-center hover:bg-muted/30 transition-colors" onClick={() => setTab("es")}>
                  <p className="text-2xl font-bold text-blue-600">
                    {company.entrySheets.reduce((s, es) => s + es.questions.filter((q) => q.answer && q.answer.length > 0).length, 0)}/
                    {company.entrySheets.reduce((s, es) => s + es.questions.length, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">ES回答済</p>
                </button>
              )}
              {(() => {
                const totalMeetings = company.contacts.reduce((s, c) => s + (c._count?.meetings ?? 0), 0)
                if (totalMeetings === 0) return null
                return (
                  <button className="border rounded-xl p-3 text-center hover:bg-muted/30 transition-colors" onClick={() => setTab("contacts")}>
                    <p className="text-2xl font-bold text-violet-600">{totalMeetings}</p>
                    <p className="text-xs text-muted-foreground">OB訪問</p>
                  </button>
                )
              })()}
            </div>
          )}

          {/* 準備度スコア（面接中のみ） */}
          {["interview", "internship", "case", "final"].includes(company.status) && (() => {
            const checks = [
              { label: "企業研究メモ", done: (company.notes?.length ?? 0) > 20, tab: "overview" },
              { label: "ES作成済み", done: company.entrySheets.length > 0, tab: "es" },
              { label: "ノートあり", done: company.companyNotes.length > 0, tab: "notes" },
              { label: "面接記録あり", done: company.interviewLogs.length > 0, tab: "interviews" },
              { label: "準備タスクあり", done: company.tasks.filter((t) => t.status !== "done").length > 0, tab: "tasks" },
              { label: "ステージ設定", done: company.stages.length > 0, tab: "stages" },
            ]
            const score = Math.round((checks.filter((c) => c.done).length / checks.length) * 100)
            return (
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">面接準備度</p>
                  <span className={`text-sm font-bold ${score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-500"}`}>
                    {score}%
                  </span>
                </div>
                <div className="bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-400"}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {checks.map((c) => (
                    c.done ? (
                      <span
                        key={c.label}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      >
                        ✓ {c.label}
                      </span>
                    ) : (
                      <button
                        key={c.label}
                        onClick={() => setTab(c.tab)}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-800/30 hover:bg-red-100 transition-colors"
                      >
                        + {c.label}
                      </button>
                    )
                  ))}
                </div>
              </div>
            )
          })()}

          {/* 面接スコアトレンド */}
          {(() => {
            const rated = [...company.interviewLogs]
              .filter((l) => l.rating)
              .sort((a, b) => new Date(a.conductedAt).getTime() - new Date(b.conductedAt).getTime())
            if (rated.length < 2) return null
            const scores = rated.map((l) => l.rating!)
            const min = 1; const max = 5
            const w = 120; const h = 32; const pad = 2
            const points = scores.map((s, i) => {
              const x = pad + (i / (scores.length - 1)) * (w - pad * 2)
              const y = h - pad - ((s - min) / (max - min)) * (h - pad * 2)
              return `${x},${y}`
            }).join(" ")
            const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
            const trend = scores[scores.length - 1] >= scores[0] ? "↑" : "↓"
            const trendColor = scores[scores.length - 1] >= scores[0] ? "text-emerald-600" : "text-red-500"
            return (
              <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">面接スコア推移</p>
                  <p className="text-sm font-bold mt-0.5">
                    平均 {avgScore} <span className={trendColor}>{trend}</span>
                  </p>
                </div>
                <svg width={w} height={h} className="shrink-0">
                  <polyline
                    points={points}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {scores.map((s, i) => {
                    const x = pad + (i / (scores.length - 1)) * (w - pad * 2)
                    const y = h - pad - ((s - min) / (max - min)) * (h - pad * 2)
                    return <circle key={i} cx={x} cy={y} r="2" fill="hsl(var(--primary))" />
                  })}
                </svg>
              </div>
            )
          })()}

          {/* 次のアクション推薦 */}
          {(() => {
            const actions: { text: string; urgent?: boolean }[] = []
            if (company.status === "wish") actions.push({ text: "エントリーフォームに応募しましょう" })
            if (company.status === "applied" && company.entrySheets.length === 0) actions.push({ text: "ESを作成して準備を始めましょう" })
            if (["applied", "screening"].includes(company.status) && company.entrySheets.length > 0) {
              const unansweredCount = company.entrySheets.reduce((s, es) => s + es.questions.filter((q) => !q.answer || q.answer.length === 0).length, 0)
              if (unansweredCount > 0) actions.push({ text: `ES設問 ${unansweredCount}問が未回答です`, urgent: true })
            }
            if (company.status === "screening" && company.companyNotes.length === 0) actions.push({ text: "企業研究ノートを作成しましょう" })
            if (["interview", "internship", "case", "final"].includes(company.status) && company.contacts.length === 0) actions.push({ text: "面接官の連絡先を登録しましょう" })
            if (["interview", "internship", "case", "final"].includes(company.status) && company.tasks.filter((t) => t.status !== "done").length === 0) actions.push({ text: "面接準備タスクを追加しましょう" })
            if (["interview", "internship", "case", "final"].includes(company.status) && company.stages.length === 0) actions.push({ text: "選考ステージを設定しましょう" })
            if (["interview", "internship", "case", "final"].includes(company.status) && company.interviewLogs.length === 0) actions.push({ text: "面接ログを記録しましょう" })
            if (company.interviewLogs.some((l) => l.outcome === "passed") && !company.interviewLogs.some((l) => !l.outcome)) actions.push({ text: "次の選考ステージを設定しましょう" })
            if (["interview", "internship", "final"].includes(company.status)) actions.push({ text: "OB訪問でインサイダー情報を収集すると内定率が上がります" })
            if (company.status === "offer") actions.push({ text: "🎉 内定おめでとうございます！承諾期限を確認しましょう", urgent: true })
            if (company.status === "offer" && company.entrySheets.length > 0) actions.push({ text: "他社比較して最終判断を行いましょう" })
            if (actions.length === 0) return null
            return (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">💡 次のアクション</p>
                  {company.status === "final" && (
                    <AiFinalInterviewPrepButton company={company} />
                  )}
                  {company.status === "internship" && (
                    <AiInternshipStrategyButton company={company} />
                  )}
                  {["interview", "case"].includes(company.status) && (
                    <AiInterviewPrepButton company={company} />
                  )}
                  {company.status === "offer" && (
                    <AiWithdrawalEmailButton company={company} />
                  )}
                </div>
                <ul className="space-y-0.5">
                  {actions.map((action) => (
                    <li key={action.text} className={`text-xs ${action.urgent ? "text-amber-700 dark:text-amber-400 font-medium" : "text-blue-600 dark:text-blue-400"}`}>• {action.text}</li>
                  ))}
                </ul>
              </div>
            )
          })()}

          {/* ステージ進捗プレビュー */}
          {company.stages.length > 0 && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">選考ステージ</p>
                <button onClick={() => setTab("stages")} className="text-xs text-primary hover:underline">詳細 →</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {company.stages.map((stage) => {
                  const statusColor =
                    stage.status === "passed" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                    stage.status === "failed" ? "bg-red-100 text-red-600 border-red-200" :
                    stage.status === "scheduled" ? "bg-amber-100 text-amber-700 border-amber-200" :
                    stage.status === "cancelled" ? "bg-zinc-100 text-zinc-500 border-zinc-200 line-through" :
                    "bg-muted text-muted-foreground border-muted"
                  return (
                    <span key={stage.id} className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColor}`}>
                      {stage.name}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label="企業名" value={company.name} />
            <InfoRow label="職種" value={company.position} />
            <InfoRow label="業界" value={company.industry} />
            <InfoRow label="規模" value={company.size} />
            <InfoRow label="勤務地" value={company.location} />
            <InfoRow
              label="ステータス"
              value={COMPANY_STATUSES.find((s) => s.value === company.status)?.label ?? company.status}
            />
            {company.appliedAt && <InfoRow label="応募日" value={formatDate(company.appliedAt)} />}
            {company.appliedAt && !["offer", "accepted", "rejected", "withdrawn"].includes(company.status) && (() => {
              const days = Math.floor((Date.now() - new Date(company.appliedAt!).getTime()) / (1000 * 60 * 60 * 24))
              return <InfoRow label="選考期間" value={`${days}日間`} />
            })()}
            {company.interviewLogs.length > 0 && (() => {
              const lastLog = [...company.interviewLogs].sort((a, b) => new Date(b.conductedAt).getTime() - new Date(a.conductedAt).getTime())[0]
              return <InfoRow label="最後の面接" value={formatDate(lastLog.conductedAt)} />
            })()}
            <InfoRow label="最終更新" value={formatDate(company.updatedAt)} />
            {company.url && (
              <div>
                <p className="text-xs text-muted-foreground">企業URL</p>
                <a href={company.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 mt-0.5">
                  リンクを開く <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
          {/* 次回の予定プレビュー */}
          {(() => {
            const upcomingEvents = company.events
              .filter((e) => !e.completed && new Date(e.startAt) >= new Date())
              .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
              .slice(0, 3)
            return (
              <div className="rounded-lg border p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">次回の予定</p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/calendar?companyId=${company.id}`}
                      className="text-xs text-primary hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="h-2.5 w-2.5" />
                      追加
                    </Link>
                    <button onClick={() => setTab("events")} className="text-xs text-muted-foreground hover:text-primary hover:underline">すべて →</button>
                  </div>
                </div>
                {upcomingEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50">予定はありません</p>
                ) : upcomingEvents.map((event) => {
                  const daysUntil = Math.ceil((new Date(event.startAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={event.id} className="flex items-center gap-2 text-xs">
                      <span className={`font-mono min-w-[60px] ${daysUntil <= 1 ? "text-red-500 font-medium" : daysUntil <= 3 ? "text-amber-600" : "text-muted-foreground"}`}>
                        {daysUntil === 0 ? "今日" : daysUntil === 1 ? "明日" : formatDate(event.startAt)}
                      </span>
                      <span className="font-medium truncate flex-1">{event.title}</span>
                    </div>
                  )
                })}
              </div>
            )
          })()}
          {/* 最近の活動ログ */}
          {(() => {
            type ActivityItem = { date: Date; icon: string; text: string }
            const items: ActivityItem[] = [
              ...company.interviewLogs.map((l) => ({
                date: new Date(l.conductedAt),
                icon: l.outcome === "passed" ? "✅" : l.outcome === "failed" ? "❌" : "💬",
                text: `面接: ${["casual", "1st", "2nd", "final", "case", "group"][["casual", "1st", "2nd", "final", "case", "group"].indexOf(l.type)] ?? l.type}`,
              })),
              ...company.events.filter((e) => new Date(e.startAt) < new Date()).map((e) => ({
                date: new Date(e.startAt),
                icon: "📅",
                text: e.title,
              })),
              ...company.tasks.filter((t) => t.status === "done").map((t) => ({
                date: new Date(t.updatedAt),
                icon: "✓",
                text: t.title,
              })),
            ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5)
            if (items.length === 0) return null
            return (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">最近の活動</p>
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground/60 font-mono min-w-[50px] text-[10px]">
                      {item.date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                    </span>
                    <span>{item.icon}</span>
                    <span className="text-muted-foreground truncate flex-1">{item.text}</span>
                  </div>
                ))}
              </div>
            )
          })()}
          <InlineNoteEditor
            companyId={company.id}
            initialNotes={company.notes ?? ""}
          />
        </TabsContent>

        {/* ステージタブ */}
        <TabsContent value="stages">
          <StagesTab
            companyId={company.id}
            stages={company.stages}
            onStagesChange={(stages) => setCompany((prev) => ({ ...prev, stages }))}
          />
        </TabsContent>

        {/* タスクタブ */}
        <TabsContent value="tasks" className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1"
                onClick={() => { setInterviewPrepDate(""); setShowInterviewPrepDialog(true) }}
              >
                📋 面接準備タスクを一括作成
              </Button>
              {company.status === "internship" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1 text-cyan-700 border-cyan-300"
                  onClick={async () => {
                    const today = new Date().toISOString().split("T")[0]
                    const tasks = [
                      { title: "企業・事業リサーチ", priority: 5 },
                      { title: "ケースフレームワーク復習（MECE・3C・利益ツリー）", priority: 5 },
                      { title: "PC環境セットアップ確認", priority: 4 },
                      { title: "当日の交通経路・場所確認", priority: 3 },
                      { title: "インターン後のお礼メール準備", priority: 3 },
                    ]
                    await Promise.all(tasks.map((t) =>
                      fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...t, status: "todo", companyId: company.id, dueAt: today }) })
                    ))
                    toast.success("インターン準備タスクを5件作成しました")
                    window.location.reload()
                  }}
                >
                  🎯 インターン準備タスクを作成
                </Button>
              )}
            </div>
            <a
              href={`/tasks?company=${company.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs gap-1")}
            >
              <CheckSquare className="h-3 w-3" />
              タスク管理ページへ
            </a>
          </div>
          <QuickTaskAdd companyId={company.id} onAdded={(task) => setCompany((prev) => ({ ...prev, tasks: [...prev.tasks, task as Task] }))} />
          {company.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">タスクはありません</p>
          ) : (() => {
            const pendingTasks = company.tasks.filter((t) => t.status !== "done")
            const doneTasks = company.tasks.filter((t) => t.status === "done")
            const renderTask = (task: Task) => {
              const statusConfig = TASK_STATUSES.find((s) => s.value === task.status)
              const Icon = task.status === "done" ? CheckSquare : task.status === "doing" ? Clock : Circle
              const isOverdue = task.status !== "done" && task.dueAt && new Date(task.dueAt) < new Date() && !formatDate(task.dueAt).includes(new Date().toLocaleDateString("ja-JP"))
              const handleToggle = async () => {
                const newStatus = task.status === "done" ? "todo" : "done"
                const res = await fetch(`/api/tasks/${task.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: newStatus }),
                })
                if (res.ok) {
                  setCompany((prev) => ({
                    ...prev,
                    tasks: prev.tasks.map((t) => t.id === task.id ? { ...t, status: newStatus } : t),
                  }))
                }
              }
              return (
                <div key={task.id} className={cn("flex items-center gap-3 p-3 border rounded-lg group", isOverdue && "border-red-200 bg-red-50/50 dark:border-red-800/30 dark:bg-red-950/10")}>
                  <button onClick={handleToggle} className="shrink-0" title={task.status === "done" ? "未完了に戻す" : "完了にする"}>
                    <Icon className={cn("h-4 w-4 hover:scale-110 transition-transform", statusConfig?.color)} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm", task.status === "done" && "line-through text-muted-foreground")}>
                      {task.title}
                    </p>
                    {task.dueAt && (
                      <p className="text-xs text-muted-foreground">{formatDate(task.dueAt)}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={cn("text-xs", statusConfig?.color)}>
                    {statusConfig?.label}
                  </Badge>
                </div>
              )
            }
            return (
              <>
                {pendingTasks.map(renderTask)}
                {doneTasks.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none">
                      完了済み {doneTasks.length}件
                    </summary>
                    <div className="mt-1 space-y-1.5 opacity-60">
                      {doneTasks.map(renderTask)}
                    </div>
                  </details>
                )}
              </>
            )
          })()}
        </TabsContent>

        {/* 面接ログタブ */}
        <TabsContent value="interviews" className="space-y-2">
          <div className="flex items-center justify-between">
            <Link href={`/interviews?company=${company.id}&new=1`} className="text-xs text-muted-foreground hover:text-primary underline">+ 面接ログを追加</Link>
            <Link href={`/interviews?company=${company.id}`} className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-2 py-0.5 rounded-lg hover:opacity-80 transition-opacity">🧠 練習モードで対策</Link>
          </div>
          {company.interviewLogs.length > 0 && (() => {
            const withOutcome = company.interviewLogs.filter((l) => l.outcome)
            const passed = company.interviewLogs.filter((l) => l.outcome === "passed").length
            const passRate = withOutcome.length > 0 ? Math.round(passed / withOutcome.length * 100) : null
            const avgRating = company.interviewLogs.filter((l) => l.rating).length > 0
              ? (company.interviewLogs.filter((l) => l.rating).reduce((s, l) => s + (l.rating ?? 0), 0) / company.interviewLogs.filter((l) => l.rating).length).toFixed(1)
              : null
            return (
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/30 p-3 text-center">
                <div>
                  <p className="text-lg font-bold">{company.interviewLogs.length}</p>
                  <p className="text-[10px] text-muted-foreground">面接総数</p>
                </div>
                {passRate !== null && (
                  <div>
                    <p className={`text-lg font-bold ${passRate >= 60 ? "text-emerald-600" : passRate >= 40 ? "text-amber-600" : "text-red-500"}`}>{passRate}%</p>
                    <p className="text-[10px] text-muted-foreground">通過率</p>
                  </div>
                )}
                {avgRating && (
                  <div>
                    <p className="text-lg font-bold text-amber-500">★{avgRating}</p>
                    <p className="text-[10px] text-muted-foreground">平均評価</p>
                  </div>
                )}
              </div>
            )
          })()}
          <div className="flex items-center justify-between gap-2">
            <details className="text-xs flex-1">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors select-none">💬 逆質問テンプレ（クリックで展開）</summary>
              <div className="mt-1 p-2 bg-muted/50 rounded text-muted-foreground space-y-0.5 text-[10px]">
                <p>・社内でどのような方が活躍されていますか？</p>
                <p>・入社後の研修はどのような内容ですか？</p>
                <p>・御社で働く上でのやりがいを教えてください</p>
                <p>・今後の事業展開について教えてください</p>
                <p>・チームの雰囲気や文化について教えてください</p>
                <p>・成長機会やスキルアップについて教えてください</p>
              </div>
            </details>
            <div className="flex items-center gap-1">
              <Link
                href={`/interviews?new=1&company=${company.id}`}
                className={cn(buttonVariants({ size: "sm" }), "text-xs gap-1")}
              >
                <Plus className="h-3 w-3" />
                記録を追加
              </Link>
              <Link
                href="/interviews"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs gap-1")}
              >
                <MessageSquare className="h-3 w-3" />
                一覧へ
              </Link>
            </div>
          </div>
          {/* 質問まとめ */}
          {company.interviewLogs.some((l) => l.questions) && (
            <div className="bg-muted/30 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">過去に聞かれた質問</p>
              <div className="text-xs text-foreground space-y-0.5">
                {company.interviewLogs
                  .filter((l) => l.questions)
                  .flatMap((l) => (l.questions ?? "").split("\n").filter((q) => q.trim()))
                  .slice(0, 8)
                  .map((q, i) => (
                    <p key={i} className="leading-relaxed">{q.trim()}</p>
                  ))
                }
              </div>
            </div>
          )}
          {company.interviewLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">面接ログはありません</p>
          ) : (
            company.interviewLogs.map((log) => {
              const typeConfig = INTERVIEW_TYPES.find((t) => t.value === log.type)
              return (
                <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{typeConfig?.label ?? log.type}</p>
                      {log.outcome && (
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded font-medium",
                          log.outcome === "passed" ? "bg-emerald-100 text-emerald-700" :
                          log.outcome === "failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {log.outcome === "passed" ? "通過" : log.outcome === "failed" ? "不通過" : "待機中"}
                        </span>
                      )}
                      {log.rating && (
                        <span className="text-xs text-amber-500 flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {log.rating}/5
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{formatDate(log.conductedAt)}</span>
                      {log.stage && <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{log.stage.name}</span>}
                      {log.interviewerName && <span>面接官: {log.interviewerName}</span>}
                      {log.duration && <span>{log.duration}分</span>}
                      {log.questions && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                          質問{log.questions.split("\n").filter((q) => q.trim()).length}件
                        </span>
                      )}
                      {log.myAnswers && !log.questions && (
                        <span className="text-[10px] text-emerald-600">回答記録あり</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </TabsContent>

        {/* イベントタブ */}
        <TabsContent value="events" className="space-y-2">
          <div className="flex justify-end">
            <Link
              href={`/calendar`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs gap-1")}
            >
              <Calendar className="h-3 w-3" />
              カレンダーで追加
            </Link>
          </div>
          {company.events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              イベントはまだありません
            </p>
          ) : (
            company.events.map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <p className={`text-sm font-medium ${event.completed ? "line-through text-muted-foreground" : ""}`}>{event.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">{formatDate(event.startAt)}</p>
                    <p className="text-[10px] text-muted-foreground/60">{formatRelative(event.startAt)}</p>
                    {event.location && <p className="text-xs text-muted-foreground">📍 {event.location}</p>}
                  </div>
                </div>
                <EventTypeBadge type={event.type as EventType} />
              </div>
            ))
          )}
        </TabsContent>

        {/* ケースタブ */}
        <TabsContent value="cases" className="space-y-2">
          {company.caseLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              ケースログはまだありません
            </p>
          ) : (
            company.caseLogs.map((caseLog) => (
              <Link
                key={caseLog.id}
                href={`/cases/${caseLog.id}`}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{caseLog.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    {caseLog.category && <span>{caseLog.category}</span>}
                    {caseLog.difficulty && <span>難易度{"⭐".repeat(caseLog.difficulty)}</span>}
                    {caseLog.duration && <span>{caseLog.duration}分</span>}
                    <span>{formatRelative(caseLog.createdAt)}</span>
                  </div>
                </div>
                {caseLog.rating && (
                  <span className="text-xs text-amber-500">★{caseLog.rating}</span>
                )}
              </Link>
            ))
          )}
        </TabsContent>

        {/* ESタブ */}
        <TabsContent value="es" className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1"
              onClick={() => { setEsTitle(`${company.name} 本選考ES`); setShowEsCreateDialog(true) }}
            >
              <Plus className="h-3 w-3" />
              ESを新規作成
            </Button>
            <Link href={`/entry-sheets?company=${company.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs gap-1")}>
              ES一覧へ
            </Link>
          </div>
          {company.entrySheets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">ESはまだありません</p>
          ) : (
            company.entrySheets.map((es) => {
              const answered = es.questions.filter((q) => q.answer && q.answer.length > 0).length
              const total = es.questions.length
              const progress = total > 0 ? Math.round((answered / total) * 100) : 0
              const allDone = total > 0 && answered === total
              const esStatusConfig = ES_STATUSES.find((s) => s.value === es.status)
              return (
                <Link key={es.id} href={`/entry-sheets/${es.id}`}
                  className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium flex-1 truncate">{es.title}</p>
                    {esStatusConfig && (
                      <Badge variant="outline" className={cn("text-xs shrink-0", esStatusConfig.color)}>
                        {esStatusConfig.label}
                      </Badge>
                    )}
                  </div>
                  {total > 0 && (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">{answered}/{total}問 回答済</span>
                        <span className={cn("font-medium", allDone ? "text-emerald-600" : "text-muted-foreground")}>{progress}%{allDone ? " 完了 🎉" : ""}</span>
                      </div>
                      <div className="bg-muted rounded-full h-1">
                        <div
                          className={cn("h-1 rounded-full transition-all", allDone ? "bg-emerald-500" : "bg-blue-500")}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {es.deadline && (
                    <p className="text-[10px] text-muted-foreground">
                      締切: {formatDate(es.deadline)}
                    </p>
                  )}
                </Link>
              )
            })
          )}
        </TabsContent>

        {/* ノートタブ */}
        <TabsContent value="notes" className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 flex-wrap">
              <Link
                href={`/notes?new=1&companyId=${company.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs gap-1")}
              >
                <Plus className="h-3 w-3" />
                空白
              </Link>
              {[
                { label: "企業研究", category: "research", content: `# ${company.name} 企業研究\n\n## 事業概要\n\n\n## ビジョン・ミッション\n\n\n## 主要サービス・製品\n\n\n## 競合・差別化\n\n\n## 財務・規模感\n\n\n## 志望理由\n\n\n## 懸念点・確認事項\n\n` },
                { label: "面接メモ", category: "interview", content: `# ${company.name} 面接メモ\n\n## 日時・形式\n\n\n## 面接官\n\n\n## 聞かれた質問\n\n1. \n2. \n3. \n\n## 自分の回答\n\n\n## 逆質問\n\n\n## 感触・所感\n\n\n## 次回への改善点\n\n` },
                { label: "OB訪問", category: "ob_visit", content: `# ${company.name} OB訪問メモ\n\n## 訪問者情報\n- 氏名: \n- 所属: \n- 経歴: \n\n## 聞いた内容\n\n1. 仕事内容について\n\n2. 企業文化・雰囲気\n\n3. 就活へのアドバイス\n\n## 印象・気づき\n\n\n## お礼メール送付\n- [ ] 当日中に送付\n` },
              ].map((tmpl) => (
                <QuickNoteCreateButton
                  key={tmpl.label}
                  label={tmpl.label}
                  companyId={company.id}
                  category={tmpl.category}
                  content={tmpl.content}
                  onCreated={(note) => {
                    setCompany((prev) => ({ ...prev, companyNotes: [note as Note, ...prev.companyNotes] }))
                    router.push(`/notes?id=${note.id}`)
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {company.companyNotes.length > 0 && (
                <AiNoteSummaryButton notes={company.companyNotes} companyName={company.name} />
              )}
              <Link href={`/notes?companyId=${company.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs gap-1")}>
                ノートページで開く
              </Link>
            </div>
          </div>
          <AiMotivationButton company={company} />
          {company.companyNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">テンプレートボタンで素早くメモを始めよう</p>
          ) : (
            company.companyNotes.map((note) => (
              <Link
                key={note.id}
                href={`/notes?id=${note.id}`}
                className={cn("block p-3 border rounded-lg hover:bg-muted/50 transition-colors", note.pinned && "border-primary/30 bg-primary/5")}
              >
                <p className="text-sm font-medium">{note.pinned ? "📌 " : ""}{note.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{note.content || "（空白）"}</p>
                {note.category && <Badge variant="outline" className="mt-1 text-[10px]">{note.category}</Badge>}
              </Link>
            ))
          )}
        </TabsContent>

        {/* 連絡先タブ */}
        <TabsContent value="contacts" className="space-y-3">
          <div className="flex justify-end">
            <Link
              href={`/meetings?new=1&companyId=${company.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs gap-1")}
            >
              <Plus className="h-3 w-3" />
              OB訪問を記録
            </Link>
          </div>
          <ContactsTab companyId={company.id} initialContacts={company.contacts} />
        </TabsContent>

        {/* 添付タブ */}
        <TabsContent value="attachments" className="space-y-2">
          <AddAttachmentForm companyId={company.id} onAdded={(att) => setCompany((prev) => ({ ...prev, attachments: [...prev.attachments, att as Attachment] }))} />
          {company.attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              添付ファイルはまだありません
            </p>
          ) : (
            company.attachments.map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{att.name}</p>
                  <p className="text-xs text-muted-foreground">{att.kind}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            ))
          )}
        </TabsContent>

        {/* タイムラインタブ */}
        <TabsContent value="timeline" className="space-y-1">
          {(() => {
            type TimelineItem = {
              date: Date
              icon: string
              title: string
              subtitle?: string
              color: string
            }
            const items: TimelineItem[] = []

            if (company.appliedAt) {
              items.push({ date: new Date(company.appliedAt), icon: "📝", title: "応募", color: "text-blue-600" })
            } else {
              items.push({ date: new Date(company.createdAt), icon: "🏢", title: "企業を登録", color: "text-zinc-500" })
            }

            for (const stage of company.stages) {
              const d = stage.completedAt ?? stage.scheduledAt
              if (d) {
                const statusLabel = stage.status === "passed" ? "通過" : stage.status === "failed" ? "不通過" : stage.status === "scheduled" ? "予定" : "保留"
                items.push({
                  date: new Date(d),
                  icon: stage.status === "passed" ? "✅" : stage.status === "failed" ? "❌" : "📅",
                  title: stage.name,
                  subtitle: statusLabel,
                  color: stage.status === "passed" ? "text-emerald-600" : stage.status === "failed" ? "text-red-500" : "text-blue-500",
                })
              }
            }

            for (const log of company.interviewLogs) {
              const typeLabel = { first: "1次面接", second: "2次面接", third: "3次面接", final: "最終面接", hr: "人事面接", group: "グループ", case: "ケース面接", other: "面接" }[log.type] ?? log.type
              items.push({
                date: new Date(log.conductedAt),
                icon: log.outcome === "passed" ? "🎉" : log.outcome === "failed" ? "😔" : "💬",
                title: typeLabel,
                subtitle: log.outcome === "passed" ? "通過" : log.outcome === "failed" ? "不通過" : log.rating ? `評価${log.rating}/5` : undefined,
                color: log.outcome === "passed" ? "text-emerald-600" : log.outcome === "failed" ? "text-red-500" : "text-amber-600",
              })
            }

            for (const event of company.events) {
              items.push({
                date: new Date(event.startAt),
                icon: { interview: "🎤", case_interview: "🧠", deadline: "⏰", meeting: "👥", info_session: "ℹ️", coffee_chat: "☕", task: "📋" }[event.type] ?? "📅",
                title: event.title,
                subtitle: event.completed ? "完了" : new Date(event.startAt) > new Date() ? "予定" : undefined,
                color: event.completed ? "text-zinc-400" : "text-blue-500",
              })
            }

            items.sort((a, b) => b.date.getTime() - a.date.getTime())

            if (items.length === 0) {
              return <p className="text-sm text-muted-foreground text-center py-8">活動履歴がありません</p>
            }

            return (
              <div className="space-y-0">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 py-2.5">
                    <div className="flex flex-col items-center">
                      <span className="text-base shrink-0">{item.icon}</span>
                      {idx < items.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1 min-h-[12px]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${item.color}`}>{item.title}</span>
                        {item.subtitle && (
                          <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                        {item.date.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </TabsContent>
      </Tabs>

      {/* 編集モーダル */}
      {showEdit && (
        <CompanyFormModal
          open={showEdit}
          onOpenChange={setShowEdit}
          company={{ ...company, _count: { events: company.events.length, caseLogs: company.caseLogs.length } }}
          onSuccess={(updated) => {
            setCompany((prev) => ({ ...prev, ...updated }))
            setShowEdit(false)
          }}
        />
      )}

      {/* 削除確認 */}
      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={`${company.name}を削除しますか？`}
        description="この操作は取り消せません。"
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleDelete}
      />

      {/* 面接準備タスク一括作成ダイアログ */}
      <Dialog open={showInterviewPrepDialog} onOpenChange={setShowInterviewPrepDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>面接準備タスクを一括作成</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              面接日を入力すると7種類の準備タスクが自動生成されます。
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="interviewDate">面接日 *</Label>
              <Input
                id="interviewDate"
                type="date"
                value={interviewPrepDate}
                onChange={(e) => setInterviewPrepDate(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowInterviewPrepDialog(false)}>
              キャンセル
            </Button>
            <Button
              size="sm"
              disabled={!interviewPrepDate}
              onClick={async () => {
                const res = await fetch("/api/tasks/batch", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ template: "interview_prep", companyId: company.id, interviewDate: interviewPrepDate }),
                })
                if (res.ok) {
                  const data = await res.json()
                  toast.success(`${data.count}件の準備タスクを作成しました`)
                  setShowInterviewPrepDialog(false)
                  router.refresh()
                }
              }}
            >
              作成する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ES新規作成ダイアログ */}
      <Dialog open={showEsCreateDialog} onOpenChange={setShowEsCreateDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>ESを新規作成</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="esTitle">タイトル *</Label>
              <Input
                id="esTitle"
                value={esTitle}
                onChange={(e) => setEsTitle(e.target.value)}
                placeholder="例: Lumen Robotics 本選考ES"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowEsCreateDialog(false)}>
              キャンセル
            </Button>
            <Button
              size="sm"
              disabled={!esTitle.trim()}
              onClick={async () => {
                const res = await fetch("/api/entry-sheets", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ title: esTitle, companyId: company.id, status: "draft" }),
                })
                if (res.ok) {
                  const es = await res.json()
                  setShowEsCreateDialog(false)
                  router.push(`/entry-sheets/${es.id}`)
                }
              }}
            >
              作成して編集へ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value || "-"}</p>
    </div>
  )
}

function InlineNoteEditor({ companyId, initialNotes }: { companyId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [aiSummarizing, setAiSummarizing] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = async (value: string) => {
    setSaving(true)
    await fetch(`/api/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: value }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setNotes(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(val), 800)
  }

  const handleAiSummarize = async () => {
    if (!notes || notes.length < 30) return
    setAiSummarizing(true)
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: notes, type: "company_notes" }),
      })
      if (res.ok) {
        const { summary } = await res.json()
        const newNotes = notes + "\n\n---\n**AI要約:**\n" + summary
        setNotes(newNotes)
        save(newNotes)
      }
    } finally {
      setAiSummarizing(false)
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground font-medium">メモ</p>
        {saving && <span className="text-[10px] text-muted-foreground">保存中...</span>}
        {saved && !saving && <span className="text-[10px] text-emerald-600">✓ 保存済み</span>}
        {!notes && (
          <button
            onClick={() => {
              const template = "## 企業研究\n・ビジネスモデル:\n・強み/差別化:\n・事業課題:\n\n## 志望動機\n・なぜこの会社:\n・なぜこの職種:\n\n## 逆質問メモ\n・"
              setNotes(template)
              save(template)
            }}
            className="text-[10px] text-primary/70 hover:text-primary transition-colors"
          >
            📋 テンプレを挿入
          </button>
        )}
        {notes && !saving && (
          <>
            <button
              onClick={handleAiSummarize}
              disabled={aiSummarizing || notes.length < 30}
              className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
              title="AIで要約"
            >
              {aiSummarizing ? "⏳" : "✨ AI要約"}
            </button>
            <span className="text-[10px] text-muted-foreground/50 ml-auto">{notes.length}字</span>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(notes)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? "✓ コピー済" : "コピー"}
            </button>
          </>
        )}
      </div>
      <textarea
        value={notes}
        onChange={handleChange}
        placeholder="面接官の印象、選考の感触、企業研究メモ..."
        className="w-full min-h-[80px] text-sm p-3 bg-muted/50 rounded-xl border-0 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/50"
        rows={4}
      />
    </div>
  )
}

function AiNoteSummaryButton({ notes, companyName }: { notes: { title: string; content: string }[]; companyName: string }) {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

  const handleSummarize = async () => {
    setLoading(true)
    try {
      const text = `企業: ${companyName}\n\n` + notes.map((n) => `【${n.title}】\n${n.content}`).join("\n\n")
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "company_notes", text }),
      })
      if (res.ok) {
        const data = await res.json()
        setSummary(data.summary)
      } else {
        toast.error("AI要約に失敗しました")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={summary ? () => setSummary(null) : handleSummarize}
        disabled={loading}
        className="text-xs gap-1.5"
      >
        <Sparkles className="h-3 w-3" />
        {loading ? "要約中..." : summary ? "要約を閉じる" : "AIで要約"}
      </Button>
      {summary && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm whitespace-pre-wrap">
          {summary}
        </div>
      )}
    </div>
  )
}

function AiInterviewPrepButton({ company }: { company: FullCompany }) {
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<string | null>(null)

  const pastQuestions = company.interviewLogs
    .filter((l) => l.questions)
    .flatMap((l) => (l.questions ?? "").split("\n").filter((q: string) => q.trim()))
    .slice(0, 5)
  const esThemes = company.entrySheets
    .flatMap((es) => es.questions)
    .filter((q) => q.question)
    .map((q) => q.question)
    .slice(0, 3)
  const buildInfo = () => [
    company.name,
    company.industry ? `業界: ${company.industry}` : "",
    company.position ? `職種: ${company.position}` : "",
    company.notes ? `メモ: ${company.notes}` : "",
    pastQuestions.length > 0 ? `過去の面接質問:\n${pastQuestions.map((q: string) => `・${q}`).join("\n")}` : "",
    esThemes.length > 0 ? `ES設問テーマ:\n${esThemes.map((q) => `・${q}`).join("\n")}` : "",
  ].filter(Boolean).join("\n\n")

  const handleGenerate = async () => {
    const info = buildInfo()

    setLoading(true)
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: info, type: "reverse_questions" }),
      })
      if (res.ok) {
        const { summary } = await res.json()
        setQuestions(summary)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFullPrep = async () => {
    const info = buildInfo()

    setLoading(true)
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: info, type: "interview_full_prep" }),
      })
      if (res.ok) {
        const { summary } = await res.json()
        setQuestions(summary)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {questions ? (
        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 bg-blue-50/50 p-2 rounded whitespace-pre-wrap">
          {questions}
          <button onClick={() => setQuestions(null)} className="block text-[10px] text-muted-foreground mt-1 hover:text-foreground">閉じる</button>
        </div>
      ) : (
        <div className="flex gap-1">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="text-[10px] text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors"
          >
            {loading ? "⏳" : "✨ AI逆質問"}
          </button>
          <span className="text-[10px] text-muted-foreground">|</span>
          <button
            onClick={handleFullPrep}
            disabled={loading}
            className="text-[10px] text-violet-600 hover:text-violet-800 dark:text-violet-400 transition-colors"
          >
            フル準備ガイド
          </button>
        </div>
      )}
    </div>
  )
}

function AiWithdrawalEmailButton({ company }: { company: FullCompany }) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (email) { setEmail(null); return }
    setLoading(true)
    try {
      const text = [
        `企業名: ${company.name}`,
        company.position ? `志望職種: ${company.position}` : "",
        company.industry ? `業界: ${company.industry}` : "",
      ].filter(Boolean).join("\n")
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type: "withdrawal_email" }),
      })
      if (res.ok) {
        const data = await res.json()
        setEmail(data.summary)
      } else {
        toast.error("AI生成に失敗しました")
      }
    } finally {
      setLoading(false)
    }
  }

  if (email) {
    return (
      <div className="w-full mt-2 space-y-2">
        <div className="bg-zinc-50 dark:bg-zinc-900/30 border rounded-xl p-3 text-xs whitespace-pre-wrap">
          {email}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(email); toast.success("コピーしました") }}
            className="text-xs text-primary hover:underline"
          >
            📋 コピー
          </button>
          <button onClick={() => setEmail(null)} className="text-xs text-muted-foreground hover:text-foreground">閉じる</button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="text-xs flex items-center gap-1 text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 transition-colors"
    >
      <Sparkles className="h-3 w-3" />
      {loading ? "生成中..." : "AI辞退メール"}
    </button>
  )
}

function AiFinalInterviewPrepButton({ company }: { company: FullCompany }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (result) { setResult(null); return }
    setLoading(true)
    try {
      const text = [
        `企業名: ${company.name}`,
        company.position ? `志望職種: ${company.position}` : "",
        company.industry ? `業界: ${company.industry}` : "",
        company.notes ? `メモ: ${company.notes}` : "",
        `面接ラウンド: 最終面接`,
        `これまでの面接回数: ${company.interviewLogs?.length ?? 0}回`,
      ].filter(Boolean).join("\n")
      const res = await fetch("/api/ai/summarize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, type: "final_interview_prep" }) })
      if (res.ok) { const data = await res.json(); setResult(data.summary) }
      else toast.error("AI生成に失敗しました")
    } finally { setLoading(false) }
  }

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading} className="text-[10px] flex items-center gap-1 text-orange-600 hover:text-orange-800 dark:text-orange-400 transition-colors font-medium">
        <Sparkles className="h-3 w-3" />
        {loading ? "⏳" : result ? "閉じる" : "🔥 最終対策AI"}
      </button>
      {result && <div className="mt-2 text-xs bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 rounded-xl p-2 whitespace-pre-wrap">{result}</div>}
    </div>
  )
}

function AiInternshipStrategyButton({ company }: { company: FullCompany }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (result) { setResult(null); return }
    setLoading(true)
    try {
      const text = [
        `企業名: ${company.name}`,
        company.position ? `インターン名: ${company.position}` : "",
        company.industry ? `業界: ${company.industry}` : "",
        company.notes ? `メモ: ${company.notes}` : "",
      ].filter(Boolean).join("\n")
      const res = await fetch("/api/ai/summarize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, type: "internship_strategy" }) })
      if (res.ok) { const data = await res.json(); setResult(data.summary) }
      else toast.error("AI生成に失敗しました")
    } finally { setLoading(false) }
  }

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading} className="text-[10px] flex items-center gap-1 text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 transition-colors font-medium">
        <Sparkles className="h-3 w-3" />
        {loading ? "⏳" : result ? "閉じる" : "🎯 インターン戦略AI"}
      </button>
      {result && <div className="mt-2 text-xs bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 rounded-xl p-2 whitespace-pre-wrap">{result}</div>}
    </div>
  )
}

function AiMotivationButton({ company }: { company: FullCompany }) {
  const [loading, setLoading] = useState(false)
  const [motivation, setMotivation] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (motivation) { setMotivation(null); return }
    setLoading(true)
    try {
      const notes = company.companyNotes.map((n) => n.content).filter(Boolean).join("\n")
      const text = [
        `企業名: ${company.name}`,
        company.industry ? `業界: ${company.industry}` : "",
        company.position ? `志望職種: ${company.position}` : "",
        company.notes ? `企業メモ: ${company.notes}` : "",
        notes ? `企業研究ノート:\n${notes.slice(0, 800)}` : "",
      ].filter(Boolean).join("\n\n")
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type: "motivation_statement" }),
      })
      if (res.ok) {
        const data = await res.json()
        setMotivation(data.summary)
      } else {
        toast.error("AI生成に失敗しました")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="text-xs flex items-center gap-1 text-violet-600 hover:text-violet-800 dark:text-violet-400 transition-colors"
      >
        <Sparkles className="h-3 w-3" />
        {loading ? "生成中..." : motivation ? "閉じる" : "AI志望動機ドラフト"}
      </button>
      {motivation && (
        <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/50 rounded-xl p-3 text-sm whitespace-pre-wrap leading-relaxed">
          {motivation}
          <div className="flex gap-2 mt-2 pt-2 border-t border-violet-200 dark:border-violet-800/30">
            <button
              onClick={() => { navigator.clipboard.writeText(motivation); toast.success("コピーしました") }}
              className="text-[10px] text-violet-600 hover:text-violet-800 transition-colors"
            >
              📋 コピー
            </button>
            <button
              onClick={() => setMotivation(null)}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AddAttachmentForm({ companyId, onAdded }: { companyId: string; onAdded: (att: Attachment) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/companies/${companyId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, kind: "link" }),
      })
      if (res.ok) {
        const att = await res.json()
        onAdded(att)
        setName(""); setUrl(""); setShowForm(false)
        toast.success("リンクを追加しました")
      }
    } finally {
      setSaving(false)
    }
  }

  if (showForm) {
    return (
      <div className="p-3 border rounded-xl border-dashed space-y-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="名前 (例: 採用ページ)" className="h-7 text-sm" autoFocus />
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL (https://...)" type="url" className="h-7 text-sm" />
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>キャンセル</Button>
          <Button size="sm" onClick={handleAdd} disabled={saving || !name.trim() || !url.trim()}>追加</Button>
        </div>
      </div>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="w-full border-dashed gap-1.5">
      <Plus className="h-3.5 w-3.5" />
      リンクを追加
    </Button>
  )
}

function QuickNoteCreateButton({
  label, companyId, category, content, onCreated,
}: { label: string; companyId: string; category: string; content: string; onCreated: (note: Note) => void }) {
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: label, content, companyId, category }),
      })
      if (res.ok) {
        const note = await res.json()
        onCreated(note)
        toast.success(`「${label}」ノートを作成しました`)
      } else {
        toast.error("作成に失敗しました")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "text-xs gap-1 border border-dashed",
        loading && "opacity-50 cursor-not-allowed"
      )}
    >
      <Plus className="h-3 w-3" />
      {loading ? "作成中..." : label}
    </button>
  )
}

function QuickTaskAdd({ companyId, onAdded }: { companyId: string; onAdded: (task: Task) => void }) {
  const [title, setTitle] = useState("")
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), status: "todo", priority: 3, companyId }),
      })
      if (res.ok) {
        const task = await res.json()
        onAdded(task)
        setTitle("")
        toast.success("タスクを追加しました")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex gap-1.5">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タスクを追加..."
        className="h-7 text-sm flex-1"
        onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
      />
      <Button size="sm" onClick={handleAdd} disabled={saving || !title.trim()} className="h-7 text-xs px-2">
        追加
      </Button>
    </div>
  )
}
