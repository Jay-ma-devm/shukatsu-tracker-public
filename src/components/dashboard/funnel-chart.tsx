"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useRouter } from "next/navigation"
import { COMPANY_STATUSES } from "@/lib/constants"
import type { CompanyStatus } from "@/types"

interface FunnelChartProps {
  statusCounts: Record<string, number>
}

const STATUS_ORDER: CompanyStatus[] = [
  "applied",
  "screening",
  "interview",
  "internship",
  "case",
  "final",
  "offer",
  "accepted",
]

const COLORS: Record<CompanyStatus, string> = {
  applied: "#64748b",
  screening: "#3b82f6",
  interview: "#f59e0b",
  internship: "#06b6d4",
  case: "#8b5cf6",
  final: "#f97316",
  offer: "#10b981",
  accepted: "#059669",
  rejected: "#ef4444",
  withdrawn: "#71717a",
}

export function FunnelChart({ statusCounts }: FunnelChartProps) {
  const router = useRouter()
  const data = STATUS_ORDER.map((status) => ({
    name: COMPANY_STATUSES.find((s) => s.value === status)?.label ?? status,
    value: statusCounts[status] ?? 0,
    status,
  })).filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        データがありません
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 8, left: -20, bottom: 4 }}
        onClick={(payload: unknown) => {
          const p = payload as { activePayload?: { payload?: { status?: string } }[] } | null
          if (p?.activePayload?.[0]?.payload?.status) {
            router.push(`/companies?status=${p.activePayload[0].payload.status}`)
          }
        }}
        style={{ cursor: "pointer" }}
      >
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip
          formatter={(value) => [`${value}社 (クリックして詳細)`, "企業数"]}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={COLORS[entry.status as CompanyStatus]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
