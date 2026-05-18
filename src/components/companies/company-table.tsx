"use client"

import { useState } from "react"
import Link from "next/link"
import { Star, MoreHorizontal, Pencil, Trash2, ExternalLink, Clock, ChevronDown, Calendar, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CompanyStatusBadge } from "@/components/common/status-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { COMPANY_STATUSES } from "@/lib/constants"
import { PriorityStars } from "@/components/common/priority-stars"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { EmptyState } from "@/components/common/empty-state"
import { CompanyFormModal } from "./company-form-modal"
import { formatDate, formatDateShort } from "@/lib/utils/date"
import { cn } from "@/lib/utils"
import type { CompanyWithData } from "@/types/company"
import type { CompanyStatus } from "@/types"
import { Building2 } from "lucide-react"

type SortKey = "priority" | "name" | "appliedAt" | "updatedAt" | "nextEvent" | "urgency"

function SortableHeader({ label, sortKey, currentSort, onSortChange }: {
  label: string
  sortKey: SortKey
  currentSort?: SortKey
  onSortChange?: (sort: SortKey) => void
}) {
  const isActive = currentSort === sortKey
  return (
    <TableHead
      className={cn("cursor-pointer select-none hover:bg-muted/50 transition-colors", isActive && "text-primary")}
      onClick={() => onSortChange?.(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </div>
    </TableHead>
  )
}

interface CompanyTableProps {
  companies: CompanyWithData[]
  onDeleted: (id: string) => void
  onUpdated: (company: CompanyWithData) => void
  currentSort?: SortKey
  onSortChange?: (sort: SortKey) => void
}

export function CompanyTable({ companies, onDeleted, onUpdated, currentSort, onSortChange }: CompanyTableProps) {
  const [editingCompany, setEditingCompany] = useState<CompanyWithData | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkArchiving, setBulkArchiving] = useState(false)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return
    setBulkArchiving(true)
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        fetch(`/api/companies/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archivedAt: new Date().toISOString() }),
        })
      )
    )
    selectedIds.forEach((id) => onDeleted(id))
    setSelectedIds(new Set())
    setBulkArchiving(false)
    toast.success(`${selectedIds.size}社をアーカイブしました`)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    const res = await fetch(`/api/companies/${deletingId}`, { method: "DELETE" })
    if (res.ok) {
      onDeleted(deletingId)
      toast.success("企業を削除しました")
    } else {
      toast.error("削除に失敗しました")
    }
    setDeletingId(null)
  }

  const handleToggleStar = async (company: CompanyWithData) => {
    const res = await fetch(`/api/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starred: !company.starred }),
    })
    if (res.ok) {
      const updated = await res.json()
      onUpdated({ ...company, ...updated })
    }
  }

  const handleUpdatePriority = async (company: CompanyWithData, priority: number) => {
    const res = await fetch(`/api/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    })
    if (res.ok) {
      onUpdated({ ...company, priority })
    }
  }

  if (companies.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="企業がありません"
        description="「企業を追加」ボタンから選考企業を登録しましょう"
      />
    )
  }

  return (
    <>
      {/* 一括操作バー */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-medium">{selectedIds.size}社選択中</span>
          {selectedIds.size >= 2 && selectedIds.size <= 4 && (
            <Link
              href={`/companies/compare?ids=${Array.from(selectedIds).join(",")}`}
              className="text-xs px-2.5 py-1 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
            >
              比較する
            </Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="text-xs px-2.5 py-1 bg-muted rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-1">
              一括ステータス変更 <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {COMPANY_STATUSES.slice(0, 9).map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  onClick={async () => {
                    await Promise.all(
                      Array.from(selectedIds).map((id) =>
                        fetch(`/api/companies/${id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: s.value }),
                        }).then((r) => r.ok ? r.json() : null)
                          .then((updated) => updated && onUpdated({ ...companies.find((c) => c.id === id)!, ...updated }))
                      )
                    )
                    toast.success(`${selectedIds.size}社のステータスを「${s.label}」に変更しました`)
                    setSelectedIds(new Set())
                  }}
                  className="text-xs"
                >
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={async () => {
              await Promise.all(
                Array.from(selectedIds).map((id) =>
                  fetch(`/api/companies/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ starred: true }),
                  }).then((r) => r.ok ? r.json() : null)
                    .then((updated) => updated && onUpdated({ ...companies.find((c) => c.id === id)!, ...updated }))
                )
              )
              toast.success(`${selectedIds.size}社をお気に入りに追加しました`)
              setSelectedIds(new Set())
            }}
            className="text-xs px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1"
          >
            ★ 一括スター
          </button>
          <button
            onClick={handleBulkArchive}
            disabled={bulkArchiving}
            className="text-xs px-2.5 py-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg hover:bg-zinc-300 transition-colors"
          >
            {bulkArchiving ? "処理中..." : "一括アーカイブ"}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
          >
            選択解除
          </button>
        </div>
      )}

      {/* デスクトップ表示: テーブル */}
      <div className="hidden md:block rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded cursor-pointer accent-primary"
                  checked={selectedIds.size === companies.length && companies.length > 0}
                  onChange={() => {
                    if (selectedIds.size === companies.length) {
                      setSelectedIds(new Set())
                    } else {
                      setSelectedIds(new Set(companies.map((c) => c.id)))
                    }
                  }}
                  aria-label="全選択"
                />
              </TableHead>
              <TableHead className="w-8"></TableHead>
              <SortableHeader label="企業名" sortKey="name" currentSort={currentSort} onSortChange={onSortChange} />
              <TableHead>職種</TableHead>
              <TableHead>業界</TableHead>
              <TableHead>ステータス</TableHead>
              <SortableHeader label="優先度" sortKey="priority" currentSort={currentSort} onSortChange={onSortChange} />
              <SortableHeader label="応募日" sortKey="appliedAt" currentSort={currentSort} onSortChange={onSortChange} />
              <TableHead className="hidden xl:table-cell">次回予定</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id} className={cn("group", selectedIds.has(company.id) && "bg-primary/5")}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(company.id)}
                    onChange={() => toggleSelect(company.id)}
                    className="h-3.5 w-3.5 rounded cursor-pointer accent-primary"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${company.name}を選択`}
                  />
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => handleToggleStar(company)}
                    className="opacity-40 group-hover:opacity-100 transition-opacity"
                    aria-label={company.starred ? "お気に入り解除" : "お気に入り登録"}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        company.starred ? "text-amber-400 fill-amber-400 opacity-100!" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/companies/${company.id}`}
                      className="font-medium hover:text-primary transition-colors"
                      title={company.notes ? company.notes.slice(0, 100) + (company.notes.length > 100 ? "..." : "") : undefined}
                    >
                      {company.name}
                    </Link>
                    {new Date(company.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                      <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded font-medium shrink-0">NEW</span>
                    )}
                    {(company._count?.interviewLogs ?? 0) > 0 && (
                      <span className="text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1 py-0.5 rounded shrink-0" title={`面接${company._count!.interviewLogs}回`}>
                        💬{company._count!.interviewLogs}
                      </span>
                    )}
                    {["applied","screening","interview","case","final"].includes(company.status) &&
                      new Date(company.updatedAt).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                      <span title={`最終更新: ${Math.floor((Date.now() - new Date(company.updatedAt).getTime()) / (1000 * 60 * 60 * 24))}日前`}>
                        <Clock className="h-3 w-3 text-amber-400 shrink-0" />
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {company.position || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {company.industry || "-"}
                </TableCell>
                <TableCell>
                  <StatusChanger company={company} onUpdated={onUpdated} />
                </TableCell>
                <TableCell>
                  <PriorityStars
                    priority={company.priority}
                    interactive
                    onChange={(p) => handleUpdatePriority(company, p)}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(company.appliedAt)}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {company.nextEvents && company.nextEvents[0] ? (() => {
                    const ev = company.nextEvents![0]
                    const daysUntil = Math.ceil((new Date(ev.startAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    const isInterview = ["interview", "case_interview"].includes(ev.type)
                    return (
                      <Link href={`/companies/${company.id}?tab=events`} className="flex items-center gap-1 text-xs hover:text-primary transition-colors">
                        <Calendar className={cn("h-3 w-3 shrink-0", isInterview && daysUntil <= 3 ? "text-red-500" : "text-amber-500")} />
                        <span className={cn(daysUntil <= 1 ? "text-red-500 font-medium" : daysUntil <= 3 ? "text-amber-600" : "text-muted-foreground")}>
                          {isInterview && <span className="text-[9px] mr-0.5">面接</span>}
                          {daysUntil === 0 ? "今日" : daysUntil === 1 ? "明日" : `${daysUntil}日後`}
                        </span>
                      </Link>
                    )
                  })() : (
                    <span className="text-xs text-muted-foreground/40">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex items-center justify-center size-7 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingCompany(company)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        編集
                      </DropdownMenuItem>
                      {company.url && (
                        <DropdownMenuItem
                          onClick={() => window.open(company.url!, "_blank", "noopener,noreferrer")}
                        >
                          <ExternalLink className="mr-2 h-3.5 w-3.5" />
                          サイトを開く
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeletingId(company.id)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        削除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* モバイル表示: カードリスト */}
      <div className="md:hidden space-y-2">
        {companies.map((company) => (
          <div key={company.id} className="block p-4 border rounded-xl hover:shadow-sm transition-shadow bg-card">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Link href={`/companies/${company.id}`} className="font-medium truncate hover:text-primary">{company.name}</Link>
                  {company.starred && (
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                  )}
                  {new Date(company.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                    <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded font-medium shrink-0">NEW</span>
                  )}
                  {["applied","screening","interview","case","final"].includes(company.status) &&
                    new Date(company.updatedAt).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                    <span title={`${Math.floor((Date.now() - new Date(company.updatedAt).getTime()) / (1000 * 60 * 60 * 24))}日未更新`} className="shrink-0">
                      <Clock className="h-3 w-3 text-amber-400" />
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {company.position || company.industry || ""}
                </p>
              </div>
              <StatusChanger company={company} onUpdated={onUpdated} />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <PriorityStars priority={company.priority} />
              <span className="text-xs text-muted-foreground">
                {formatDate(company.appliedAt)}
              </span>
              <div className="ml-auto flex items-center gap-1">
                {(company._count?.events ?? 0) > 0 && (
                  <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">
                    予定{company._count?.events}
                  </span>
                )}
                {(company._count?.interviewLogs ?? 0) > 0 && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                    面接{company._count?.interviewLogs}
                  </span>
                )}
                {(company._count?.caseLogs ?? 0) > 0 && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                    ケース{company._count?.caseLogs}
                  </span>
                )}
              </div>
            </div>
            {company.nextEvents && company.nextEvents[0] && (() => {
              const daysUntil = Math.ceil((new Date(company.nextEvents![0].startAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-2.5 w-2.5 text-amber-500" />
                  <span className={daysUntil <= 1 ? "text-red-500 font-medium" : daysUntil <= 3 ? "text-amber-600" : ""}>
                    {daysUntil === 0 ? "今日の予定あり" : daysUntil === 1 ? "明日の予定あり" : `${daysUntil}日後に予定あり`}
                  </span>
                </div>
              )
            })()}
          </div>
        ))}
      </div>

      {/* 編集モーダル */}
      {editingCompany && (
        <CompanyFormModal
          open={!!editingCompany}
          onOpenChange={(open) => !open && setEditingCompany(null)}
          company={editingCompany}
          onSuccess={(updated) => {
            onUpdated({ ...editingCompany, ...updated })
            setEditingCompany(null)
          }}
        />
      )}

      {/* 削除確認 */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="企業を削除しますか？"
        description="この操作は取り消せません。アーカイブの場合はデータが保持されます。"
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleDelete}
        secondaryAction={{
          label: "アーカイブ",
          onClick: async () => {
            if (!deletingId) return
            const res = await fetch(`/api/companies/${deletingId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ archivedAt: new Date().toISOString() }),
            })
            if (res.ok) {
              onDeleted(deletingId)
              toast.success("企業をアーカイブしました")
            }
            setDeletingId(null)
          },
        }}
      />
    </>
  )
}

// ステータス直接変更コンポーネント
function StatusChanger({ company, onUpdated }: {
  company: CompanyWithData
  onUpdated: (company: CompanyWithData) => void
}) {
  const handleChange = async (v: string | null) => {
    if (!v || v === company.status) return
    const res = await fetch(`/api/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: v }),
    })
    if (res.ok) {
      const updated = await res.json()
      onUpdated({ ...company, ...updated })
    }
  }

  return (
    <Select value={company.status} onValueChange={handleChange}>
      <SelectTrigger className="h-7 w-32 text-xs border-0 bg-transparent hover:bg-muted focus-visible:ring-0 p-0">
        <CompanyStatusBadge status={company.status as CompanyStatus} />
      </SelectTrigger>
      <SelectContent>
        {COMPANY_STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value} className="text-xs">
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
