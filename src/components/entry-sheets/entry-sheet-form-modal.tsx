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
import { entrySheetSchema, type EntrySheetSchema } from "@/lib/validators/entry-sheet"
import { ES_STATUSES } from "@/lib/constants"

type CompanyOption = { id: string; name: string }

interface EntrySheetFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: CompanyOption[]
  onSuccess: (sheet: unknown) => void
}

export function EntrySheetFormModal({ open, onOpenChange, companies, onSuccess }: EntrySheetFormModalProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<EntrySheetSchema>({
    resolver: zodResolver(entrySheetSchema),
    defaultValues: {
      title: "",
      status: "draft",
      companyId: "",
      deadline: "",
    },
  })

  const onSubmit = async (data: EntrySheetSchema) => {
    const res = await fetch("/api/entry-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        deadline: data.deadline || undefined,
      }),
    })

    if (!res.ok) {
      toast.error("追加に失敗しました")
      return
    }

    const result = await res.json()
    toast.success("ESを追加しました")
    onSuccess(result)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ESを追加</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="title">タイトル *</Label>
            <Input id="title" {...register("title")} placeholder="例: Lumen Robotics 本選考ES" autoFocus />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>企業 *</Label>
            <Select value={watch("companyId")} onValueChange={(v: string | null) => setValue("companyId", v ?? "")}>
              <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.companyId && <p className="text-xs text-destructive">{errors.companyId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>ステータス</Label>
              <Select value={watch("status")} onValueChange={(v: string | null) => setValue("status", (v ?? "draft") as EntrySheetSchema["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ES_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deadline">提出期限</Label>
              <Input id="deadline" {...register("deadline")} type="date" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>キャンセル</Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "追加中..." : "追加する"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
