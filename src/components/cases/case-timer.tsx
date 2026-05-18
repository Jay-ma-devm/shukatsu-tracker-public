"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Play, Pause, RotateCcw, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PRESET_MINUTES = [5, 10, 15, 20, 30, 45, 60]

interface CaseTimerProps {
  onComplete?: (durationMinutes: number) => void
  className?: string
}

export function CaseTimer({ onComplete, className }: CaseTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(30 * 60)
  const [remaining, setRemaining] = useState(30 * 60)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const setPreset = (minutes: number) => {
    if (running) return
    const secs = minutes * 60
    setTotalSeconds(secs)
    setRemaining(secs)
    setFinished(false)
  }

  const start = () => {
    if (finished) return
    setRunning(true)
  }

  const pause = () => setRunning(false)

  const reset = () => {
    setRunning(false)
    setRemaining(totalSeconds)
    setFinished(false)
  }

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setRunning(false)
            setFinished(true)
            onComplete?.(Math.round(totalSeconds / 60))
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, totalSeconds, onComplete])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const progress = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 100
  const isLow = remaining < 300 && remaining > 0

  return (
    <div className={cn("flex flex-col items-center gap-3 p-4 border rounded-xl bg-card", className)}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Timer className="h-3.5 w-3.5" />
        ケースタイマー
      </div>

      {/* プリセット */}
      <div className="flex flex-wrap gap-1 justify-center">
        {PRESET_MINUTES.map((m) => (
          <button
            key={m}
            onClick={() => setPreset(m)}
            disabled={running}
            className={cn(
              "text-xs px-1.5 py-0.5 rounded-lg transition-colors",
              totalSeconds === m * 60
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground",
              running && "opacity-50 cursor-not-allowed"
            )}
          >
            {m}分
          </button>
        ))}
      </div>

      {/* タイマー表示 */}
      <div className="relative">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
          <circle
            cx="50" cy="50" r="45" fill="none" strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            className={cn("transition-all duration-1000", isLow ? "text-red-500" : "text-primary")}
            stroke="currentColor"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            "text-2xl font-mono font-bold tabular-nums",
            finished ? "text-emerald-500" : isLow ? "text-red-500" : "text-foreground"
          )}>
            {finished ? "完了!" : `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`}
          </span>
          {finished && (
            <span className="text-[10px] text-emerald-600 font-medium">
              {Math.round(totalSeconds / 60)}分
            </span>
          )}
        </div>
      </div>

      {/* コントロール */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        {running ? (
          <Button size="sm" onClick={pause} className="w-20">
            <Pause className="h-3.5 w-3.5 mr-1" />
            一時停止
          </Button>
        ) : (
          <Button size="sm" onClick={start} disabled={finished} className="w-20">
            <Play className="h-3.5 w-3.5 mr-1" />
            {remaining === totalSeconds ? "開始" : "再開"}
          </Button>
        )}
      </div>
      {/* 途中終了ボタン */}
      {!finished && totalSeconds !== remaining && onComplete && (
        <button
          onClick={() => {
            const elapsed = Math.max(1, Math.round((totalSeconds - remaining) / 60))
            setRunning(false)
            setFinished(true)
            onComplete(elapsed)
          }}
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors underline"
        >
          途中で終了して記録
        </button>
      )}
    </div>
  )
}
