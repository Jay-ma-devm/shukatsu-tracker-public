"use client"

import { useState, useEffect } from "react"
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
import { Switch } from "@/components/ui/switch"
import { meetingSchema, type MeetingSchema } from "@/lib/validators/meeting"
import { MEETING_TYPES } from "@/lib/constants"
import type { Meeting } from "@/types"

type MeetingWithData = Meeting & {
  company: { id: string; name: string } | null
  contact: { id: string; name: string; role: string | null } | null
}
type CompanyOption = { id: string; name: string }

interface MeetingFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meeting?: MeetingWithData
  companies: CompanyOption[]
  onSuccess: (meeting: unknown) => void
  defaultCompanyId?: string
}

export function MeetingFormModal({ open, onOpenChange, meeting, companies, onSuccess, defaultCompanyId }: MeetingFormModalProps) {
  const isEdit = !!meeting
  const [contacts, setContacts] = useState<{ id: string; name: string; role: string | null }[]>([])

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<MeetingSchema>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      type: (meeting?.type as MeetingSchema["type"]) ?? "ob",
      title: meeting?.title ?? "",
      conductedAt: meeting?.conductedAt ? format(new Date(meeting.conductedAt), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      duration: meeting?.duration ?? undefined,
      location: meeting?.location ?? "",
      companyId: meeting?.companyId ?? defaultCompanyId ?? "",
      contactId: meeting?.contact?.id ?? "",
      topics: meeting?.topics ?? "",
      insights: meeting?.insights ?? "",
      followUp: meeting?.followUp ?? "",
      thankYouSent: meeting?.thankYouSent ?? false,
    },
  })

  const companyId = watch("companyId")
  useEffect(() => {
    if (!companyId) { setContacts([]); return }
    fetch(`/api/companies/${companyId}/contacts`).then((r) => r.ok ? r.json() : []).then(setContacts).catch(() => setContacts([]))
  }, [companyId])

  const onSubmit = async (data: MeetingSchema) => {
    const url = isEdit ? `/api/meetings/${meeting!.id}` : "/api/meetings"
    const method = isEdit ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        location: data.location || undefined,
        companyId: data.companyId || undefined,
        topics: data.topics || undefined,
        insights: data.insights || undefined,
        followUp: data.followUp || undefined,
      }),
    })

    if (!res.ok) {
      toast.error(isEdit ? "更新に失敗しました" : "追加に失敗しました")
      return
    }

    const result = await res.json()
    toast.success(isEdit ? "記録を更新しました" : "記録を追加しました")
    onSuccess(result)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "記録を編集" : "OB訪問・面談を記録"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>種別</Label>
              <Select value={watch("type")} onValueChange={(v: string | null) => setValue("type", (v ?? "ob") as MeetingSchema["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEETING_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>企業</Label>
              <Select value={watch("companyId") ?? ""} onValueChange={(v: string | null) => setValue("companyId", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">なし</SelectItem>
                  {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {contacts.length > 0 && (
            <div className="space-y-1.5">
              <Label>連絡先</Label>
              <Select value={watch("contactId") ?? ""} onValueChange={(v: string | null) => setValue("contactId", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="連絡先を選択" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">なし</SelectItem>
                  {contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}{c.role ? ` (${c.role})` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title">タイトル *</Label>
            <Input id="title" {...register("title")} placeholder="例: Lumen Robotics 先輩社員 OB訪問" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="conductedAt">実施日 *</Label>
              <Input id="conductedAt" {...register("conductedAt")} type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration">所要時間 (分)</Label>
              <Input id="duration" {...register("duration", { valueAsNumber: true })} type="number" placeholder="60" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">場所・手段</Label>
            <Input id="location" {...register("location")} placeholder="例: Zoom / 渋谷スタバ" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="topics">話したトピック</Label>
              <div className="flex flex-wrap gap-1 justify-end">
                {["仕事内容", "社風・文化", "キャリアパス", "事業の強み", "就活アドバイス", "入社理由", "やりがい"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      const cur = watch("topics") ?? ""
                      setValue("topics", cur ? cur + "\n・" + t : "・" + t)
                    }}
                    className="text-[10px] px-1.5 py-0.5 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground transition-colors"
                  >
                    +{t}
                  </button>
                ))}
              </div>
            </div>
            <Textarea id="topics" {...register("topics")} rows={3} placeholder="・仕事内容について&#10;・社風・カルチャーについて" />
          </div>

          {[
            { name: "insights" as const, label: "学んだこと・気づき", placeholder: "この企業ならではの強みや課題感、社員の雰囲気など" },
            { name: "followUp" as const, label: "フォローアップ事項", placeholder: "次回連絡するタイミング、確認すべき事項など" },
          ].map(({ name, label, placeholder }) => (
            <div key={name} className="space-y-1.5">
              <Label htmlFor={name}>{label}</Label>
              <Textarea id={name} {...register(name)} rows={3} placeholder={placeholder} />
            </div>
          ))}

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <Label htmlFor="thankYouSent" className="text-sm">お礼メール送信済み</Label>
            <Switch
              id="thankYouSent"
              checked={watch("thankYouSent")}
              onCheckedChange={(checked) => setValue("thankYouSent", checked)}
            />
          </div>

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
