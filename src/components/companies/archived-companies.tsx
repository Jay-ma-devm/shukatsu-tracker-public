"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CompanyStatusBadge } from "@/components/common/status-badge"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { formatDate } from "@/lib/utils/date"
import type { Company, CompanyStatus } from "@/types"
import { cn } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"

type ArchivedCompany = Company & {
  _count: { stages: number; events: number }
}

interface ArchivedCompaniesClientProps {
  companies: ArchivedCompany[]
}

export function ArchivedCompaniesClient({ companies: initialCompanies }: ArchivedCompaniesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [companies, setCompanies] = useState(initialCompanies)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [search, setSearch] = useState(searchParams.get("q") ?? "")

  const filtered = useMemo(() => {
    if (!search) return companies
    const q = search.toLowerCase()
    return companies.filter((c) => c.name.toLowerCase().includes(q) || (c.industry ?? "").toLowerCase().includes(q))
  }, [companies, search])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) return
    setBulkProcessing(true)
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        fetch(`/api/companies/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archivedAt: null }),
        })
      )
    )
    setCompanies((prev) => prev.filter((c) => !selectedIds.has(c.id)))
    toast.success(`${selectedIds.size}社を復元しました`)
    setSelectedIds(new Set())
    setBulkProcessing(false)
  }

  const handleRestore = async (id: string) => {
    const res = await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archivedAt: null }),
    })
    if (res.ok) {
      setCompanies((prev) => prev.filter((c) => c.id !== id))
      toast.success("企業を復元しました")
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    // Hard delete
    const res = await fetch(`/api/companies/${deletingId}/hard-delete`, { method: "DELETE" })
    if (res.ok) {
      setCompanies((prev) => prev.filter((c) => c.id !== deletingId))
      toast.success("完全に削除しました")
    } else {
      // Fallback: use standard delete
      await fetch(`/api/companies/${deletingId}`, { method: "DELETE" })
      setCompanies((prev) => prev.filter((c) => c.id !== deletingId))
      toast.success("削除しました")
    }
    setDeletingId(null)
  }

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/companies" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 -ml-2")}>
          <ArrowLeft className="h-3.5 w-3.5" />
          企業一覧へ
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">アーカイブ済み企業</h1>
          <p className="text-sm text-muted-foreground">{companies.length}社{filtered.length !== companies.length && ` (${filtered.length}件表示中)`}</p>
        </div>
        <Input
          placeholder="企業名・業界で検索..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            const p = new URLSearchParams(searchParams.toString())
            if (e.target.value) p.set("q", e.target.value)
            else p.delete("q")
            router.replace(`/companies/archived?${p.toString()}`, { scroll: false })
          }}
          className="h-8 w-48 text-sm"
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-medium">{selectedIds.size}社選択中</span>
          <Button size="sm" variant="outline" disabled={bulkProcessing} onClick={handleBulkRestore} className="gap-1.5 h-7 text-xs">
            <RotateCcw className="h-3 w-3" />
            {bulkProcessing ? "処理中..." : "一括復元"}
          </Button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto">
            選択解除
          </button>
        </div>
      )}

      {companies.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">アーカイブ済みの企業はありません</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">「{search}」に一致する企業がありません</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((company) => (
            <div key={company.id} className={cn("group flex items-center gap-3 p-4 border rounded-xl bg-card hover:bg-muted/30 transition-colors", selectedIds.has(company.id) && "bg-primary/5 border-primary/30")}>
              <input
                type="checkbox"
                checked={selectedIds.has(company.id)}
                onChange={() => toggleSelect(company.id)}
                className="h-3.5 w-3.5 rounded cursor-pointer accent-primary opacity-0 group-hover:opacity-100 focus:opacity-100"
                style={selectedIds.has(company.id) ? { opacity: 1 } : undefined}
                aria-label={`${company.name}を選択`}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-muted-foreground">{company.name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <CompanyStatusBadge status={company.status as CompanyStatus} />
                  {company.industry && (
                    <span className="text-xs text-muted-foreground">{company.industry}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(company.archivedAt)} アーカイブ
                    {company.archivedAt && ` (${Math.floor((Date.now() - new Date(company.archivedAt).getTime()) / (1000 * 60 * 60 * 24))}日前)`}
                  </span>
                  {company._count.stages > 0 && (
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                      {company._count.stages}ステージ
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" size="sm" onClick={() => handleRestore(company.id)} className="gap-1.5 h-7">
                  <RotateCcw className="h-3 w-3" />
                  復元
                </Button>
                <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingId(company.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="完全に削除しますか？"
        description="この操作は元に戻せません。すべての関連データも削除されます。"
        confirmLabel="完全削除"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
