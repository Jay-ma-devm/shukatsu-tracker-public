"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
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
import { eventSchema, type EventSchema } from "@/lib/validators/event"
import { EVENT_TYPES } from "@/lib/constants"
import type { Event, Company, EventType } from "@/types"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { useState } from "react"

type EventWithCompany = Event & { company: Company | null }
type CompanyOption = { id: string; name: string }

interface EventFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: EventWithCompany
  defaultDate?: Date | null
  companies: CompanyOption[]
  onSuccess: (event: EventWithCompany) => void
  onDelete?: (id: string) => void
}

export function EventFormModal({
  open,
  onOpenChange,
  event,
  defaultDate,
  companies,
  onSuccess,
  onDelete,
}: EventFormModalProps) {
  const isEdit = !!event
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const defaultStartAt = defaultDate
    ? format(defaultDate, "yyyy-MM-dd'T'HH:mm")
    : event?.startAt
    ? format(new Date(event.startAt), "yyyy-MM-dd'T'HH:mm")
    : format(new Date(), "yyyy-MM-dd'T'HH:mm")

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<EventSchema>({
      resolver: zodResolver(eventSchema),
      defaultValues: {
        title: event?.title ?? "",
        type: (event?.type as EventType) ?? "interview",
        startAt: defaultStartAt,
        endAt: event?.endAt ? format(new Date(event.endAt), "yyyy-MM-dd'T'HH:mm") : "",
        location: event?.location ?? "",
        url: event?.url ?? "",
        notes: event?.notes ?? "",
        companyId: event?.companyId ?? "",
      },
    })

  const onSubmit = async (data: EventSchema) => {
    const url = isEdit ? `/api/events/${event!.id}` : "/api/events"
    const method = isEdit ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        companyId: data.companyId || undefined,
        endAt: data.endAt || undefined,
        url: data.url || undefined,
        location: data.location || undefined,
      }),
    })

    if (!res.ok) {
      toast.error(isEdit ? "更新に失敗しました" : "追加に失敗しました")
      return
    }

    const result = await res.json()
    if (!isEdit && ["interview", "case_interview"].includes(data.type) && data.companyId) {
      const companyName = companies.find((c) => c.id === data.companyId)?.name ?? "企業"
      const taskDate = data.startAt ? data.startAt.split("T")[0] : undefined
      toast.success("イベントを追加しました", {
        action: {
          label: "準備タスクを追加",
          onClick: async () => {
            const taskTypeLabel = data.type === "case_interview" ? "ケース面接" : "面接"
            await fetch("/api/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: `【${companyName}】${taskTypeLabel}準備`,
                companyId: data.companyId,
                dueAt: taskDate,
                status: "todo",
                priority: 5,
              }),
            })
            toast.success("準備タスクを追加しました")
          },
        },
        duration: 8000,
      })
    } else {
      toast.success(isEdit ? "イベントを更新しました" : "イベントを追加しました")
    }
    onSuccess(result)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? "イベントを編集" : "イベントを追加"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="title">タイトル *</Label>
              <Input id="title" {...register("title")} placeholder="例: Lumen Robotics 1次面接" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>種別</Label>
                <Select
                  value={watch("type")}
                  onValueChange={(v: string | null) => setValue("type", (v ?? "interview") as EventType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.icon} {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>企業</Label>
                <Select
                  value={watch("companyId") ?? ""}
                  onValueChange={(v: string | null) => setValue("companyId", v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">なし</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startAt">開始日時 *</Label>
                <Input id="startAt" {...register("startAt")} type="datetime-local" />
                {errors.startAt && <p className="text-xs text-destructive">{errors.startAt.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endAt">終了日時</Label>
                <Input id="endAt" {...register("endAt")} type="datetime-local" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">場所</Label>
              <Input id="location" {...register("location")} placeholder="例: 渋谷オフィス / Zoom" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="url">URL (Zoom/Google Meet等)</Label>
              <Input id="url" {...register("url")} placeholder="https://..." type="url" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">メモ</Label>
              <Textarea id="notes" {...register("notes")} rows={2} />
            </div>

            <div className="flex justify-between items-center pt-1">
              {isEdit && onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  削除
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  キャンセル
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? "保存中..." : isEdit ? "更新" : "追加"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {isEdit && onDelete && (
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="イベントを削除しますか？"
          confirmLabel="削除"
          variant="destructive"
          onConfirm={() => onDelete(event!.id)}
        />
      )}
    </>
  )
}
