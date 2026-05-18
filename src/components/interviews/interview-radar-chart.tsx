"use client"

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine } from "recharts"
import type { InterviewLog } from "@/types"
import { formatDate } from "@/lib/utils/date"

interface InterviewRadarChartProps {
  logs: InterviewLog[]
}

export function InterviewRadarChart({ logs }: InterviewRadarChartProps) {
  const rated = logs
    .filter((l) => l.rating)
    .sort((a, b) => new Date(a.conductedAt).getTime() - new Date(b.conductedAt).getTime())

  if (rated.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
        評価済みの面接ログを2件以上記録するとグラフが表示されます
      </div>
    )
  }

  const data = rated.map((l) => ({
    date: formatDate(l.conductedAt),
    rating: l.rating,
    name: l.type,
  }))

  const avg = (rated.reduce((s, l) => s + (l.rating ?? 0), 0) / rated.length).toFixed(1)
  const latest = rated[rated.length - 1]?.rating ?? 0
  const trend = rated.length >= 2
    ? (latest - (rated[0]?.rating ?? 0)) >= 0 ? "↑上昇傾向" : "↓下降傾向"
    : ""

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>平均: <span className="font-bold text-foreground">★{avg}</span></span>
        {trend && <span className={latest >= Number(avg) ? "text-emerald-600" : "text-amber-600"}>{trend}</span>}
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis domain={[1, 5]} tickCount={5} tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip
            formatter={(v) => [`★${v}`, "自己評価"]}
            contentStyle={{ fontSize: 11 }}
          />
          <ReferenceLine
            y={Number(avg)}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: `平均★${avg}`, fill: "#f59e0b", fontSize: 9, position: "insideTopRight" }}
          />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 4, fill: "#10b981" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
