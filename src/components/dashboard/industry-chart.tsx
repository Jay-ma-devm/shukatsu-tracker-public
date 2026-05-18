"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface IndustryChartProps {
  data: { name: string; value: number }[]
}

const COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#f97316",
  "#06b6d4", "#ec4899", "#84cc16", "#64748b", "#ef4444",
]

export function IndustryChart({ data }: IndustryChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        データがありません
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={70}
          innerRadius={35}
          dataKey="value"
          paddingAngle={2}
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [`${v}社`, "企業数"]} contentStyle={{ fontSize: 12 }} />
        <Legend
          formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
          wrapperStyle={{ fontSize: 11 }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
