"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
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
import { caseLogSchema, type CaseLogSchema } from "@/lib/validators/case"
import { CASE_CATEGORIES } from "@/lib/constants"
import type { CaseLog, Company } from "@/types"

type CaseWithCompany = CaseLog & { company: { id: string; name: string } | null }
type CompanyOption = { id: string; name: string }

interface CaseFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseLog?: CaseWithCompany
  companies: CompanyOption[]
  onSuccess: (caseLog: CaseWithCompany) => void
  initialDuration?: number
  initialTitle?: string
}

export function CaseFormModal({ open, onOpenChange, caseLog, companies, onSuccess, initialDuration, initialTitle }: CaseFormModalProps) {
  const isEdit = !!caseLog

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CaseLogSchema>({
    resolver: zodResolver(caseLogSchema),
    defaultValues: {
      title: caseLog?.title ?? initialTitle ?? "",
      category: caseLog?.category ?? "",
      prompt: caseLog?.prompt ?? "",
      premise: caseLog?.premise ?? "",
      structure: caseLog?.structure ?? "",
      analysis: caseLog?.analysis ?? "",
      conclusion: caseLog?.conclusion ?? "",
      feedback: caseLog?.feedback ?? "",
      rating: caseLog?.rating ?? undefined,
      difficulty: caseLog?.difficulty ?? 3,
      duration: caseLog?.duration ?? initialDuration ?? undefined,
      practiceWith: caseLog?.practiceWith ?? "",
      tags: caseLog?.tags ?? "",
      companyId: caseLog?.companyId ?? "",
    },
  })

  const onSubmit = async (data: CaseLogSchema) => {
    const url = isEdit ? `/api/cases/${caseLog!.id}` : "/api/cases"
    const method = isEdit ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        companyId: data.companyId || undefined,
      }),
    })

    if (!res.ok) {
      toast.error(isEdit ? "更新に失敗しました" : "追加に失敗しました")
      return
    }

    const result = await res.json()
    toast.success(isEdit ? "ケースを更新しました" : "ケースを記録しました")
    onSuccess(result)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "ケースを編集" : "ケースを記録"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* クイックタイトル候補 */}
          {!watch("title") && (
            <div className="flex flex-wrap gap-1">
              {["市場規模推定", "売上向上施策", "新規事業立案", "コスト削減"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue("title", `${t}ケース`)}
                  className="text-[10px] bg-muted/80 hover:bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="title">タイトル *</Label>
              <Input id="title" {...register("title")} placeholder="例: スタバ売上向上ケース" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>カテゴリ</Label>
              <Select value={watch("category")} onValueChange={(v: string | null) => setValue("category", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>
                  {CASE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>企業</Label>
              <Select value={watch("companyId") ?? ""} onValueChange={(v: string | null) => setValue("companyId", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">なし</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <Label>難易度</Label>
                <span className="text-[10px] text-muted-foreground">
                  {watch("difficulty") === 1 ? "基礎" : watch("difficulty") === 2 ? "やや基礎" : watch("difficulty") === 3 ? "標準" : watch("difficulty") === 4 ? "応用" : "難関"}
                </span>
              </div>
              <Select value={String(watch("difficulty"))} onValueChange={(v: string | null) => setValue("difficulty", parseInt(v ?? "3"))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[
                    [1, "基礎（数字系・単純な推定）"],
                    [2, "やや基礎（基本フレームワーク）"],
                    [3, "標準（典型的な戦略ケース）"],
                    [4, "応用（複合課題・データ分析）"],
                    [5, "難関（マッキンゼー・BCGレベル）"],
                  ].map(([d, label]) => (
                    <SelectItem key={d} value={String(d)}>{"⭐".repeat(Number(d))} {label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>自己評価 (1-5)</Label>
              <div className="flex items-center gap-1 py-1">
                {[1,2,3,4,5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setValue("rating", watch("rating") === r ? undefined : r)}
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt">問い *</Label>
              <div className="flex flex-wrap gap-1">
                {!watch("prompt") && [
                  "売上向上策",
                  "市場規模推定",
                  "コスト削減",
                  "新規事業",
                  "M&A評価",
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setValue("prompt", `[企業名]の${q}を提案してください。`)}
                    className="text-[9px] text-muted-foreground hover:text-primary transition-colors border rounded px-1 py-0.5"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <Textarea id="prompt" {...register("prompt")} rows={2} placeholder="例: スターバックスの日本国内での売上を1.5倍にするためにどうするか？" />
          </div>

          {[
            { name: "premise" as const, label: "前提確認", template: "・対象市場/地域:\n・期間:\n・除外条件:\n・目標値:" },
            { name: "structure" as const, label: "構造化", template: "【課題の分解】\n・要因A:\n  - サブ要因1:\n  - サブ要因2:\n・要因B:\n  - サブ要因1:\n  - サブ要因2:\n\n【優先度】\n→ 最も重要な要因:" },
            { name: "analysis" as const, label: "分析" },
            { name: "conclusion" as const, label: "結論", template: "結論: \n\n理由:\n1. \n2. \n3. \n\nネクストステップ:" },
            { name: "feedback" as const, label: "振り返り・フィードバック", template: "良かった点:\n・\n\n改善点:\n・\n\n次回のアクション:\n・" },
          ].map(({ name, label, template }) => (
            <div key={name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor={name}>{label}</Label>
                {template && !watch(name) && (
                  <button
                    type="button"
                    onClick={() => setValue(name, template)}
                    className="text-[10px] text-muted-foreground hover:text-primary transition-colors underline"
                  >
                    テンプレ
                  </button>
                )}
              </div>
              <Textarea id={name} {...register(name)} rows={3} />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="duration">所要時間 (分)</Label>
              <Input id="duration" {...register("duration", { valueAsNumber: true })} type="number" min={1} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="practiceWith">練習相手</Label>
                <div className="flex gap-1">
                  {["1人", "友人", "コーチ"].map((p) => (
                    <button key={p} type="button" onClick={() => setValue("practiceWith", p)} className="text-[10px] text-muted-foreground hover:text-primary">{p}</button>
                  ))}
                </div>
              </div>
              <Input id="practiceWith" {...register("practiceWith")} placeholder="例: 1人 / 友人 / コーチ" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="tags">タグ (カンマ区切り)</Label>
              <div className="flex flex-wrap gap-1 justify-end">
                {["市場規模", "コスト削減", "新規事業", "M&A", "デジタル化", "海外展開"].map((tag) => (
                  <button key={tag} type="button"
                    onClick={() => {
                      const cur = watch("tags") ?? ""
                      const tags = cur.split(",").map(t => t.trim()).filter(Boolean)
                      if (!tags.includes(tag)) setValue("tags", [...tags, tag].join(","))
                    }}
                    className="text-[9px] px-1.5 py-0.5 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground transition-colors"
                  >+{tag}</button>
                ))}
              </div>
            </div>
            <Input id="tags" {...register("tags")} placeholder="例: 市場規模推定,コスト削減" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : isEdit ? "更新する" : "記録する"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
