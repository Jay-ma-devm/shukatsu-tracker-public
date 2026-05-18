"use client"

import { useState, useMemo, useEffect } from "react"
import { Sparkles, ChevronRight, RotateCcw, X } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface PracticeQuestion {
  question: string
  companyName: string
  interviewType: string
}

interface InterviewPracticeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  questions: PracticeQuestion[]
}

export function InterviewPracticeModal({ open, onOpenChange, questions }: InterviewPracticeModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState("")
  const [feedback, setFeedback] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [companyFilter, setCompanyFilter] = useState<string>("all")

  const companies = useMemo(() => Array.from(new Set(questions.map((q) => q.companyName))).sort(), [questions])

  const filteredQuestions = useMemo(() =>
    companyFilter === "all" ? questions : questions.filter((q) => q.companyName === companyFilter),
    [questions, companyFilter]
  )

  const shuffled = useMemo(() => {
    const arr = [...filteredQuestions]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, companyFilter])

  const current = shuffled[currentIdx % shuffled.length]

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        if (showAnswer) handleNext()
        else handleGetFeedback()
      }
      if (e.key === "ArrowRight" && showAnswer) handleNext()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, showAnswer, answer])

  const handleGetFeedback = async () => {
    if (!answer.trim()) {
      toast.error("回答を入力してください")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "interview_answer_feedback",
          text: `【質問】\n${current.question}\n\n【回答】\n${answer}`,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setFeedback(data.summary)
        setShowAnswer(true)
      } else {
        toast.error("フィードバックの取得に失敗しました")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    setCurrentIdx((prev) => prev + 1)
    setAnswer("")
    setFeedback(null)
    setShowAnswer(false)
  }

  const handleReset = () => {
    setCurrentIdx(0)
    setAnswer("")
    setFeedback(null)
    setShowAnswer(false)
  }

  if (!current) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            面接練習モード
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 企業フィルター */}
          {companies.length > 1 && (
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => { setCompanyFilter("all"); setCurrentIdx(0); setAnswer(""); setFeedback(null); setShowAnswer(false) }}
                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${companyFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                全企業
              </button>
              {companies.map((c) => (
                <button key={c}
                  onClick={() => { setCompanyFilter(c); setCurrentIdx(0); setAnswer(""); setFeedback(null); setShowAnswer(false) }}
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${companyFilter === c ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* 進捗 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{currentIdx % shuffled.length + 1} / {shuffled.length} 問</span>
            <div className="flex items-center gap-2">
              <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{current.companyName}</span>
              <button onClick={handleReset} className="hover:text-foreground transition-colors">
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* 進捗バー */}
          <div className="bg-muted rounded-full h-1">
            <div
              className="bg-primary h-1 rounded-full transition-all"
              style={{ width: `${((currentIdx % shuffled.length + 1) / shuffled.length) * 100}%` }}
            />
          </div>

          {/* 質問 */}
          <div className="bg-muted/40 rounded-xl p-4 border">
            <p className="text-sm font-medium leading-relaxed">{current.question}</p>
          </div>

          {/* 回答入力 */}
          {!showAnswer ? (
            <div className="space-y-2">
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="回答を入力してください..."
                rows={5}
                className="resize-none text-sm"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{answer.length}字
                  <span className="ml-2 opacity-50">⌘↵で評価 · ⌘⇧↵でスキップ</span>
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleNext} className="text-xs">
                    スキップ
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleGetFeedback}
                    disabled={loading || !answer.trim()}
                    className="gap-1.5 text-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {loading ? "評価中..." : "AI評価"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 提出した回答 */}
              <div className="bg-muted/30 rounded-lg p-3 border">
                <p className="text-xs font-medium text-muted-foreground mb-1">あなたの回答</p>
                <p className="text-sm whitespace-pre-wrap">{answer}</p>
              </div>

              {/* AIフィードバック */}
              {feedback && (
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                  <p className="text-xs font-medium text-primary mb-1.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AIフィードバック
                  </p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{feedback}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button size="sm" onClick={handleNext} className="gap-1.5 text-xs">
                  次の質問
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
