"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
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
import { careerEntrySchema, type CareerEntrySchema } from "@/lib/validators/career"
import { CAREER_ENTRY_TYPES } from "@/lib/constants"
import type { CareerEntry } from "@/types"

interface CareerFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry?: CareerEntry
  onSuccess: (entry: unknown) => void
}

export function CareerFormModal({ open, onOpenChange, entry, onSuccess }: CareerFormModalProps) {
  const isEdit = !!entry

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CareerEntrySchema>({
    resolver: zodResolver(careerEntrySchema),
    defaultValues: {
      type: (entry?.type as CareerEntrySchema["type"]) ?? "internship",
      title: entry?.title ?? "",
      organization: entry?.organization ?? "",
      role: entry?.role ?? "",
      startAt: entry?.startAt ? format(new Date(entry.startAt), "yyyy-MM-dd") : "",
      endAt: entry?.endAt ? format(new Date(entry.endAt), "yyyy-MM-dd") : "",
      description: entry?.description ?? "",
      takeaways: entry?.takeaways ?? "",
      skills: entry?.skills ?? "",
      url: entry?.url ?? "",
    },
  })

  const onSubmit = async (data: CareerEntrySchema) => {
    const url = isEdit ? `/api/career/${entry!.id}` : "/api/career"
    const method = isEdit ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        endAt: data.endAt || undefined,
        url: data.url || undefined,
        organization: data.organization || undefined,
        role: data.role || undefined,
        description: data.description || undefined,
        takeaways: data.takeaways || undefined,
        skills: data.skills || undefined,
      }),
    })

    if (!res.ok) {
      toast.error(isEdit ? "更新に失敗しました" : "追加に失敗しました")
      return
    }

    const result = await res.json()
    toast.success(isEdit ? "エントリーを更新しました" : "エントリーを追加しました")
    onSuccess(result)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "エントリーを編集" : "エントリーを追加"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>種別</Label>
              <Select value={watch("type")} onValueChange={(v: string | null) => setValue("type", (v ?? "internship") as CareerEntrySchema["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CAREER_ENTRY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">タイトル *</Label>
              <Input id="title" {...register("title")} placeholder="例: スタートアップ マーケインターン" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="organization">組織・企業名</Label>
              <Input id="organization" {...register("organization")} placeholder="例: 〇〇大学 / 某スタートアップ" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">役割・ポジション</Label>
              <Input id="role" {...register("role")} placeholder="例: マーケティングインターン" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="startAt">開始日 *</Label>
              <Input id="startAt" {...register("startAt")} type="date" />
              {errors.startAt && <p className="text-xs text-destructive">{errors.startAt.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endAt">終了日</Label>
              <Input id="endAt" {...register("endAt")} type="date" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">概要・説明</Label>
            <Textarea id="description" {...register("description")} rows={3} placeholder="活動内容を説明..." />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="takeaways">学び・成果・実績</Label>
            <Textarea id="takeaways" {...register("takeaways")} rows={3} placeholder="・フォロワー数を1.5倍に伸ばした&#10;・KPI設計の方法を学んだ" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="skills">スキル・タグ (カンマ区切り)</Label>
              <div className="flex flex-wrap gap-1 justify-end">
                {["マーケティング", "データ分析", "企画", "リーダーシップ", "コンサル", "Python", "SQL", "SNS運用"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      const cur = watch("skills") ?? ""
                      const current = cur.split(",").map(t => t.trim()).filter(Boolean)
                      if (!current.includes(s)) {
                        setValue("skills", [...current, s].join(","))
                      }
                    }}
                    className="text-[9px] px-1.5 py-0.5 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground transition-colors"
                  >
                    +{s}
                  </button>
                ))}
              </div>
            </div>
            <Input id="skills" {...register("skills")} placeholder="例: SNS運用,データ分析,マーケティング" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="url">URL</Label>
            <Input id="url" {...register("url")} type="url" placeholder="https://..." />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>キャンセル</Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : isEdit ? "更新" : "追加"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
