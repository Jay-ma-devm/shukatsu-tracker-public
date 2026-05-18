"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { interviewLogSchema, type InterviewLogSchema } from "@/lib/validators/interview-log"
import { INTERVIEW_TYPES } from "@/lib/constants"
import type { InterviewLog } from "@/types"

type LogWithData = InterviewLog & {
  company: { id: string; name: string }
  stage: { id: string; name: string } | null
}
type CompanyOption = { id: string; name: string }

interface InterviewFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  log?: LogWithData
  companies: CompanyOption[]
  onSuccess: (log: unknown) => void
  defaultCompanyId?: string
}

export function InterviewFormModal({ open, onOpenChange, log, companies, onSuccess, defaultCompanyId }: InterviewFormModalProps) {
  const isEdit = !!log
  const [stages, setStages] = useState<{ id: string; name: string }[]>([])
  const [generatingAi, setGeneratingAi] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<InterviewLogSchema>({
    resolver: zodResolver(interviewLogSchema),
    defaultValues: {
      companyId: log?.companyId ?? defaultCompanyId ?? "",
      type: (log?.type as InterviewLogSchema["type"]) ?? "1st",
      conductedAt: log?.conductedAt ? format(new Date(log.conductedAt), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      duration: log?.duration ?? undefined,
      interviewerName: log?.interviewerName ?? "",
      interviewerRole: log?.interviewerRole ?? "",
      questions: log?.questions ?? "",
      myAnswers: log?.myAnswers ?? "",
      feedback: log?.feedback ?? "",
      rating: log?.rating ?? undefined,
      outcome: (log?.outcome as InterviewLogSchema["outcome"]) ?? undefined,
      nextStepNotes: log?.nextStepNotes ?? "",
    },
  })

  const companyId = watch("companyId")
  useEffect(() => {
    if (!companyId) { setStages([]); return }
    fetch(`/api/companies/${companyId}/stages`).then((r) => r.ok ? r.json() : []).then(setStages).catch(() => setStages([]))
  }, [companyId])

  const onSubmit = async (data: InterviewLogSchema) => {
    const url = isEdit ? `/api/interviews/${log!.id}` : "/api/interviews"
    const method = isEdit ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        interviewerName: data.interviewerName || undefined,
        interviewerRole: data.interviewerRole || undefined,
        questions: data.questions || undefined,
        myAnswers: data.myAnswers || undefined,
        feedback: data.feedback || undefined,
        nextStepNotes: data.nextStepNotes || undefined,
        outcome: data.outcome || undefined,
      }),
    })

    if (!res.ok) {
      toast.error(isEdit ? "更新に失敗しました" : "追加に失敗しました")
      return
    }

    const result = await res.json()
    if (!isEdit && data.companyId) {
      toast.success("面接ログを記録しました", {
        action: {
          label: "ステージを更新",
          onClick: () => { window.location.href = `/companies/${data.companyId}?tab=stages` },
        },
        duration: 5000,
      })
    } else {
      toast.success(isEdit ? "面接ログを更新しました" : "面接ログを記録しました")
    }
    onSuccess(result)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "面接ログを編集" : "面接ログを記録"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>企業 *</Label>
              <Select value={watch("companyId")} onValueChange={(v: string | null) => setValue("companyId", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="企業を選択" /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.companyId && <p className="text-xs text-destructive">{errors.companyId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>面接種別</Label>
              <Select value={watch("type")} onValueChange={(v: string | null) => setValue("type", (v ?? "1st") as InterviewLogSchema["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTERVIEW_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {stages.length > 0 && (
              <div className="space-y-1.5">
                <Label>選考ステージ</Label>
                <Select value={watch("stageId") ?? ""} onValueChange={(v: string | null) => setValue("stageId", v || undefined)}>
                  <SelectTrigger><SelectValue placeholder="ステージを選択 (任意)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">なし</SelectItem>
                    {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="conductedAt">実施日 *</Label>
              <Input id="conductedAt" {...register("conductedAt")} type="date" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="interviewerName">面接官名</Label>
              <Input id="interviewerName" {...register("interviewerName")} placeholder="例: 田中さん" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="interviewerRole">面接官の役職</Label>
                <div className="flex gap-1">
                  {["人事", "マネージャー", "エンジニア", "役員"].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setValue("interviewerRole", role)}
                      className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <Input id="interviewerRole" {...register("interviewerRole")} placeholder="例: マネージャー" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="duration">面接時間 (分)</Label>
              <Input id="duration" {...register("duration", { valueAsNumber: true })} type="number" placeholder="45" />
            </div>

            <div className="space-y-1.5">
              <Label>結果</Label>
              <Select value={watch("outcome") ?? ""} onValueChange={(v: string | null) => setValue("outcome", (v || undefined) as InterviewLogSchema["outcome"])}>
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">未確定</SelectItem>
                  <SelectItem value="passed">通過</SelectItem>
                  <SelectItem value="failed">不通過</SelectItem>
                  <SelectItem value="pending">結果待ち</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <Label>自己評価</Label>
                <span className="text-[10px] text-muted-foreground">
                  {watch("rating") === 1 ? "😟 準備不足" :
                   watch("rating") === 2 ? "😐 改善必要" :
                   watch("rating") === 3 ? "🙂 普通" :
                   watch("rating") === 4 ? "😊 良かった" :
                   watch("rating") === 5 ? "🎉 完璧" : ""}
                </span>
              </div>
              <div className="flex items-center gap-1 py-1">
                {[1,2,3,4,5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setValue("rating", watch("rating") === r ? undefined : r)}
                    title={["準備不足","改善必要","普通","良かった","完璧"][r-1]}
                    className={`text-xl transition-colors ${(watch("rating") ?? 0) >= r ? "text-amber-400" : "text-muted-foreground/30 hover:text-amber-200"}`}
                  >
                    ★
                  </button>
                ))}
                {watch("rating") && (
                  <button type="button" onClick={() => setValue("rating", undefined)} className="text-xs text-muted-foreground ml-1">✕</button>
                )}
              </div>
            </div>
          </div>

          {[
            { name: "questions" as const, label: "聞かれた質問", templates: [
              "・自己紹介をしてください\n・学生時代に最も力を入れたことを教えてください\n・当社を志望した理由を教えてください\n・あなたの強みと弱みを教えてください\n・入社後にやりたいことを教えてください",
            ], aiGenerate: true },
            { name: "myAnswers" as const, label: "自分の回答メモ" },
            { name: "feedback" as const, label: "振り返り・改善点", templates: ["【良かった点】\n・\n\n【改善点】\n・\n\n【次回の対策】\n・"] },
            { name: "nextStepNotes" as const, label: "次のステップ", aiNextStep: true },
          ].map(({ name, label, templates, aiGenerate, aiNextStep }: { name: "questions" | "myAnswers" | "feedback" | "nextStepNotes"; label: string; templates?: string[]; aiGenerate?: boolean; aiNextStep?: boolean }) => (
            <div key={name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor={name}>{label}</Label>
                <div className="flex items-center gap-2">
                  {aiGenerate && watch("companyId") && (
                    <button
                      type="button"
                      disabled={generatingAi}
                      onClick={async () => {
                        const selectedCompany = companies.find((c) => c.id === watch("companyId"))
                        if (!selectedCompany) return
                        setGeneratingAi(true)
                        try {
                          const res = await fetch("/api/ai/summarize", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ text: selectedCompany.name, type: "interview_prep" }),
                          })
                          if (res.ok) {
                            const { summary } = await res.json()
                            const current = (watch("questions") ?? "")
                            setValue("questions", current ? current + "\n\n" + summary : summary)
                          }
                        } finally {
                          setGeneratingAi(false)
                        }
                      }}
                      className="text-[10px] text-primary hover:text-primary/80 transition-colors"
                    >
                      {generatingAi ? "⏳" : "✨ AI提案"}
                    </button>
                  )}
                  {templates && (
                    <button
                      type="button"
                      onClick={() => {
                        const current = (document.getElementById(name) as HTMLTextAreaElement)?.value ?? ""
                        const template = templates[0]
                        if (template) {
                          const newVal = current ? current + "\n" + template : template
                          const nativeInputSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set
                          const el = document.getElementById(name) as HTMLTextAreaElement
                          nativeInputSetter?.call(el, newVal)
                          el.dispatchEvent(new Event("input", { bubbles: true }))
                        }
                      }}
                      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      📋 テンプレート
                    </button>
                  )}
                  {aiNextStep && (watch("feedback") || watch("questions")) && (
                    <button
                      type="button"
                      disabled={generatingAi}
                      onClick={async () => {
                        const text = [
                          watch("questions") ? `質問: ${watch("questions")}` : "",
                          watch("myAnswers") ? `回答: ${watch("myAnswers")}` : "",
                          watch("feedback") ? `振り返り: ${watch("feedback")}` : "",
                        ].filter(Boolean).join("\n\n")
                        setGeneratingAi(true)
                        try {
                          const res = await fetch("/api/ai/summarize", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ text, type: "interview_next_step" }),
                          })
                          if (res.ok) {
                            const { summary } = await res.json()
                            setValue("nextStepNotes", summary)
                          }
                        } finally {
                          setGeneratingAi(false)
                        }
                      }}
                      className="text-[10px] text-primary hover:text-primary/80 transition-colors"
                    >
                      {generatingAi ? "⏳" : "✨ AI提案"}
                    </button>
                  )}
                </div>
              </div>
              <Textarea id={name} {...register(name)} rows={3} />
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>キャンセル</Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : isEdit ? "更新" : "記録する"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
