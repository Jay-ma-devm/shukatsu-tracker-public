"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Timer, Play, Pause, RotateCcw, X, Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const WORK_MINUTES = 25
const BREAK_MINUTES = 5

interface PomodoroTimerProps {
  taskTitle?: string
  onClose?: () => void
}

export function PomodoroTimer({ taskTitle, onClose }: PomodoroTimerProps) {
  const [mode, setMode] = useState<"work" | "break">("work")
  const [secondsLeft, setSecondsLeft] = useState(WORK_MINUTES * 60)
  const [running, setRunning] = useState(false)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSeconds = mode === "work" ? WORK_MINUTES * 60 : BREAK_MINUTES * 60
  const progress = (totalSeconds - secondsLeft) / totalSeconds
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  const tick = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        // タイマー終了
        setRunning(false)
        if (mode === "work") {
          setCompletedPomodoros((c) => c + 1)
          // ブラウザ通知
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("🍅 ポモドーロ完了！", { body: "5分休憩しましょう", icon: "/icon.svg" })
          }
          setMode("break")
          return BREAK_MINUTES * 60
        } else {
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("☕ 休憩終了", { body: "次のポモドーロを始めましょう", icon: "/icon.svg" })
          }
          setMode("work")
          return WORK_MINUTES * 60
        }
      }
      return prev - 1
    })
  }, [mode])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, tick])

  // 通知権限リクエスト
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const handleReset = () => {
    setRunning(false)
    setSecondsLeft(mode === "work" ? WORK_MINUTES * 60 : BREAK_MINUTES * 60)
  }

  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-card border rounded-2xl shadow-xl p-4 w-64 md:w-72">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {mode === "work" ? (
            <span className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full">🍅 集中</span>
          ) : (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">☕ 休憩</span>
          )}
          {completedPomodoros > 0 && (
            <span className="text-xs text-muted-foreground">{"🍅".repeat(Math.min(completedPomodoros, 4))}</span>
          )}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {taskTitle && (
        <p className="text-xs text-muted-foreground truncate mb-3 bg-muted/50 px-2 py-1 rounded-lg">{taskTitle}</p>
      )}

      {/* 円形プログレス */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/30" />
            <circle
              cx="60" cy="60" r="54"
              stroke="currentColor" strokeWidth="8" fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className={cn("transition-all duration-1000", mode === "work" ? "text-red-500" : "text-emerald-500")}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-mono font-bold tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* コントロール */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleReset} className="h-8 w-8 text-muted-foreground">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          onClick={() => setRunning((r) => !r)}
          className={cn("gap-1.5 min-w-[80px]", mode === "work" ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600")}
        >
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {running ? "一時停止" : "開始"}
        </Button>
        <Button
          variant="ghost" size="icon"
          onClick={() => { setMode((m) => m === "work" ? "break" : "work"); setRunning(false); setSecondsLeft(mode === "work" ? BREAK_MINUTES * 60 : WORK_MINUTES * 60) }}
          className="h-8 w-8 text-muted-foreground"
          title={mode === "work" ? "休憩に切替" : "集中に切替"}
        >
          {mode === "work" ? <Coffee className="h-3.5 w-3.5" /> : <Timer className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  )
}
