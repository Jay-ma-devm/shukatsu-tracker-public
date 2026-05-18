"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function useKeyboardShortcuts(onOpenHelp?: () => void) {
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(tag) || (e.target as HTMLElement)?.isContentEditable

      // ? → ヘルプパネル (入力中は無視)
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !isInput) {
        e.preventDefault()
        onOpenHelp?.()
        return
      }

      if (!e.metaKey || !e.shiftKey) return

      const map: Record<string, string> = {
        h: "/",
        c: "/companies",
        t: "/tasks",
        l: "/calendar",
        n: "/notes?new=1",
        i: "/interviews?new=1",
        e: "/entry-sheets",
        m: "/meetings",
        k: "/cases",
        s: "/stats",
      }

      const dest = map[e.key.toLowerCase()]
      if (dest) {
        e.preventDefault()
        router.push(dest)
      }
    }

    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [router, onOpenHelp])
}
