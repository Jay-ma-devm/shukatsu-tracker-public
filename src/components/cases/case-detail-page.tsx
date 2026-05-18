"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Pencil, Trash2, Star, Clock, BookOpen, Printer, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { CaseFormModal } from "./case-form-modal"
import { CaseTimer } from "./case-timer"
import { formatDatetime } from "@/lib/utils/date"
import type { CaseLog, Company } from "@/types"
import { cn } from "@/lib/utils"

type CaseWithCompany = CaseLog & { company: Company | null }
type CompanyOption = { id: string; name: string }

interface CaseDetailPageClientProps {
  caseLog: CaseWithCompany
  companies: CompanyOption[]
  prevCaseId?: string | null
  nextCaseId?: string | null
}

export function CaseDetailPageClient({ caseLog: initialCase, companies, prevCaseId, nextCaseId }: CaseDetailPageClientProps) {
  const router = useRouter()
  const [caseLog, setCaseLog] = useState(initialCase)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [aiFeedback, setAiFeedback] = useState<string | null>(null)
  const [generatingFeedback, setGeneratingFeedback] = useState(false)
  const [aiPractice, setAiPractice] = useState<string | null>(null)
  const [generatingPractice, setGeneratingPractice] = useState(false)

  const handleAiFeedback = async () => {
    const text = [
      `問い: ${caseLog.prompt}`,
      caseLog.premise ? `前提: ${caseLog.premise}` : "",
      caseLog.structure ? `構造化: ${caseLog.structure}` : "",
      caseLog.analysis ? `分析: ${caseLog.analysis}` : "",
      caseLog.conclusion ? `結論: ${caseLog.conclusion}` : "",
    ].filter(Boolean).join("\n\n")

    setGeneratingFeedback(true)
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type: "case_feedback" }),
      })
      if (res.ok) {
        const { summary } = await res.json()
        setAiFeedback(summary)
      } else {
        toast.error("AIフィードバックの取得に失敗しました")
      }
    } finally {
      setGeneratingFeedback(false)
    }
  }

  const handleDelete = async () => {
    const res = await fetch(`/api/cases/${caseLog.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("ケースを削除しました")
      router.push("/cases")
    }
  }

  const sections = [
    { label: "問い", value: caseLog.prompt, required: true },
    { label: "前提確認", value: caseLog.premise },
    { label: "構造化", value: caseLog.structure },
    { label: "分析", value: caseLog.analysis },
    { label: "結論", value: caseLog.conclusion },
    { label: "振り返り・フィードバック", value: caseLog.feedback },
  ]

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <Link
            href="/cases"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 -ml-2")}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            ケース一覧
          </Link>
          {prevCaseId && (
            <Link href={`/cases/${prevCaseId}`} className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))} title="前のケース">
              ‹
            </Link>
          )}
          {nextCaseId && (
            <Link href={`/cases/${nextCaseId}`} className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))} title="次のケース">
              ›
            </Link>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={handleAiFeedback} disabled={generatingFeedback} title="AIフィードバック">
            <Sparkles className={cn("h-4 w-4", generatingFeedback && "animate-pulse text-primary")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (aiPractice) { setAiPractice(null); return }
              const text = [
                `問い: ${caseLog.prompt}`,
                caseLog.feedback ? `振り返り: ${caseLog.feedback}` : "",
                caseLog.category ? `カテゴリ: ${caseLog.category}` : "",
              ].filter(Boolean).join("\n")
              setGeneratingPractice(true)
              try {
                const res = await fetch("/api/ai/summarize", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ text, type: "case_next_practice" }),
                })
                if (res.ok) {
                  const { summary } = await res.json()
                  setAiPractice(summary)
                }
              } finally {
                setGeneratingPractice(false)
              }
            }}
            disabled={generatingPractice}
            title="AI練習問題を生成"
            className="h-7 text-xs gap-1"
          >
            {generatingPractice ? "⏳" : aiPractice ? "問題を閉じる" : "✨ 練習問題"}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => window.print()} title="印刷">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setShowEdit(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowDelete(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold">{caseLog.title}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {caseLog.category && (
            <>
              <Badge variant="outline">{caseLog.category}</Badge>
              <Link
                href={`/cases?category=${encodeURIComponent(caseLog.category)}`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                → 同カテゴリ一覧
              </Link>
            </>
          )}
          {caseLog.difficulty && (
            <Badge variant="outline" className={cn(
              caseLog.difficulty >= 4 ? "border-red-300 text-red-600" :
              caseLog.difficulty >= 3 ? "border-amber-300 text-amber-600" : "border-green-300 text-green-600"
            )}>
              難易度 {"⭐".repeat(caseLog.difficulty)}
            </Badge>
          )}
          {caseLog.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium">{caseLog.rating}/5</span>
            </div>
          )}
          {caseLog.company && (
            <div className="flex items-center gap-2">
              <Link
                href={`/companies/${caseLog.company.id}`}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                {caseLog.company.name}
              </Link>
              <Link
                href={`/companies/${caseLog.company.id}?tab=interviews`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                → 面接ログ
              </Link>
              <Link
                href={`/companies/${caseLog.company.id}?tab=es`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                → ES
              </Link>
              <Link
                href={`/companies/${caseLog.company.id}?tab=stages`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                → ステージ
              </Link>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
          {caseLog.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {caseLog.duration}分
            </span>
          )}
          {caseLog.practiceWith && (
            <span>練習相手: {caseLog.practiceWith}</span>
          )}
          <span>{formatDatetime(caseLog.createdAt)}</span>
        </div>

        {caseLog.tags && (
          <div className="flex flex-wrap gap-1 mt-2">
            {caseLog.tags.split(",").map((tag) => (
              <Link
                key={tag.trim()}
                href={`/cases?tag=${encodeURIComponent(tag.trim())}`}
                className="text-xs bg-muted hover:bg-muted/80 px-2 py-0.5 rounded-full transition-colors"
              >
                #{tag.trim()}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* タイマー + セクション */}
      <div className="flex gap-6 items-start">
        <div className="flex-1 space-y-6">
        {sections.map(({ label, value, required }) => (
          (value || required) && (
            <div key={label}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5" />
                {label}
              </h3>
              {value ? (
                <p className="text-sm whitespace-pre-wrap leading-relaxed bg-muted/30 p-3 rounded-lg">
                  {value}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">未記入</p>
              )}
            </div>
          )
        ))}
        </div>
        <CaseTimer className="shrink-0 hidden md:flex" />
      </div>

      {/* AIフィードバック */}
      {aiFeedback && (
        <div className="rounded-xl border border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-950/20 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              AIフィードバック
            </p>
            <button onClick={() => setAiFeedback(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">閉じる</button>
          </div>
          <p className="text-sm whitespace-pre-wrap text-violet-800 dark:text-violet-200">{aiFeedback}</p>
        </div>
      )}

      {/* AI練習問題 */}
      {aiPractice && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              ✨ AI練習問題
            </p>
            <button onClick={() => setAiPractice(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">閉じる</button>
          </div>
          <p className="text-sm whitespace-pre-wrap text-emerald-800 dark:text-emerald-200">{aiPractice}</p>
        </div>
      )}

      {showEdit && (
        <CaseFormModal
          open={showEdit}
          onOpenChange={setShowEdit}
          caseLog={caseLog}
          companies={companies}
          onSuccess={(updated) => {
            setCaseLog(updated as typeof caseLog)
            setShowEdit(false)
          }}
        />
      )}

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="ケースを削除しますか？"
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
