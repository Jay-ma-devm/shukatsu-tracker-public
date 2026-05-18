"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Kanban,
  Calendar,
  BookOpen,
  GitCompare,
  Mail,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  CheckSquare,
  FileText,
  MessageSquare,
  Users,
  Milestone,
  BarChart2,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  group?: string
}

const navItems: NavItem[] = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard, group: "main" },
  { href: "/today", label: "今日やること", icon: Zap, group: "main" },
  { href: "/tasks", label: "タスク", icon: CheckSquare, group: "main" },
  { href: "/calendar", label: "カレンダー", icon: Calendar, group: "main" },
  { href: "/companies", label: "企業管理", icon: Building2, group: "companies" },
  { href: "/companies/kanban", label: "カンバン", icon: Kanban, group: "companies" },
  { href: "/entry-sheets", label: "ES管理", icon: FileText, group: "process" },
  { href: "/cases", label: "ケース練習", icon: BookOpen, group: "process" },
  { href: "/interviews", label: "面接ログ", icon: MessageSquare, group: "process" },
  { href: "/meetings", label: "OB訪問", icon: Users, group: "process" },
  { href: "/notes", label: "ノート", icon: FileText, group: "knowledge" },
  { href: "/career", label: "キャリア軌跡", icon: Milestone, group: "knowledge" },
  { href: "/companies/compare", label: "企業比較", icon: GitCompare, group: "tools" },
  { href: "/stats", label: "就活統計", icon: BarChart2, group: "tools" },
  { href: "/templates", label: "メールテンプレ", icon: Mail, group: "tools" },
  { href: "/settings", label: "設定", icon: Settings, group: "bottom" },
]

const groupLabels: Record<string, string> = {
  main: "メイン",
  companies: "企業",
  process: "選考",
  knowledge: "ナレッジ",
  tools: "ツール",
}

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("sidebar-collapsed") === "true"
  })
  const [overdueCount, setOverdueCount] = useState(0)
  const [todayEventCount, setTodayEventCount] = useState(0)
  const [interviewCount, setInterviewCount] = useState(0)
  const [esUrgentCount, setEsUrgentCount] = useState(0)
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    const today = new Date()
    const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999)
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    Promise.all([
      fetch("/api/tasks?due=overdue").then((r) => r.ok ? r.json() : []),
      fetch(`/api/events?from=${todayStart.toISOString()}&to=${todayEnd.toISOString()}`).then((r) => r.ok ? r.json() : []),
      fetch("/api/companies?status=interview&status=internship&status=case&status=final&count=1").then((r) => r.ok ? r.json() : []),
      fetch("/api/entry-sheets").then((r) => r.ok ? r.json() : []),
    ]).then(([tasks, events, companies, sheets]) => {
      setOverdueCount(Array.isArray(tasks) ? tasks.length : 0)
      setTodayEventCount(Array.isArray(events) ? (events as { completed?: boolean }[]).filter((e) => !e.completed).length : 0)
      setInterviewCount(Array.isArray(companies) ? companies.filter((c: { status: string }) => ["interview", "internship", "case", "final"].includes(c.status)).length : 0)
      if (Array.isArray(sheets)) {
        const urgent = (sheets as { deadline?: string; status: string }[]).filter((s) => {
          if (!s.deadline || ["submitted", "passed", "failed"].includes(s.status)) return false
          const days = (new Date(s.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          return days <= 7 && days >= 0
        }).length
        setEsUrgentCount(urgent)
      }
    }).catch(() => {})
  }, [pathname])

  useEffect(() => {
    fetch("/api/user/plan").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d?.isPro) setIsPro(true)
    }).catch(() => {})
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem("sidebar-collapsed", String(next))
  }

  const groups = Array.from(new Set(navItems.map((i) => i.group)))

  return (
    <TooltipProvider delay={0}>
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen border-r bg-sidebar text-sidebar-foreground transition-all duration-200 relative",
          collapsed ? "w-14" : "w-56"
        )}
      >
        {/* ロゴ */}
        <div className={cn("flex items-center h-14 border-b px-3 shrink-0", collapsed ? "justify-center" : "gap-2")}>
          <GraduationCap className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && (
            <span className="font-semibold text-sm tracking-tight">就活トラッカー</span>
          )}
        </div>

        {/* ナビ */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-3">
          {groups.filter(g => g !== "bottom").map((group) => {
            const items = navItems.filter((i) => i.group === group)
            return (
              <div key={group}>
                {!collapsed && groupLabels[group!] && (
                  <p className="text-[10px] font-semibold text-muted-foreground/60 px-3 mb-1 uppercase tracking-wide">
                    {groupLabels[group!]}
                  </p>
                )}
                <div className="space-y-0.5">
                  {items.map((item) => <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed}
                    allHrefs={navItems.map((i) => i.href)}
                    badge={
                      item.href === "/tasks" && overdueCount > 0 ? overdueCount :
                      item.href === "/calendar" && todayEventCount > 0 ? todayEventCount :
                      item.href === "/companies" && interviewCount > 0 ? interviewCount :
                      item.href === "/entry-sheets" && esUrgentCount > 0 ? esUrgentCount :
                      undefined
                    }
                    badgeColor={
                      item.href === "/tasks" ? "red" :
                      item.href === "/companies" ? "amber" :
                      item.href === "/entry-sheets" ? "red" :
                      "green"
                    }
                  />)}
                </div>
              </div>
            )
          })}
        </nav>

        {/* 下部: Proバッジ + 設定 + ショートカットヒント */}
        <div className="px-2 pb-3 pt-1 border-t space-y-1">
          {/* Pro/Free バッジ */}
          {!collapsed && (
            isPro ? (
              <div className="px-3 py-1.5">
                <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full text-xs font-medium">
                  ★ Pro
                </span>
              </div>
            ) : (
              <Link
                href="/pricing"
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-primary flex items-center gap-1 rounded-lg hover:bg-accent transition-colors"
              >
                ↑ Proにアップグレード
              </Link>
            )
          )}
          {collapsed && (
            isPro ? (
              <div className="flex justify-center py-1">
                <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1 py-0.5 rounded font-medium">
                  Pro
                </span>
              </div>
            ) : (
              <Link
                href="/pricing"
                className="flex justify-center py-1 text-[9px] text-muted-foreground hover:text-primary"
                title="Proにアップグレード"
              >
                ↑Pro
              </Link>
            )
          )}
          {navItems.filter(i => i.group === "bottom").map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
          ))}
          {!collapsed && (
            <div className="px-3 pt-1 text-[10px] text-muted-foreground/50 space-y-0.5">
              <p>⌘K 検索 &nbsp;|&nbsp; ? ショートカット一覧</p>
              <p>⌘⇧H ホーム &nbsp; ⌘⇧C 企業 &nbsp; ⌘⇧T タスク</p>
              <p>⌘⇧S 統計 &nbsp; ⌘⇧I 面接 &nbsp; ⌘⇧N 企業追加</p>
            </div>
          )}
        </div>

        {/* 折りたたみボタン */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="absolute -right-3 top-16 h-6 w-6 rounded-full border bg-background shadow-sm hover:shadow-md transition-shadow"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </aside>
    </TooltipProvider>
  )
}

