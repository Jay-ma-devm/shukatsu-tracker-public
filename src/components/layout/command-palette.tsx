"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  LayoutDashboard,
  Building2,
  Kanban,
  Calendar,
  BookOpen,
  GitCompare,
  Mail,
  Settings,
  Plus,
  CheckSquare,
  FileText,
  MessageSquare,
  Users,
  Milestone,
  Search,
  BarChart2,
  Keyboard,
  Zap,
} from "lucide-react"

const pages = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/today", label: "今日やること", icon: Zap },
  { href: "/tasks", label: "タスク", icon: CheckSquare },
  { href: "/companies", label: "企業一覧", icon: Building2 },
  { href: "/companies/kanban", label: "カンバンビュー", icon: Kanban },
  { href: "/calendar", label: "カレンダー", icon: Calendar },
  { href: "/cases", label: "ケース練習", icon: BookOpen },
  { href: "/notes", label: "ノート", icon: FileText },
  { href: "/interviews", label: "面接ログ", icon: MessageSquare },
  { href: "/meetings", label: "OB訪問", icon: Users },
  { href: "/entry-sheets", label: "エントリーシート", icon: FileText },
  { href: "/career", label: "キャリア軌跡", icon: Milestone },
  { href: "/companies/compare", label: "企業比較", icon: GitCompare },
  { href: "/templates", label: "メールテンプレート", icon: Mail },
  { href: "/stats", label: "就活統計", icon: BarChart2 },
  { href: "/settings", label: "設定", icon: Settings },
]

const quickActions = [
  { label: "企業を追加", href: "/companies?new=1", icon: Building2 },
  { label: "タスクを追加", href: "/tasks?new=1", icon: CheckSquare },
  { label: "ノートを作成", href: "/notes?new=1", icon: FileText },
  { label: "ESを追加", href: "/entry-sheets?new=1", icon: FileText },
  { label: "面接ログを記録", href: "/interviews?new=1", icon: MessageSquare },
  { label: "OB訪問を記録", href: "/meetings?new=1", icon: Users },
  { label: "ケースを記録", href: "/cases?new=1", icon: BookOpen },
  { label: "キャリアエントリーを追加", href: "/career?new=1", icon: Milestone },
]

const companyFilters = [
  { label: "最終選考中の企業", href: "/companies?status=final", icon: Building2 },
  { label: "インターン確定の企業", href: "/companies?status=internship", icon: Building2 },
  { label: "面接中の企業", href: "/companies?status=interview", icon: Building2 },
  { label: "内定の企業", href: "/companies?status=offer", icon: Building2 },
  { label: "書類選考中の企業", href: "/companies?status=screening", icon: Building2 },
  { label: "期限超過タスク", href: "/tasks?due=overdue", icon: CheckSquare },
  { label: "今日やること", href: "/today", icon: Zap },
]

type SearchResult = {
  id: string
  type: "company" | "note" | "task" | "case" | "interview" | "es" | "career" | "meeting"
  label: string
  sub?: string
  href: string
}

const RECENT_SEARCHES_KEY = "cmd-recent-searches"
const RECENT_COMPANIES_KEY = "cmd-recent-companies"
const MAX_RECENT = 5

function getRecentSearches(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]") } catch { return [] }
}
function addRecentSearch(q: string) {
  const prev = getRecentSearches().filter((s) => s !== q)
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)))
}

