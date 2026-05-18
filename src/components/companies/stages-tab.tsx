"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Check, X, Clock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StageStatusBadge } from "@/components/common/status-badge"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { formatDate } from "@/lib/utils/date"
import type { Stage, StageStatus } from "@/types"
import { cn } from "@/lib/utils"

interface StagesTabProps {
  companyId: string
  stages: Stage[]
  onStagesChange: (stages: Stage[]) => void
}

const STAGE_STATUS_OPTIONS: { value: StageStatus; label: string }[] = [
  { value: "pending", label: "未実施" },
  { value: "scheduled", label: "予定あり" },
  { value: "passed", label: "通過" },
  { value: "failed", label: "不通過" },
  { value: "cancelled", label: "キャンセル" },
]

interface StageFormState {
  name: string
  status: StageStatus
  scheduledAt: string
  result: string
  feedback: string
  interviewer: string
  duration: string
}

export function StagesTab({ companyId, stages, onStagesChange }: StagesTabProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState<StageFormState>({
    name: "",
    status: "pending",
    scheduledAt: "",
    result: "",
    feedback: "",
    interviewer: "",
    duration: "",
  })

  const handleAdd = async () => {
    if (!form.name.trim()) return
    const res = await fetch(`/api/companies/${companyId}/stages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        status: form.status,
        order: stages.length,
        scheduledAt: form.scheduledAt || undefined,
      }),
    })
    if (res.ok) {
      const stage = await res.json()
      onStagesChange([...stages, stage])
      setForm({ name: "", status: "pending", scheduledAt: "", result: "", feedback: "", interviewer: "", duration: "" })
      setShowAddForm(false)
      toast.success("ステージを追加しました")
    }
  }

  const handleUpdate = async (stageId: string) => {
    const res = await fetch(`/api/companies/${companyId}/stages/${stageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        status: form.status,
        scheduledAt: form.scheduledAt || null,
        result: form.result || undefined,
        feedback: form.feedback || undefined,
        interviewer: form.interviewer || undefined,
        duration: form.duration ? parseInt(form.duration) : undefined,
      }),
    })
    if (res.ok) {
      const updated = await res.json()
      onStagesChange(stages.map((s) => (s.id === stageId ? updated : s)))
      setEditingId(null)
      toast.success("ステージを更新しました")
    }
  }

  const handleQuickStatus = async (stageId: string, newStatus: StageStatus) => {
    const res = await fetch(`/api/companies/${companyId}/stages/${stageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, completedAt: new Date().toISOString() }),
    })
    if (res.ok) {
      const updated = await res.json()
      onStagesChange(stages.map((s) => (s.id === stageId ? updated : s)))
      toast.success(newStatus === "passed" ? "✅ 通過！" : "ステータスを更新しました")
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    const res = await fetch(`/api/companies/${companyId}/stages/${deletingId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      onStagesChange(stages.filter((s) => s.id !== deletingId))
      setDeletingId(null)
      toast.success("ステージを削除しました")
    }
  }

  const startEdit = (stage: Stage) => {
    setForm({
      name: stage.name,
      status: stage.status as StageStatus,
      scheduledAt: stage.scheduledAt ? new Date(stage.scheduledAt).toISOString().split("T")[0] : "",
      result: stage.result ?? "",
      feedback: stage.feedback ?? "",
      interviewer: stage.interviewer ?? "",
      duration: stage.duration?.toString() ?? "",
    })
    setEditingId(stage.id)
  }

  const passedCount = stages.filter((s) => s.status === "passed").length
  const failedCount = stages.filter((s) => s.status === "failed").length

  return (
    <div className="space-y-3">
      {stages.length > 0 && (
        <div className="flex items-center gap-3 pb-2">
          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden flex">
            <div className="bg-emerald-500 h-2 transition-all" style={{ width: `${(passedCount / stages.length) * 100}%` }} />
            {failedCount > 0 && <div className="bg-red-400 h-2 transition-all" style={{ width: `${(failedCount / stages.length) * 100}%` }} />}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {passedCount}/{stages.length} 通過
          </span>
        </div>
      )}
      {stages.map((stage, idx) => (
        <div
          key={stage.id}
          className={cn(
            "flex items-start gap-3 p-3 border rounded-xl",
            stage.status === "passed" && "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-950/20",
            stage.status === "failed" && "border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/20"
          )}
        >
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-mono font-medium text-muted-foreground mt-0.5">
            {idx + 1}
          </div>

          {editingId === stage.id ? (
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="ステージ名"
                  className="h-7 text-sm"
                />
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: (v ?? "pending") as StageStatus }))}
                >
                  <SelectTrigger className="h-7 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  type="date"
                  className="h-7 text-sm"
                  placeholder="予定日"
                />
                <Input
                  value={form.result}
                  onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
                  placeholder="結果メモ"
                  className="h-7 text-sm"
                />
                <Input
                  value={form.interviewer}
                  onChange={(e) => setForm((f) => ({ ...f, interviewer: e.target.value }))}
                  placeholder="面接官名"
                  className="h-7 text-sm"
                />
                <Input
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  type="number"
                  placeholder="時間(分)"
                  className="h-7 text-sm w-24"
                />
              </div>
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => setEditingId(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon-sm" onClick={() => handleUpdate(stage.id)}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{stage.name}</span>
                <StageStatusBadge status={stage.status as StageStatus} />
              </div>
              {stage.scheduledAt && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {formatDate(stage.scheduledAt)}
                  </p>
                  <a
                    href={`/calendar?date=${new Date(stage.scheduledAt).toISOString().split("T")[0]}`}
                    className="text-[10px] text-muted-foreground hover:text-primary transition-colors mt-0.5"
                    title="カレンダーで確認"
                  >
                    📅
                  </a>
                </div>
              )}
              {stage.result && (
                <p className="text-xs text-muted-foreground mt-0.5">{stage.result}</p>
              )}
              {stage.interviewer && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  面接官: {stage.interviewer}
                  {stage.duration && ` (${stage.duration}分)`}
                </p>
              )}
            </div>
          )}

          {editingId !== stage.id && (
            <div className="flex items-center gap-1 shrink-0">
              {!["passed", "failed", "cancelled"].includes(stage.status) && (
                <>
                  <button
                    onClick={() => handleQuickStatus(stage.id, "passed")}
                    className="text-xs px-1.5 py-0.5 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                    title="通過にする"
                  >
                    ✅
                  </button>
                  <button
                    onClick={() => handleQuickStatus(stage.id, "failed")}
                    className="text-xs px-1.5 py-0.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="不通過にする"
                  >
                    ❌
                  </button>
                </>
              )}
              <Button variant="ghost" size="icon-sm" onClick={() => startEdit(stage)} className="h-6 w-6">
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeletingId(stage.id)}
                className="h-6 w-6 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* ネクストアクション提案 */}
      {stages.some((s) => s.status === "passed") && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs text-emerald-700 dark:text-emerald-400">
          <p className="font-medium mb-1">💡 ネクストアクション</p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>次の選考ステージを追加する</li>
            <li>面接後のお礼メールを送る（テンプレートから）</li>
            <li>面接ログに感想・評価を記録する</li>
          </ul>
        </div>
      )}

      {stages.some((s) => s.status === "failed") && (
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border rounded-xl text-xs text-muted-foreground">
          <p className="font-medium mb-1">📝 次のステップ</p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>振り返りメモを記録する（面接ログ）</li>
            <li>類似業界の他社にエントリーする</li>
          </ul>
        </div>
      )}

      {showAddForm ? (
        <div className="p-3 border rounded-xl border-dashed space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="ステージ名（例: 書類選考）"
              className="h-7 text-sm"
              autoFocus
            />
            <Input
              value={form.scheduledAt}
              onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
              type="date"
              className="h-7 text-sm"
            />
          </div>
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              キャンセル
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={!form.name.trim()}>
              追加
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="w-full border-dashed gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          ステージを追加
        </Button>
      )}

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="ステージを削除しますか？"
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
