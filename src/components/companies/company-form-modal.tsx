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
import { companySchema, type CompanySchema } from "@/lib/validators/company"
import { COMPANY_STATUSES, INDUSTRIES, COMPANY_SIZES } from "@/lib/constants"
import type { CompanyWithData } from "@/types/company"
import type { CompanyStatus } from "@/types"

interface CompanyFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company?: CompanyWithData
  initialStatus?: CompanyStatus
  onSuccess: (company: CompanyWithData) => void
}

export function CompanyFormModal({
  open,
  onOpenChange,
  company,
  initialStatus,
  onSuccess,
}: CompanyFormModalProps) {
  const isEdit = !!company

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompanySchema>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name ?? "",
      industry: company?.industry ?? "",
      position: company?.position ?? "",
      location: company?.location ?? "",
      size: company?.size ?? "",
      url: company?.url ?? "",
      priority: company?.priority ?? 3,
      status: (company?.status as CompanyStatus) ?? initialStatus ?? "applied",
      starred: company?.starred ?? false,
      notes: company?.notes ?? "",
      appliedAt: company?.appliedAt
        ? new Date(company.appliedAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    },
  })

  const onSubmit = async (data: CompanySchema) => {
    const url = isEdit ? `/api/companies/${company!.id}` : "/api/companies"
    const method = isEdit ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}))
        if (data.code === "PLAN_LIMIT") {
          toast.error("企業10社の無料制限に達しました", {
            description: "Proプランにアップグレードすると無制限に追加できます",
            action: {
              label: "Proを見る",
              onClick: () => { window.location.href = "/pricing" },
            },
            duration: 6000,
          })
          return
        }
      }
      toast.error(isEdit ? "更新に失敗しました" : "追加に失敗しました")
      return
    }

    const result = await res.json()
    const prevStatus = company?.status
    const newStatus = data.status
    if (prevStatus !== newStatus && newStatus === "offer") {
      toast.success("🎉 内定おめでとうございます！", {
        description: "承諾期限をカレンダーに登録しましょう",
        action: {
          label: "期限を追加",
          onClick: () => { window.location.href = `/calendar` },
        },
        duration: 8000,
      })
    } else if (prevStatus !== newStatus && newStatus === "final") {
      toast.success("最終面接に進みました！頑張ってください 💪", {
        action: {
          label: "最終準備タスクを作成",
          onClick: async () => {
            const tasks = [
              { title: "最終面接の準備（自己PR・志望動機の最終確認）", priority: 5 },
              { title: "役員面接の逆質問を10問準備", priority: 5 },
              { title: "最終面接後のお礼メール下書き", priority: 4 },
            ]
            for (const t of tasks) {
              await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...t, status: "todo", companyId: result.id }),
              })
            }
            window.location.href = `/companies/${result.id}?tab=tasks`
          },
        },
        duration: 10000,
      })
    } else if (prevStatus !== newStatus && newStatus === "interview") {
      toast.success("企業を更新しました", {
        action: {
          label: "面接記録を追加",
          onClick: () => { window.location.href = `/interviews?new=1&company=${result.id}` },
        },
        duration: 6000,
      })
    } else if (!isEdit) {
      toast.success(`「${data.name}」を追加しました`, {
        action: {
          label: "企業詳細へ",
          onClick: () => { window.location.href = `/companies/${result.id}` },
        },
        duration: 5000,
      })
    } else {
      toast.success("企業を更新しました")
    }
    onSuccess({
      ...result,
      _count: company?._count ?? { events: 0, caseLogs: 0 },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "企業を編集" : "企業を追加"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 企業名 */}
          <div className="space-y-1.5">
            <Label htmlFor="name">企業名 *</Label>
            <Input id="name" {...register("name")} placeholder="例: Lumen Robotics" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 職種 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="position">職種・コース</Label>
                <div className="flex gap-1">
                  {["マーケ", "営業", "BizDev", "エンジニア", "コンサル"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setValue("position", p)}
                      className="text-[9px] text-muted-foreground hover:text-primary transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <Input id="position" {...register("position")} placeholder="例: マーケティング" />
            </div>

            {/* 業界 */}
            <div className="space-y-1.5">
              <Label>業界</Label>
              <Select
                value={watch("industry")}
                onValueChange={(v) => setValue("industry", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ステータス */}
            <div className="space-y-1.5">
              <Label>ステータス *</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) => setValue("status", (v ?? "applied") as CompanyStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 優先度 */}
            <div className="space-y-1.5">
              <Label>優先度</Label>
              <Select
                value={String(watch("priority"))}
                onValueChange={(v) => setValue("priority", parseInt(v ?? "3"))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {"★".repeat(p)} {p === 5 ? "(最高)" : p === 1 ? "(最低)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 勤務地 */}
            <div className="space-y-1.5">
              <Label htmlFor="location">勤務地</Label>
              <Input id="location" {...register("location")} placeholder="例: 渋谷" />
            </div>

            {/* 会社規模 */}
            <div className="space-y-1.5">
              <Label>会社規模</Label>
              <Select
                value={watch("size")}
                onValueChange={(v) => setValue("size", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <Label htmlFor="url">企業URL</Label>
            <Input
              id="url"
              {...register("url")}
              placeholder="https://..."
              type="url"
              onChange={(e) => {
                register("url").onChange(e)
                // URLが入力された時、企業名が空なら自動入力を提案
                const url = e.target.value
                if (url && !watch("name")) {
                  try {
                    const domain = new URL(url).hostname.replace(/^www\./, "")
                    const suggestedName = domain.split(".")[0]
                    if (suggestedName && suggestedName.length > 1) {
                      setValue("name", suggestedName.charAt(0).toUpperCase() + suggestedName.slice(1))
                    }
                  } catch {}
                }
              }}
            />
            {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
          </div>

          {/* 応募日 */}
          <div className="space-y-1.5">
            <Label htmlFor="appliedAt">応募日</Label>
            <Input id="appliedAt" {...register("appliedAt")} type="date" />
          </div>

          {/* メモ */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">メモ</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="面接官の名前、特記事項など..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setValue("starred", !watch("starred"))}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${watch("starred") ? "bg-amber-50 border-amber-300 text-amber-700" : "text-muted-foreground border hover:border-amber-300"}`}
            >
              <span className={watch("starred") ? "text-amber-400" : "text-muted-foreground/40"}>★</span>
              {watch("starred") ? "お気に入り解除" : "お気に入り"}
            </button>
            <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : isEdit ? "更新する" : "追加する"}
            </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
