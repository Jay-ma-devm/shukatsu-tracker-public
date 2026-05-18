"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, Home, RotateCcw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="text-center max-w-sm">
        <h2 className="text-xl font-semibold">エラーが発生しました</h2>
        <p className="text-muted-foreground mt-2 text-sm">{error.message || "予期しないエラーが発生しました"}</p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/50 mt-1 font-mono">エラーID: {error.digest}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={reset} variant="outline" className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          再試行
        </Button>
        <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Home className="h-3.5 w-3.5" />
          ホームへ戻る
        </Link>
      </div>
    </div>
  )
}
