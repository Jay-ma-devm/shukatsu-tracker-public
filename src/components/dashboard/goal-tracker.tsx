"use client"

import { useState, useEffect } from "react"
import { Target, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

const DEFAULT_DEADLINE = "2026-10-31" // 就活終了目標日

interface GoalTrackerProps {
  currentOffers: number
  totalCompanies: number
}

export function GoalTracker({ currentOffers, totalCompanies }: GoalTrackerProps) {
  const [targetOffers, setTargetOffers] = useState<number>(3)
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState("")
  const [deadline, setDeadline] = useState(DEFAULT_DEADLINE)

  useEffect(() => {
    const saved = localStorage.getItem("job-goal-deadline")
    if (saved) setDeadline(saved)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem("job-goal-offers")
    if (saved) setTargetOffers(parseInt(saved))
  }, [])

  if (totalCompanies === 0) return null

  const progress = Math.min(100, Math.round((currentOffers / targetOffers) * 100))
  const achieved = currentOffers >= targetOffers

  return (
    <div className="rounded-xl border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium">就活目標</span>
        </div>
        {!editing ? (
          <button
            onClick={() => { setInputVal(String(targetOffers)); setEditing(true) }}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            目標を変更
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={20}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="h-6 w-12 text-xs border rounded px-1"
              autoFocus
            />
            <button
              onClick={() => {
                const val = parseInt(inputVal)
                if (val > 0) {
                  setTargetOffers(val)
                  localStorage.setItem("job-goal-offers", String(val))
                }
                setEditing(false)
              }}
              className="text-[10px] text-primary"
            >
              保存
            </button>
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className={cn(achieved ? "text-emerald-600 font-medium" : "text-muted-foreground")}>
            内定 {currentOffers} / 目標 {targetOffers}社
          </span>
          <span className={cn("font-medium", achieved ? "text-emerald-600" : "text-muted-foreground")}>
            {progress}%{achieved ? " 達成！🎉" : ""}
          </span>
        </div>
        <div className="bg-muted rounded-full h-2">
          <div
            className={cn("h-2 rounded-full transition-all", achieved ? "bg-emerald-500" : "bg-primary")}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      {(() => {
        const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        if (daysLeft <= 0) return null
        return (
          <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t pt-2">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              就活期限まで
            </span>
            <div className="flex items-center gap-1">
              <span className={cn("font-medium", daysLeft <= 30 ? "text-red-500" : daysLeft <= 60 ? "text-amber-500" : "text-foreground")}>
                残り {daysLeft}日
              </span>
              <input
                type="date"
                value={deadline}
                onChange={(e) => {
                  if (e.target.value) {
                    setDeadline(e.target.value)
                    localStorage.setItem("job-goal-deadline", e.target.value)
                  }
                }}
                className="text-[9px] border rounded px-1 py-0.5 bg-background text-muted-foreground hover:border-primary transition-colors cursor-pointer h-5 w-24"
                title="期限を変更"
              />
            </div>
          </div>
        )
      })()}
    </div>
  )
}