function NavLink({ item, pathname, collapsed, badge, badgeColor = "red", allHrefs = [] }: { item: NavItem; pathname: string; collapsed: boolean; badge?: number; badgeColor?: "red" | "amber" | "green"; allHrefs?: string[] }) {
  const Icon = item.icon
  const isActive =
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href ||
        (pathname.startsWith(item.href + "/") &&
          // 子パスがナビアイテムとして存在する場合は親をアクティブにしない
          !allHrefs.some(
            (href) =>
              href !== item.href &&
              href.startsWith(item.href + "/") &&
              (pathname === href || pathname.startsWith(href + "/"))
          ))

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span />} className="block">
          <Link
            href={item.href}
            className={cn(
              "relative flex items-center justify-center h-8 w-8 mx-auto rounded-lg transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground text-sidebar-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {badge ? (
              <span className={cn(
                "absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full text-white text-[8px] flex items-center justify-center font-bold",
                badgeColor === "red" ? "bg-red-500" : badgeColor === "amber" ? "bg-amber-500" : "bg-emerald-500"
              )}>
                {badge > 9 ? "9+" : badge}
              </span>
            ) : null}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}{badge ? ` (${badge}件期限超過)` : ""}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 px-3 h-8 rounded-lg text-sm transition-colors",
        isActive
          ? "bg-primary text-primary-foreground font-medium"
          : "hover:bg-accent hover:text-accent-foreground text-sidebar-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate flex-1">{item.label}</span>
      {badge ? (
        <span className={cn(
          "shrink-0 h-4 min-w-[16px] px-1 rounded-full text-white text-[9px] flex items-center justify-center font-bold",
          badgeColor === "red" ? "bg-red-500" : badgeColor === "amber" ? "bg-amber-500" : "bg-emerald-500"
        )}>
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  )
}
