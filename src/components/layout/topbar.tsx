"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Search,
  Menu,
  GraduationCap,
  LayoutDashboard,
  Building2,
  Kanban,
  Calendar,
  BookOpen,
  GitCompare,
  Mail,
  Settings,
  CheckSquare,
  FileText,
  MessageSquare,
  Users,
  Milestone,
  BarChart2,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const CommandPalette = dynamic(() => import("./command-palette").then((m) => m.CommandPalette), { ssr: false })
const NotificationBell = dynamic(() => import("./notification-bell").then((m) => m.NotificationBell), { ssr: false })

const navItems = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/tasks", label: "タスク", icon: CheckSquare },
  { href: "/companies", label: "企業管理", icon: Building2 },
  { href: "/companies/kanban", label: "カンバン", icon: Kanban },
  { href: "/calendar", label: "カレンダー", icon: Calendar },
  { href: "/cases", label: "ケース練習", icon: BookOpen },
  { href: "/interviews", label: "面接ログ", icon: MessageSquare },
  { href: "/meetings", label: "OB訪問", icon: Users },
  { href: "/entry-sheets", label: "ES管理", icon: FileText },
  { href: "/notes", label: "ノート", icon: FileText },
  { href: "/career", label: "キャリア軌跡", icon: Milestone },
  { href: "/companies/compare", label: "企業比較", icon: GitCompare },
  { href: "/stats", label: "就活統計", icon: BarChart2 },
  { href: "/templates", label: "メールテンプレ", icon: Mail },
  { href: "/settings", label: "設定", icon: Settings },
]

function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="md:hidden inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors text-foreground"
        aria-label="メニューを開く"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="h-14 flex flex-row items-center px-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
            <GraduationCap className="h-5 w-5 text-primary" />
            就活トラッカー
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 h-9 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

export function TopBar({ title }: { title?: string }) {
  return (
    <>
      <CommandPalette />
      <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-4 gap-3 shrink-0">
        <MobileNav />

        {/* タイトル */}
        <div className="flex-1 min-w-0">
          {title && (
            <h1 className="text-sm font-semibold truncate text-foreground/80">
              {title}
            </h1>
          )}
        </div>

        {/* 右側アクション */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex items-center gap-2 text-muted-foreground text-xs h-8"
            onClick={() => {
              const event = new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
                bubbles: true,
              })
              document.dispatchEvent(event)
            }}
          >
            <Search className="h-3.5 w-3.5" />
            <span>検索</span>
            <kbd className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
              ⌘K
            </kbd>
          </Button>
          <NotificationBell />
          <ThemeToggle />
        </div>
      </header>
    </>
  )
}