type RecentCompany = { id: string; name: string }
function getRecentCompanies(): RecentCompany[] {
  try { return JSON.parse(localStorage.getItem(RECENT_COMPANIES_KEY) ?? "[]") } catch { return [] }
}
function addRecentCompany(company: RecentCompany) {
  const prev = getRecentCompanies().filter((c) => c.id !== company.id)
  localStorage.setItem(RECENT_COMPANIES_KEY, JSON.stringify([company, ...prev].slice(0, MAX_RECENT)))
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [recentCompanies, setRecentCompanies] = useState<RecentCompany[]>([])
  const router = useRouter()

  const [todayTaskCount, setTodayTaskCount] = useState(0)

  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches())
      setRecentCompanies(getRecentCompanies())
      fetch("/api/tasks?due=today").then((r) => r.ok ? r.json() : []).then((tasks: unknown[]) => setTodayTaskCount(Array.isArray(tasks) ? tasks.length : 0)).catch(() => {})
    }
  }, [open])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const active = document.activeElement
      const isTyping = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || (active as HTMLElement)?.isContentEditable
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === "n" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault()
        router.push("/companies?new=1")
      }
      if (e.key === "?" && !isTyping) {
        e.preventDefault()
        setShortcutsOpen((o) => !o)
      }
      if (e.metaKey && e.shiftKey) {
        if (e.key === "S" || e.key === "s") { e.preventDefault(); router.push("/stats") }
        if (e.key === "C" || e.key === "c") { e.preventDefault(); router.push("/companies") }
        if (e.key === "T" || e.key === "t") { e.preventDefault(); router.push("/tasks") }
        if (e.key === "H" || e.key === "h") { e.preventDefault(); router.push("/") }
        if (e.key === "I" || e.key === "i") { e.preventDefault(); router.push("/interviews") }
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [router])

  // 横断検索
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const [companiesRes, notesRes, casesRes, tasksRes, interviewsRes, esRes, careerRes, meetingsRes] = await Promise.all([
          fetch(`/api/companies?search=${encodeURIComponent(query)}`),
          fetch(`/api/notes?search=${encodeURIComponent(query)}`),
          fetch(`/api/cases?search=${encodeURIComponent(query)}`),
          fetch(`/api/tasks?search=${encodeURIComponent(query)}`),
          fetch(`/api/interviews?search=${encodeURIComponent(query)}`),
          fetch(`/api/entry-sheets?search=${encodeURIComponent(query)}`),
          fetch(`/api/career?search=${encodeURIComponent(query)}`),
          fetch(`/api/meetings?search=${encodeURIComponent(query)}`),
        ])
        const [companies, notes, cases, tasks, interviews, entrySheets, careerEntries, meetings] = await Promise.all([
          companiesRes.ok ? companiesRes.json() : [],
          notesRes.ok ? notesRes.json() : [],
          casesRes.ok ? casesRes.json() : [],
          tasksRes.ok ? tasksRes.json() : [],
          interviewsRes.ok ? interviewsRes.json() : [],
          esRes.ok ? esRes.json() : [],
          careerRes.ok ? careerRes.json() : [],
          meetingsRes.ok ? meetingsRes.json() : [],
        ])
        const combined: SearchResult[] = [
          ...(companies as { id: string; name: string; industry?: string; status?: string }[]).slice(0, 4).map((c) => {
            const statusLabels: Record<string, string> = { interview: "面接中", final: "最終", case: "ケース", offer: "内定", screening: "ES選考", applied: "応募済" }
            const sub = [statusLabels[c.status ?? ""] ?? c.status, c.industry].filter(Boolean).join(" · ")
            return { id: c.id, type: "company" as const, label: c.name, sub: sub || undefined, href: `/companies/${c.id}` }
          }),
          ...(notes as { id: string; title: string; category?: string }[]).slice(0, 3).map((n) => ({
            id: n.id, type: "note" as const,
            label: n.title, sub: n.category ?? undefined,
            href: `/notes?id=${n.id}`,
          })),
          ...(cases as { id: string; title: string; category?: string }[]).slice(0, 3).map((c) => ({
            id: c.id, type: "case" as const,
            label: c.title, sub: c.category ?? undefined,
            href: `/cases/${c.id}`,
          })),
          ...(tasks as { id: string; title: string; status: string }[]).slice(0, 3).map((t) => ({
            id: t.id, type: "task" as const,
            label: t.title, sub: t.status,
            href: `/tasks?q=${encodeURIComponent(t.title.slice(0, 20))}`,
          })),
          ...(interviews as { id: string; type: string; company?: { id: string; name: string } }[]).slice(0, 2).map((i) => ({
            id: i.id, type: "interview" as const,
            label: `${i.company?.name ?? ""}面接`, sub: i.type,
            href: i.company?.id ? `/interviews?company=${i.company.id}` : `/interviews`,
          })),
          ...(entrySheets as { id: string; title: string; company?: { name: string } }[]).slice(0, 2).map((e) => ({
            id: e.id, type: "es" as const,
            label: e.title, sub: e.company?.name,
            href: `/entry-sheets/${e.id}`,
          })),
          ...(careerEntries as { id: string; title: string; organization?: string }[]).slice(0, 2).map((c) => ({
            id: c.id, type: "career" as const,
            label: c.title, sub: c.organization ?? undefined,
            href: `/career`,
          })),
          ...(meetings as { id: string; title: string; company?: { name: string } }[]).slice(0, 2).map((m) => ({
            id: m.id, type: "meeting" as const,
            label: m.title, sub: m.company?.name,
            href: `/meetings`,
          })),
        ]
        setResults(combined)
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const navigate = useCallback((href: string, searchQuery?: string, companyInfo?: { id: string; name: string }) => {
    if (searchQuery && searchQuery.length >= 2) addRecentSearch(searchQuery)
    if (companyInfo) addRecentCompany(companyInfo)
    router.push(href)
    setOpen(false)
    setQuery("")
    setResults([])
  }, [router])

  const typeIcon = (type: SearchResult["type"]) => {
    const icons = { company: Building2, note: FileText, task: CheckSquare, case: BookOpen, interview: MessageSquare, es: FileText, career: Milestone, meeting: Users }
    return icons[type]
  }

  const typeLabel = (type: SearchResult["type"]) => {
    const labels = { company: "企業", note: "ノート", task: "タスク", case: "ケース", interview: "面接", es: "ES", career: "キャリア", meeting: "OB訪問" }
    return labels[type]
  }

  const shortcutGroups = [
    {
      label: "ナビゲーション",
      items: [
        { keys: ["⌘", "K"], desc: "コマンドパレットを開く" },
        { keys: ["?"], desc: "ショートカット一覧を表示" },
        { keys: ["⌘⇧", "H"], desc: "ダッシュボード" },
        { keys: ["⌘⇧", "C"], desc: "企業一覧" },
        { keys: ["⌘⇧", "T"], desc: "タスク" },
        { keys: ["⌘⇧", "S"], desc: "就活統計" },
        { keys: ["⌘⇧", "I"], desc: "面接ログ" },
      ],
    },
    {
      label: "クイック追加",
      items: [
        { keys: ["⌘⇧", "N"], desc: "企業を追加" },
      ],
    },
    {
      label: "ページ内ショートカット",
      items: [
        { keys: ["⌘", "S"], desc: "ESを保存（ES詳細ページ）" },
        { keys: ["⌘", "S"], desc: "ノートを保存（ノートエディタ）" },
        { keys: ["⌘", "P"], desc: "プレビュー切替（ノートエディタ）" },
        { keys: ["⌘", "B"], desc: "太字（ノートエディタ）" },
      ],
    },
    {
      label: "企業詳細ページ",
      items: [
        { keys: ["S"], desc: "スターをトグル" },
        { keys: ["E"], desc: "編集モーダルを開く" },
        { keys: ["1"], desc: "概要タブ" },
        { keys: ["2"], desc: "ステージタブ" },
        { keys: ["3"], desc: "タスクタブ" },
        { keys: ["4"], desc: "面接ログタブ" },
        { keys: ["N"], desc: "ノートタブ" },
        { keys: ["T"], desc: "タスクタブ" },
        { keys: ["I"], desc: "面接ログタブ" },
      ],
    },
  ]

  return (
    <>
    <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            キーボードショートカット
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {shortcutGroups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-muted-foreground mb-2">{group.label}</p>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div key={item.desc} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.desc}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key) => (
                        <kbd key={key} className="text-xs bg-muted border rounded px-1.5 py-0.5 font-mono">{key}</kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
    <CommandDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setQuery(""); setResults([]) } }}>
      <CommandInput
        placeholder={todayTaskCount > 0 ? `検索... (今日期限 ${todayTaskCount}件)` : "検索・ページ移動・クイック追加..."}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{searching ? "検索中..." : query.length >= 2 ? "見つかりませんでした" : "入力して横断検索"}</CommandEmpty>

        {/* 最近の検索 */}
        {!query && recentSearches.length > 0 && (
          <CommandGroup heading="最近の検索">
            {recentSearches.map((s) => (
              <CommandItem key={s} onSelect={() => setQuery(s)} className="cursor-pointer">
                <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">{s}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {recentSearches.length > 0 && !query && <CommandSeparator />}

        {/* 最近見た企業 */}
        {!query && recentCompanies.length > 0 && (
          <CommandGroup heading="最近見た企業">
            {recentCompanies.map((company) => (
              <CommandItem
                key={company.id}
                onSelect={() => navigate(`/companies/${company.id}`, undefined, company)}
                className="cursor-pointer"
              >
                <Building2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">{company.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!query && recentCompanies.length > 0 && <CommandSeparator />}

        {/* 横断検索結果 */}
        {results.length > 0 && (
          <CommandGroup heading={`検索結果 (${results.length}件)`}>
            {results.map((r) => {
              const Icon = typeIcon(r.type)
              return (
                <CommandItem
                  key={`${r.type}-${r.id}`}
                  onSelect={() => navigate(r.href, query, r.type === "company" ? { id: r.id, name: r.label } : undefined)}
                  className="cursor-pointer"
                >
                  <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <span className="truncate">{r.label}</span>
                    {r.sub && <span className="ml-2 text-xs text-muted-foreground">{r.sub}</span>}
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{typeLabel(r.type)}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        {results.length > 0 && <CommandSeparator />}

        {/* クイックアクション */}
        <CommandGroup heading="クイック追加">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <CommandItem key={action.href} onSelect={() => navigate(action.href)} className="cursor-pointer">
                <Plus className="mr-2 h-3.5 w-3.5 text-primary" />
                <Icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                {action.label}
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* クイックフィルター */}
        {!query && (
          <CommandGroup heading="クイックフィルター">
            {companyFilters.map((f) => {
              const Icon = f.icon
              return (
                <CommandItem key={f.href} onSelect={() => navigate(f.href)} className="cursor-pointer">
                  <Icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  {f.label}
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        {!query && <CommandSeparator />}

        {/* ページ移動 */}
        <CommandGroup heading="ページ移動">
          {pages.map((page) => {
            const Icon = page.icon
            return (
              <CommandItem key={page.href} onSelect={() => navigate(page.href)} className="cursor-pointer">
                <Icon className="mr-2 h-4 w-4" />
                {page.label}
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
    </>
  )
}
