"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Star, Search, Plus, Calendar } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { CompanyStatusBadge } from "@/components/common/status-badge"
import { PriorityStars } from "@/components/common/priority-stars"
import { COMPANY_STATUSES } from "@/lib/constants"
import type { Company, Stage, CompanyStatus } from "@/types"
import type { NextEvent } from "@/types/company"
import { cn } from "@/lib/utils"

type CompanyWithStages = Company & { stages: Stage[]; nextEvents?: NextEvent[] }

const ACTIVE_STATUSES: CompanyStatus[] = [
  "applied",
  "screening",
  "interview",
  "internship",
  "case",
  "final",
  "offer",
  "accepted",
]

interface KanbanPageProps {
  initialCompanies: CompanyWithStages[]
}

export function KanbanPage({ initialCompanies }: KanbanPageProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [companies, setCompanies] = useState(initialCompanies)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null)
  const [search, setSearch] = useState(searchParams.get("q") ?? "")

  const filteredCompanies = useMemo(() => {
    if (!search) return companies
    const q = search.toLowerCase()
    return companies.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.position ?? "").toLowerCase().includes(q) ||
      (c.industry ?? "").toLowerCase().includes(q) ||
      (c.location ?? "").toLowerCase().includes(q) ||
      (c.notes ?? "").toLowerCase().includes(q)
    )
  }, [companies, search])

  const handleDragStart = (e: React.DragEvent, companyId: string) => {
    e.dataTransfer.setData("companyId", companyId)
    setDragging(companyId)
  }

  const handleDrop = async (e: React.DragEvent, newStatus: CompanyStatus) => {
    e.preventDefault()
    const companyId = e.dataTransfer.getData("companyId")
    const company = companies.find((c) => c.id === companyId)
    if (!company || company.status === newStatus) {
      setDragging(null)
      return
    }

    setCompanies((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, status: newStatus } : c))
    )
    setDragging(null)

    const res = await fetch(`/api/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })

    if (!res.ok) {
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, status: company.status } : c))
      )
      toast.error("ステータス更新に失敗しました")
    } else {
      toast.success(`${company.name}を${COMPANY_STATUSES.find(s => s.value === newStatus)?.label}に移動しました`)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">カンバン</h1>
          <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span>{companies.length}社</span>
            {(() => {
              const interviewCompanies = companies.filter((c) => ["interview", "internship", "case", "final"].includes(c.status))
              if (interviewCompanies.length > 0) {
                return <span className="text-amber-600 font-medium">面接中 {interviewCompanies.length}社</span>
              }
              return null
            })()}
            {companies.filter((c) => c.starred).length > 0 && (
              <span className="text-amber-500">★{companies.filter((c) => c.starred).length}</span>
            )}
            {search && <span>「{search}」で絞り込み: {filteredCompanies.length}社</span>}
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="企業名で絞り込み..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              const p = new URLSearchParams(searchParams.toString())
              if (e.target.value) p.set("q", e.target.value)
              else p.delete("q")
              router.replace(`/companies/kanban?${p.toString()}`, { scroll: false })
            }}
            className="h-8 w-48 text-sm pl-7"
          />
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {ACTIVE_STATUSES.map((status) => {
          const statusConfig = COMPANY_STATUSES.find((s) => s.value === status)
          const statusCompanies = filteredCompanies.filter((c) => c.status === status)

          return (
            <div
              key={status}
              className="flex flex-col min-w-[260px] w-[260px] shrink-0"
              onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status) }}
              onDragLeave={() => setDragOverStatus(null)}
              onDrop={(e) => { handleDrop(e, status); setDragOverStatus(null) }}
              aria-label={`${statusConfig?.label ?? status}カラム`}
              role="region"
            >
              {/* カラムヘッダー */}
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn("w-2 h-2 rounded-full", statusConfig?.bgColor.replace("bg-", "bg-"))}
                  />
                  <span className={cn("text-xs font-medium", statusConfig?.color)}>
                    {statusConfig?.label}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                    {statusCompanies.length}
                  </span>
                  {(() => {
                    const staleCount = statusCompanies.filter((c) =>
                      new Date(c.updatedAt).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000
                    ).length
                    return staleCount > 0 ? (
                      <span className="text-[9px] bg-amber-100 text-amber-700 rounded-full px-1" title={`${staleCount}社が7日以上未更新`}>
                        {staleCount}⚠
                      </span>
                    ) : null
                  })()}
                  <Link
                    href={`/companies?new=1&status=${status}`}
                    className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title={`${statusConfig?.label}で企業を追加`}
                  >
                    <Plus className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* カード */}
              <div className={cn("flex flex-col gap-2 min-h-[100px] rounded-xl p-1.5 bg-muted/30 transition-colors", dragging && dragOverStatus === status && "bg-primary/10 border-2 border-dashed border-primary/40")}>
                {statusCompanies.map((company) => {
                  const passedStages = company.stages.filter((s) => s.status === "passed").length
                  const totalStages = company.stages.length
                  return (
                    <div
                      key={company.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, company.id)}
                      onDragEnd={() => setDragging(null)}
                      className={cn(
                        "bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all",
                        dragging === company.id && "opacity-50 scale-95"
                      )}
                    >
                      <Link href={`/companies/${company.id}`} className="block" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <p className="text-sm font-medium leading-tight flex-1 min-w-0 truncate">
                            {company.name}
                          </p>
                          {company.starred && (
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
                          )}
                        </div>
                        {company.position && (
                          <p className="text-xs text-muted-foreground truncate mb-1.5">
                            {company.position}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <PriorityStars priority={company.priority} size="sm" />
                          {(() => {
                            const days = Math.floor((Date.now() - new Date(company.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
                            if (days < 1) return null
                            return (
                              <span className={`text-[9px] ${days > 7 ? "text-amber-500" : "text-muted-foreground/50"}`}>
                                {days}日前
                              </span>
                            )
                          })()}
                        </div>
                        {company.nextEvents && company.nextEvents[0] && (() => {
                          const ev = company.nextEvents![0]
                          const daysUntil = Math.ceil((new Date(ev.startAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                          return (
                            <div className="flex items-center gap-1 mt-1.5">
                              <Calendar className={`h-2.5 w-2.5 shrink-0 ${["interview", "case_interview"].includes(ev.type) && daysUntil <= 3 ? "text-red-500" : "text-amber-500"}`} />
                              <span className={`text-[10px] ${daysUntil <= 1 ? "text-red-500 font-medium" : daysUntil <= 3 ? "text-amber-600" : "text-muted-foreground"}`}>
                                {["interview", "case_interview"].includes(ev.type) && <span className="text-[9px] mr-0.5">面接</span>}
                                {ev.type === "deadline" && <span className="text-[9px] mr-0.5">〆切</span>}
                                {daysUntil === 0 ? "今日" : daysUntil === 1 ? "明日" : `${daysUntil}日後`}
                              </span>
                            </div>
                          )
                        })()}
                        {totalStages > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                              <span>ステージ</span>
                              <span>{passedStages}/{totalStages}</span>
                            </div>
                            <div className="bg-muted rounded-full h-1">
                              <div
                                className="bg-emerald-500 h-1 rounded-full transition-all"
                                style={{ width: `${totalStages > 0 ? (passedStages / totalStages) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </Link>
                    </div>
                  )
                })}

                {statusCompanies.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center py-4 gap-2">
                    <p className="text-xs text-muted-foreground/50">ここにドロップ</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
