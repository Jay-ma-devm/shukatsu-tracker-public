"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, addDays } from "date-fns"
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
import { taskSchema, type TaskSchema } from "@/lib/validators/task"
import { TASK_STATUSES } from "@/lib/constants"
import type { Task } from "@/types"

type TaskWithCompany = Task & { company: { id: string; name: string } | null }
type CompanyOption = { id: string; name: string }

interface TaskFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: TaskWithCompany
  companies: CompanyOption[]
  onSuccess: (task: TaskWithCompany) => void
  initialDueAt?: string
}

export function TaskFormModal({ open, onOpenChange, task, companies, onSuccess, initialDueAt }: TaskFormModalProps) {
  const isEdit = !!task

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<TaskSchema>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: (task?.status as "todo" | "doing" | "done") ?? "todo",
      priority: task?.priority ?? 3,
      dueAt: task?.dueAt ? format(new Date(task.dueAt), "yyyy-MM-dd") : (initialDueAt ?? ""),
      tags: task?.tags ?? "",
      companyId: task?.companyId ?? "",
    },
  })

  const onSubmit = async (data: TaskSchema) => {
    const url = isEdit ? `/api/tasks/${task!.id}` : "/api/tasks"
    const method = isEdit ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        dueAt: data.dueAt || undefined,
        companyId: data.companyId || undefined,
      }),
    })

    if (!res.ok) {
      toast.error(isEdit ? "更新に失敗しました" : "追加に失敗しました")
      return
    }

    const result = await res.json()
    toast.success(isEdit ? "タスクを更新しました" : "タスクを追加しました")
    onSuccess(result)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "タスクを編集" : "タスクを追加"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">タイトル *</Label>
              {!isEdit && (
                <div className="flex flex-wrap gap-1 justify-end">
                  {["企業研究", "ES設問", "面接準備", "OBアポ", "お礼メール", "スケジュール確認"].map((tmpl) => (
                    <button
                      key={tmpl}
                      type="button"
                      onClick={() => {
                        const cur = watch("title")
                        if (!cur) setValue("title", tmpl + ": ")
                        else setValue("title", tmpl + ": " + cur)
                      }}
                      className="text-[10px] px-1.5 py-0.5 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground transition-colors"
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Input id="title" {...register("title")} placeholder="例: Lumen Roboticsの企業研究" autoFocus />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">詳細</Label>
            <Textarea id="description" {...register("description")} rows={2} placeholder="補足・メモ" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>ステータス</Label>
              <Select value={watch("status")} onValueChange={(v: string | null) => setValue("status", (v ?? "todo") as "todo" | "doing" | "done")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>優先度</Label>
              <Select value={String(watch("priority"))} onValueChange={(v: string | null) => setValue("priority", parseInt(v ?? "3"))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[5,4,3,2,1].map((p) => (
                    <SelectItem key={p} value={String(p)}>{"★".repeat(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="dueAt">期限日</Label>
                <div className="flex gap-1">
                  {[["今日", 0], ["明日", 1], ["来週", 7]].map(([label, days]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setValue("dueAt", format(addDays(new Date(), Number(days)), "yyyy-MM-dd"))}
                      className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <Input id="dueAt" {...register("dueAt")} type="date" />
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
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags">タグ (カンマ区切り)</Label>
            <Input id="tags" {...register("tags")} placeholder="例: ES,企業研究" />
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
