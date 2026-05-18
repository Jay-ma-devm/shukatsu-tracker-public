"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
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
import { EMAIL_CATEGORIES } from "@/lib/constants"
import type { EmailTemplate } from "@/types"

const templateSchema = z.object({
  name: z.string().min(1, "テンプレート名を入力してください"),
  category: z.string().optional(),
  subject: z.string().min(1, "件名を入力してください"),
  body: z.string().min(1, "本文を入力してください"),
  tags: z.string().optional(),
})

type TemplateSchema = z.infer<typeof templateSchema>

interface TemplateFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: EmailTemplate
  onSuccess: (template: EmailTemplate) => void
}

export function TemplateFormModal({ open, onOpenChange, template, onSuccess }: TemplateFormModalProps) {
  const isEdit = !!template
  const [generatingAi, setGeneratingAi] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<TemplateSchema>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name ?? "",
      category: template?.category ?? "",
      subject: template?.subject ?? "",
      body: template?.body ?? "",
      tags: template?.tags ?? "",
    },
  })

  const onSubmit = async (data: TemplateSchema) => {
    const url = isEdit ? `/api/templates/${template!.id}` : "/api/templates"
    const method = isEdit ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      toast.error(isEdit ? "更新に失敗しました" : "追加に失敗しました")
      return
    }

    const result = await res.json()
    toast.success(isEdit ? "テンプレートを更新しました" : "テンプレートを追加しました")
    onSuccess(result)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "テンプレートを編集" : "テンプレートを追加"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">テンプレート名 *</Label>
              <Input id="name" {...register("name")} placeholder="例: 面接後のお礼" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>カテゴリ</Label>
              <Select value={watch("category")} onValueChange={(v: string | null) => setValue("category", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>
                  {EMAIL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subject">件名 *</Label>
            <Input id="subject" {...register("subject")} placeholder="例: 本日の面接のお礼 / Demo User" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <Label htmlFor="body">本文 *</Label>
              <div className="flex flex-wrap gap-1 items-center">
                <button
                  type="button"
                  disabled={generatingAi || !watch("name")}
                  onClick={async () => {
                    const name = watch("name")
                    const category = watch("category")
                    if (!name) { toast.error("テンプレート名を入力してから生成してください"); return }
                    setGeneratingAi(true)
                    try {
                      const res = await fetch("/api/ai/summarize", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          text: `テンプレート名: ${name}\nカテゴリ: ${category || "未設定"}`,
                          type: "email_template",
                        }),
                      })
                      if (res.ok) {
                        const { summary } = await res.json()
                        setValue("body", summary)
                        toast.success("AIでテンプレートを生成しました")
                      }
                    } finally {
                      setGeneratingAi(false)
                    }
                  }}
                  className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded border border-primary/30 hover:bg-primary/20 transition-colors"
                >
                  {generatingAi ? "⏳ 生成中..." : "✨ AIで生成"}
                </button>
                {["{{担当者名}}", "{{企業名}}", "{{氏名}}", "{{大学名}}", "{{日時}}", "{{署名}}"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("body") as HTMLTextAreaElement
                      if (el) {
                        const start = el.selectionStart
                        const end = el.selectionEnd
                        const current = el.value
                        const newVal = current.slice(0, start) + v + current.slice(end)
                        const nativeInputSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set
                        nativeInputSetter?.call(el, newVal)
                        el.dispatchEvent(new Event("input", { bubbles: true }))
                        el.focus()
                        el.setSelectionRange(start + v.length, start + v.length)
                      }
                    }}
                    className="text-[9px] bg-amber-50 text-amber-700 px-1 py-0.5 rounded border border-amber-200 hover:bg-amber-100 transition-colors font-mono"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <Textarea id="body" {...register("body")} rows={10} className="font-mono text-sm" />
            {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags">タグ (カンマ区切り)</Label>
            <Input id="tags" {...register("tags")} placeholder="例: お礼,面接後" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : isEdit ? "更新する" : "追加する"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
