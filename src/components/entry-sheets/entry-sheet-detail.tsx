"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Save, GripVertical, Printer, Copy, Check, CopyPlus, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ES_STATUSES } from "@/lib/constants"
import { formatDate } from "@/lib/utils/date"
import type { EntrySheet, EsQuestion } from "@/types"
import { cn } from "@/lib/utils"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type SheetWithData = EntrySheet & {
  company: { id: string; name: string }
  questions: EsQuestion[]
}

interface EntrySheetDetailClientProps {
  sheet: SheetWithData
  prevId?: string | null
  nextId?: string | null
}

interface QuestionState {
  id?: string
  question: string
  answer: string
  charLimit?: number | null
  order: number
}

export function EntrySheetDetailClient({ sheet: initialSheet, prevId, nextId }: EntrySheetDetailClientProps) {
  const router = useRouter()
  const [sheet, setSheet] = useState(initialSheet)
  const [questions, setQuestions] = useState<QuestionState[]>(
    initialSheet.questions.map((q) => ({
      id: q.id,
      question: q.question,
      answer: q.answer ?? "",
      charLimit: q.charLimit,
      order: q.order,
    }))
  )
  const [saving, setSaving] = useState(false)
  const [autoSaved, setAutoSaved] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setQuestions((prev) => {
      const oldIdx = prev.findIndex((q, i) => (q.id ?? `new-${i}`) === active.id)
      const newIdx = prev.findIndex((q, i) => (q.id ?? `new-${i}`) === over.id)
      if (oldIdx === -1 || newIdx === -1) return prev
      return arrayMove(prev, oldIdx, newIdx).map((q, i) => ({ ...q, order: i }))
    })
  }

  const handleCopyAnswer = async (idx: number) => {
    const answer = questions[idx]?.answer
    if (!answer) return
    await navigator.clipboard.writeText(answer)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const handleDuplicate = async () => {
    const res = await fetch("/api/entry-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `${sheet.title} (コピー)`, companyId: sheet.company.id, status: "draft" }),
    })
    if (!res.ok) { toast.error("複製に失敗しました"); return }
    const newSheet = await res.json()
    // Copy questions without answers
    await Promise.all(questions.map((q, i) =>
      fetch(`/api/entry-sheets/${newSheet.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.question, charLimit: q.charLimit, order: i }),
      })
    ))
    toast.success("ESを複製しました")
    router.push(`/entry-sheets/${newSheet.id}`)
  }

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { question: "", answer: "", charLimit: undefined, order: prev.length },
    ])
  }

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i })))
  }

  const updateQuestion = (idx: number, field: keyof QuestionState, value: string | number | null) => {
    setQuestions((prev) => {
      const next = prev.map((q, i) => i === idx ? { ...q, [field]: value } : q)
      // debounced auto-save (only when answer changes)
      if (field === "answer") {
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
        autoSaveRef.current = setTimeout(async () => {
          setSaving(true)
          try {
            const res = await fetch(`/api/entry-sheets/${sheet.id}/questions`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                next.map((q, i) => ({
                  question: q.question,
                  answer: q.answer || undefined,
                  charLimit: q.charLimit || undefined,
                  charCount: q.answer?.length ?? 0,
                  order: i,
                }))
              ),
            })
            if (res.ok) {
              const updated = await res.json()
              setQuestions(updated.map((q: EsQuestion) => ({
                id: q.id,
                question: q.question,
                answer: q.answer ?? "",
                charLimit: q.charLimit,
                order: q.order,
              })))
              setAutoSaved(true)
              setTimeout(() => setAutoSaved(false), 2000)
            }
          } finally {
            setSaving(false)
          }
        }, 2000)
      }
      return next
    })
  }

  const saveAll = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/entry-sheets/${sheet.id}/questions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          questions.map((q, i) => ({
            question: q.question,
            answer: q.answer || undefined,
            charLimit: q.charLimit || undefined,
            charCount: q.answer?.length ?? 0,
            order: i,
          }))
        ),
      })
      if (res.ok) {
        toast.success("保存しました")
        const updated = await res.json()
        setQuestions(updated.map((q: EsQuestion) => ({
          id: q.id,
          question: q.question,
          answer: q.answer ?? "",
          charLimit: q.charLimit,
          order: q.order,
        })))
      } else {
        toast.error("保存に失敗しました")
      }
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (status: string) => {
    const res = await fetch(`/api/entry-sheets/${sheet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setSheet((prev) => ({ ...prev, status }))
      toast.success("ステータスを更新しました")
    }
  }

  // Cmd+S でマニュアル保存
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        saveAll()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [saveAll])

  const statusConfig = ES_STATUSES.find((s) => s.value === sheet.status)

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <Link
            href="/entry-sheets"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 -ml-2")}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            ES一覧
          </Link>
          {prevId && (
            <Link href={`/entry-sheets/${prevId}`} className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))} title="前のES">
              ‹
            </Link>
          )}
          {nextId && (
            <Link href={`/entry-sheets/${nextId}`} className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))} title="次のES">
              ›
            </Link>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" className="h-8 w-8" onClick={handleDuplicate} title="ESを複製">
            <CopyPlus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="h-8 w-8" onClick={() => window.print()} title="印刷">
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8"
            onClick={async () => {
              const text = questions
                .filter((q) => q.answer)
                .map((q, i) => `Q${i + 1}. ${q.question}\n${q.answer}`)
                .join("\n\n---\n\n")
              if (!text) return
              await navigator.clipboard.writeText(text)
              toast.success("全回答をコピーしました")
            }}
            title="全回答をコピー"
          >
            <Copy className="h-4 w-4" />
          </Button>
          {autoSaved && <span className="text-xs text-emerald-600">自動保存済み</span>}
          <AiOverallEsButton questions={questions} companyName={sheet.company.name} />
          <Button size="sm" onClick={saveAll} disabled={saving} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      {/* ヘッダー */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold">{sheet.title}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/companies/${sheet.company.id}`} className="text-sm text-muted-foreground hover:text-primary">
            {sheet.company.name}
          </Link>
          <Link href={`/companies/${sheet.company.id}?tab=interviews`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
            → 面接ログ
          </Link>
          <Link href={`/companies/${sheet.company.id}?tab=stages`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
            → ステージ
          </Link>
          <Select value={sheet.status} onValueChange={(v: string | null) => v && updateStatus(v)}>
            <SelectTrigger className="h-7 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ES_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sheet.deadline && (() => {
            const daysLeft = Math.ceil((new Date(sheet.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            const isUrgent = daysLeft <= 3 && !["submitted", "passed", "failed"].includes(sheet.status)
            return (
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                isUrgent ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400" : "text-muted-foreground"
              )}>
                締切: {formatDate(sheet.deadline)}
                {isUrgent && ` (残り${daysLeft <= 0 ? "今日" : `${daysLeft}日`})`}
              </span>
            )
          })()}
        </div>
        {questions.length > 0 && (() => {
          const answeredCount = questions.filter((q) => q.answer.length > 0).length
          const allAnswered = answeredCount === questions.length && questions.length > 0
          const progress = (answeredCount / questions.length) * 100
          return (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-muted rounded-full h-1.5 max-w-xs">
                <div
                  className={cn("h-1.5 rounded-full transition-all", allAnswered ? "bg-emerald-500" : "bg-blue-500")}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={cn("text-xs", allAnswered ? "text-emerald-600 font-medium" : "text-muted-foreground")}>
                {answeredCount}/{questions.length}問 回答済
                {allAnswered && " 🎉"}
              </span>
            </div>
          )
        })()}
      </div>

      {/* 設問一覧 */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={questions.map((q, i) => q.id ?? `new-${i}`)}
          strategy={verticalListSortingStrategy}
        >
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const charCount = q.answer.length
          const isOverLimit = q.charLimit && charCount > q.charLimit
          const isNearLimit = q.charLimit && charCount > q.charLimit * 0.9
          const sortableId = q.id ?? `new-${idx}`

          return (
            <SortableQuestionItem key={sortableId} id={sortableId}>
            <div className={cn(
              "border rounded-xl p-4 space-y-3",
              q.answer && q.answer.length > 0 ? (
                isOverLimit ? "border-l-4 border-l-red-400" :
                isNearLimit ? "border-l-4 border-l-amber-400" :
                "border-l-4 border-l-emerald-400"
              ) : "border-l-4 border-l-muted-foreground/20"
            )}>
              <div className="flex items-start gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-1 shrink-0 cursor-grab active:cursor-grabbing" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground min-w-[20px]">Q{idx + 1}</span>
                    <Input
                      value={q.question}
                      onChange={(e) => updateQuestion(idx, "question", e.target.value)}
                      placeholder="設問を入力..."
                      className="h-7 text-sm flex-1"
                    />
                    <Input
                      value={q.charLimit ?? ""}
                      onChange={(e) => updateQuestion(idx, "charLimit", e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="字数制限"
                      type="number"
                      className="h-7 text-sm w-24"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeQuestion(idx)}
                      className="text-muted-foreground hover:text-destructive h-7 w-7"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <Textarea
                    value={q.answer}
                    onChange={(e) => updateQuestion(idx, "answer", e.target.value)}
                    placeholder="回答を入力..."
                    rows={4}
                    className={cn("text-sm resize-none", isOverLimit && "border-red-400")}
                  />

                  <div className="flex items-center justify-between">
                    {q.charLimit ? (
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs font-mono",
                          isOverLimit ? "text-red-500 font-bold" : isNearLimit ? "text-amber-500" : "text-muted-foreground"
                        )}>
                          {charCount} / {q.charLimit} 字
                        </span>
                        <div className="w-16 bg-muted rounded-full h-1">
                          <div
                            className={cn("h-1 rounded-full transition-all", isOverLimit ? "bg-red-500" : isNearLimit ? "bg-amber-400" : "bg-emerald-500")}
                            style={{ width: `${Math.min(100, (charCount / q.charLimit) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{charCount} 字</span>
                    )}
                    <div className="flex items-center gap-1">
                      {q.question && (!q.answer || q.answer.length < 10) && (
                        <AiEsDraftButton question={q.question} onDraft={(draft) => updateQuestion(idx, "answer", draft)} />
                      )}
                      {q.question && (!q.answer || q.answer.length < 10) && (
                        <PastAnswerButton
                          question={q.question}
                          excludeSheetId={sheet.id}
                          onSelect={(ans) => updateQuestion(idx, "answer", ans)}
                        />
                      )}
                      {q.answer && q.answer.length > 50 && (
                        <AiEsImproveButton question={q.question} answer={q.answer} />
                      )}
                      {q.answer && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs gap-1 text-muted-foreground"
                          onClick={() => handleCopyAnswer(idx)}
                        >
                          {copiedIdx === idx ? (
                            <><Check className="h-3 w-3 text-emerald-500" />コピー済み</>
                          ) : (
                            <><Copy className="h-3 w-3" />コピー</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </SortableQuestionItem>
          )
        })}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={addQuestion}
            className="flex-1 border-dashed gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            設問を追加
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 text-muted-foreground"
            title="インターン向けテンプレートを追加"
            onClick={() => {
              const templates = [
                { question: "インターンシップへの志望動機を教えてください", charLimit: 300 },
                { question: "インターンシップを通じて何を学びたいですか？", charLimit: 300 },
                { question: "チームで成果を出した経験を教えてください", charLimit: 400 },
              ]
              setQuestions((prev) => [
                ...prev,
                ...templates.map((t, i) => ({ question: t.question, answer: "", charLimit: t.charLimit, order: prev.length + i }))
              ])
            }}
          >
            📋 インターンテンプレ
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 text-muted-foreground"
            onClick={() => {
              const templates = [
                { question: "学生時代に最も力を入れたことを教えてください", charLimit: 400 },
                { question: "志望動機を教えてください", charLimit: 400 },
                { question: "自己PRをしてください", charLimit: 400 },
                { question: "あなたの強みと弱みを教えてください", charLimit: 300 },
                { question: "入社後にやりたいことを教えてください", charLimit: 300 },
              ]
              setQuestions((prev) => [
                ...prev,
                ...templates.map((t, i) => ({ question: t.question, answer: "", charLimit: t.charLimit, order: prev.length + i }))
              ])
            }}
          >
            📋 よくある設問を追加
          </Button>
        </div>
      </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableQuestionItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-50 z-10 relative")}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}

function AiOverallEsButton({ questions, companyName }: { questions: { question: string; answer: string }[]; companyName: string }) {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)

  const answeredQuestions = questions.filter((q) => q.answer && q.answer.length > 10)
  if (answeredQuestions.length === 0) return null

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          if (analysis) { setAnalysis(null); return }
          setLoading(true)
          try {
            const text = `企業: ${companyName}\n\n` + answeredQuestions.map((q, i) =>
              `Q${i+1}. ${q.question}\n回答: ${q.answer}`
            ).join("\n\n")
            const res = await fetch("/api/ai/summarize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text, type: "es_improve" }),
            })
            if (res.ok) {
              const { summary } = await res.json()
              setAnalysis(summary)
            }
          } finally {
            setLoading(false)
          }
        }}
        disabled={loading}
        className="gap-1.5 text-xs"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {loading ? "分析中..." : analysis ? "閉じる" : "AI全体分析"}
      </Button>
      {analysis && (
        <div className="mt-2 p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 rounded-xl text-sm whitespace-pre-wrap">
          {analysis}
        </div>
      )}
    </div>
  )
}

function PastAnswerButton({ question, excludeSheetId, onSelect }: {
  question: string
  excludeSheetId: string
  onSelect: (answer: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ id: string; question: string; answer: string; entrySheet: { id: string; title: string; company: { name: string } | null } }[] | null>(null)

  const handleSearch = async () => {
    if (results) { setResults(null); return }
    if (!question.trim()) return
    setLoading(true)
    try {
      const kw = question.slice(0, 20).trim()
      const res = await fetch(`/api/entry-sheets/answers?q=${encodeURIComponent(kw)}&excludeSheet=${excludeSheetId}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-xs gap-1 text-muted-foreground"
        onClick={handleSearch}
        disabled={loading}
      >
        {loading ? "⏳" : results ? "閉じる" : "📋 過去のES参照"}
      </Button>
      {results && results.length > 0 && (
        <div className="mt-1 border rounded-lg divide-y text-xs max-h-48 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => { onSelect(r.answer ?? ""); setResults(null) }}
              className="w-full text-left p-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-1 mb-0.5">
                <span className="font-medium text-primary truncate">{r.entrySheet.company?.name ?? r.entrySheet.title}</span>
              </div>
              <p className="text-muted-foreground line-clamp-2">{r.answer}</p>
            </button>
          ))}
        </div>
      )}
      {results && results.length === 0 && (
        <p className="text-[10px] text-muted-foreground mt-1">過去の類似回答が見つかりません</p>
      )}
    </div>
  )
}

function AiEsImproveButton({ question, answer }: { question: string; answer: string }) {
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `設問: ${question}\n\n回答: ${answer}`, type: "es_improve" }),
      })
      if (res.ok) {
        const { summary } = await res.json()
        setFeedback(summary)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {feedback ? (
        <div className="mt-2 p-2 bg-violet-50 dark:bg-violet-950/20 rounded-lg text-xs text-violet-700 dark:text-violet-300 whitespace-pre-wrap">
          {feedback}
          <button onClick={() => setFeedback(null)} className="block text-[10px] text-muted-foreground mt-1 hover:text-foreground">閉じる</button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs gap-1 text-violet-600 hover:text-violet-800"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "⏳" : "✨ AI改善提案"}
        </Button>
      )}
    </div>
  )
}

function AiEsDraftButton({ question, onDraft }: { question: string; onDraft: (draft: string) => void }) {
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: question, type: "es_draft" }),
      })
      if (res.ok) {
        const { summary } = await res.json()
        onDraft(summary)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 text-xs gap-1 text-emerald-600 hover:text-emerald-800"
      onClick={handleGenerate}
      disabled={loading}
    >
      {loading ? "⏳" : "✨ AI下書き"}
    </Button>
  )
}
