"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Sidebar } from "./sidebar"
import { TopBar } from "./topbar"
import { BottomNav } from "./bottom-nav"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"

const ShortcutsHelp = dynamic(() => import("./shortcuts-help").then((m) => m.ShortcutsHelp), { ssr: false })

interface AppShellProps {
  children: React.ReactNode
  title?: string
}

export function AppShell({ children, title }: AppShellProps) {
  const [showShortcuts, setShowShortcuts] = useState(false)
  useKeyboardShortcuts(() => setShowShortcuts(true))

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto pb-14 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
      <ShortcutsHelp open={showShortcuts} onOpenChange={setShowShortcuts} />
    </div>
  )
}
