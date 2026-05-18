"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Plus, Pin, FileText, Trash2, Search, Download, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { NoteEditor } from "./note-editor"
import { NOTE_CATEGORIES } from "@/lib/constants"
import { formatRelative } from "@/lib/utils/date"
import type { Note } from "@/types"
import { cn } from "@/lib/utils"

type NoteWithCompany = Note & { company: { id: string; name: string } | null }
type CompanyOption = { id: string; name: string }

interface NotesPageClientProps {
  initialNotes: NoteWithCompany[]
  companies: CompanyOption[]
}

export function NotesPageClient({ initialNotes, companies }: NotesPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes)
  const initialId = searchParams.get("id") ?? notes[0]?.id ?? null
  const [selectedId, setSelectedId] = useState<string | null>(initialId)
  const selectedRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (selectedId) {
      selectedRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [selectedId])
  const [showCreate, setShowCreate] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [tagFilter, setTagFilter] = useState("")
  const [companyFilter, setCompanyFilter] = useState(searchParams.get("companyId") ?? "all")
  const [recencyFilter, setRecencyFilter] = useState<"all" | "today" | "week">("all")
  const [sortBy, setSortBy] = useState<"updatedAt" | "title" | "createdAt">("updatedAt")

  const pendingCompanyId = searchParams.get("companyId")

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      const companyId = searchParams.get("companyId") ?? undefined
      handleCreateWithCompany(companyId)
      router.replace("/notes", { scroll: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router])

  const now = Date.now()
  const filteredNotes = notes.filter((n) => {
    if (categoryFilter !== "all" && n.category !== categoryFilter) return false
    if (tagFilter && !(n.tags ?? "").toLowerCase().split(",").map((t) => t.trim()).includes(tagFilter.toLowerCase())) return false
    if (companyFilter !== "all" && (n.company?.id ?? "none") !== companyFilter) return false
    if (recencyFilter === "today") {
      const start = new Date(); start.setHours(0, 0, 0, 0)
      if (new Date(n.updatedAt).getTime() < start.getTime()) return false
    }
    if (recencyFilter === "week" && new Date(n.updatedAt).getTime() < now - 7 * 24 * 60 * 60 * 1000) return false
    if (search) {
      const q = search.toLowerCase()
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || (n.tags ?? "").toLowerCase().includes(q) || (n.company?.name ?? "").toLowerCase().includes(q) || (n.category ?? "").toLowerCase().includes(q)
    }
    return true
  }).sort((a, b) => {
    if (sortBy === "title") return a.title.localeCompare(b.title, "ja")
    if (sortBy === "createdAt") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  // 全タグ一覧
  const allTags = Array.from(
    new Set(notes.flatMap((n) => (n.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean)))
  ).sort()

  const selectedNote = notes.find((n) => n.id === selectedId)

  const handleCreateWithCompany = async (companyId?: string) => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "新しいノート",
        content: "",
        pinned: false,
        ...(companyId ? { companyId } : {}),
      }),
    })
    if (res.ok) {
      const note = await res.json()
      setNotes((prev) => [note, ...prev])
      setSelectedId(note.id)
      setShowCreate(false)
    }
  }

  const handleCreate = () => handleCreateWithCompany(pendingCompanyId ?? undefined)

  const NOTE_TEMPLATES = [
    { label: "面接振り返り", title: "面接振り返りメモ", category: "interview",
      content: "## 基本情報\n- 企業名: \n- 面接日: \n- 面接形式: \n- 面接官: \n\n## 聞かれた質問\n1. \n2. \n3. \n\n## 自分の回答（良かった点）\n\n## 改善できる点\n\n## 企業の印象・感触\n\n## 次回への対策\n" },
    { label: "OB訪問メモ", title: "OB訪問まとめ", category: "research",
      content: "## 基本情報\n- 企業名: \n- 訪問日: \n- お相手: \n\n## 聞いた質問と回答\n\n### 仕事内容について\n\n### キャリアパスについて\n\n### 選考について\n\n## 印象・メモ\n\n## アクション（お礼メール等）\n" },
    { label: "企業研究メモ", title: "企業研究", category: "research",
      content: "## 基本情報\n- 企業名: \n- 業界: \n- 規模: \n\n## 事業内容\n\n## 強み・差別化\n\n## 課題・リスク\n\n## 志望動機のポイント\n\n## 逆質問候補\n1. \n2. \n3. \n" },
    { label: "自己PR下書き", title: "自己PR下書き", category: "career",
      content: "## 軸（一言）\n\n## エピソード①\n- 状況: \n- 行動: \n- 結果: \n- 学び: \n\n## エピソード②\n\n## まとめ（なぜこの会社か）\n" },
    { label: "週次振り返り", title: "週次振り返り", category: "other",
      content: `## ${new Date().toLocaleDateString("ja-JP")} 週次振り返り\n\n### 今週やったこと\n- \n\n### 選考状況\n- \n\n### 来週やること\n- [ ] \n- [ ] \n- [ ] \n\n### モチベーションメーター（/10）: \n` },
    { label: "今日の就活日記", title: `${new Date().toLocaleDateString("ja-JP")} 就活日記`, category: "other",
      content: `## ${new Date().toLocaleDateString("ja-JP")} 就活日記\n\n### 今日やったこと\n- \n\n### 気になったこと・発見\n\n### 明日やること\n- [ ] \n\n### 今日のコンディション\n😊 モチベ（1-10）: \n🧠 思考の鮮度（1-10）: \n\n### 一言メモ\n` },
    { label: "インターン準備チェック", title: "インターン準備リスト", category: "interview",
      content: "## 基本情報\n- 企業名: \n- 日程: \n- 場所: \n\n## 事前準備\n- [ ] 企業・事業リサーチ\n- [ ] フレームワーク復習（MECE・3C・利益ツリー）\n- [ ] PC環境セットアップ\n- [ ] 当日の交通経路確認\n- [ ] 服装確認\n\n## 心がけること\n- 積極的に発言する\n- 他の参加者から学ぶ\n- 社員との接点を大切にする\n\n## インターン後\n- [ ] お礼メール（当日中）\n- [ ] 振り返りまとめ\n" },
  ]

  const handleCreateFromTemplate = async (tpl: typeof NOTE_TEMPLATES[0]) => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: tpl.title, content: tpl.content, category: tpl.category, pinned: false }),
    })
    if (res.ok) {
      const note = await res.json()
      setNotes((prev) => [note, ...prev])
      setSelectedId(note.id)
      toast.success(`「${tpl.label}」テンプレートを作成しました`)
    }
  }

  const handleSave = useCallback(async (id: string, data: Partial<NoteWithCompany>) => {
    const res = await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const updated = await res.json()
      setNotes((prev) => prev.map((n) => n.id === id ? updated : n))
    }
  }, [])

  const handleTogglePin = async (note: NoteWithCompany) => {
    await handleSave(note.id, { pinned: !note.pinned })
  }

  const handleExportCSV = () => {
    const headers = ["タイトル", "カテゴリ", "内容", "タグ", "企業", "ピン", "更新日"]
    const rows = filteredNotes.map((n) => [
      n.title,
      n.category ?? "",
      n.content,
      n.tags ?? "",
      n.company?.name ?? "",
      n.pinned ? "はい" : "いいえ",
      new Date(n.updatedAt).toLocaleDateString("ja-JP"),
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `notes-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${filteredNotes.length}件をCSVでエクスポートしました`)
  }

  const handleExportMarkdown = () => {
    const md = filteredNotes.map((n) => {
      const lines = [
        `# ${n.title}`,
        n.company ? `> 企業: ${n.company.name}` : "",
        n.category ? `> カテゴリ: ${n.category}` : "",
        "",
        n.content || "（空白）",
        "",
        `---`,
        `更新日: ${new Date(n.updatedAt).toLocaleDateString("ja-JP")}`,
      ].filter((l, i) => i === 0 || l !== "")
      return lines.join("\n")
    }).join("\n\n")
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `notes-${new Date().toISOString().split("T")[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${filteredNotes.length}件をMarkdownでエクスポートしました`)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    const res = await fetch(`/api/notes/${deletingId}`, { method: "DELETE" })
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== deletingId))
      if (selectedId === deletingId) {
        setSelectedId(notes.filter((n) => n.id !== deletingId)[0]?.id ?? null)
      }
      toast.success("ノートを削除しました")
    }
    setDeletingId(null)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ノート一覧パネル - モバイルでは選択時に非表示 */}
      <div className={cn("border-r flex flex-col shrink-0 bg-sidebar", "w-full sm:w-72", selectedId && "hidden sm:flex")}>
        <div className="p-3 border-b space-y-2">
          {companyFilter !== "all" && (() => {
            const company = companies.find((c) => c.id === companyFilter)
            return company ? (
              <Link
                href={`/companies/${company.id}?tab=notes`}
                className="text-[10px] text-primary hover:underline flex items-center gap-0.5 mb-1"
              >
                ← {company.name}へ戻る
              </Link>
            ) : null
          })()}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">ノート</h2>
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{filteredNotes.length}</span>
              {notes.filter((n) => n.pinned).length > 0 && (
                <span className="text-[9px] text-amber-500 flex items-center gap-0.5">
                  <Pin className="h-2.5 w-2.5 fill-current" />{notes.filter((n) => n.pinned).length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {filteredNotes.length > 0 && (
                <>
                <Button size="icon-sm" variant="ghost" onClick={handleExportMarkdown} className="h-7 w-7" title="Markdownエクスポート">
                  <FileText className="h-3 w-3" />
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={handleExportCSV} className="h-7 w-7" title="CSVエクスポート">
                  <Download className="h-3 w-3" />
                </Button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground" title="テンプレートから作成">
                  <ChevronDown className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {NOTE_TEMPLATES.map((tpl) => (
                    <DropdownMenuItem key={tpl.label} onClick={() => handleCreateFromTemplate(tpl)}>
                      {tpl.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCreate}>空白から作成</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="icon-sm" onClick={handleCreate} className="h-7 w-7">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 text-xs pl-7"
            />
          </div>
          {companies.length > 0 && (
            <Select value={companyFilter} onValueChange={(v: string | null) => setCompanyFilter(v ?? "all")}>
              <SelectTrigger className="h-7 text-xs w-28"><SelectValue placeholder="企業" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての企業</SelectItem>
                <SelectItem value="none">企業なし</SelectItem>
                {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={categoryFilter} onValueChange={(v: string | null) => setCategoryFilter(v ?? "all")}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて ({notes.length})</SelectItem>
              {NOTE_CATEGORIES.filter((c) => notes.some((n) => n.category === c)).map((c) => (
                <SelectItem key={c} value={c}>{c} ({notes.filter((n) => n.category === c).length})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v: string | null) => setSortBy((v ?? "updatedAt") as typeof sortBy)}>
            <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">更新順</SelectItem>
              <SelectItem value="createdAt">作成順</SelectItem>
              <SelectItem value="title">タイトル順</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            {(["all", "today", "week"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRecencyFilter(r)}
                className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${recencyFilter === r ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {r === "all" ? "全期間" : r === "today" ? "今日" : "今週"}
              </button>
            ))}
          </div>
          {(search || categoryFilter !== "all" || tagFilter || companyFilter !== "all" || recencyFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setCategoryFilter("all"); setTagFilter(""); setCompanyFilter("all"); setRecencyFilter("all") }}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1"
              title="フィルターをリセット"
            >
              ✕
            </button>
          )}
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1 px-3 pb-2">
            {tagFilter && (
              <button
                onClick={() => setTagFilter("")}
                className="text-[10px] bg-primary/10 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full"
              >
                #{tagFilter} ×
              </button>
            )}
            {!tagFilter && allTags.slice(0, 6).map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag)}
                className="text-[10px] bg-muted/80 hover:bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              ノートがありません
            </div>
          ) : (
            filteredNotes.map((note) => (
              <button
                key={note.id}
                ref={selectedId === note.id ? selectedRef : undefined}
                onClick={() => {
                  setSelectedId(note.id)
                  const p = new URLSearchParams(searchParams.toString())
                  p.set("id", note.id)
                  router.replace(`/notes?${p.toString()}`, { scroll: false })
                }}
                className={cn(
                  "w-full text-left px-3 py-2.5 border-b hover:bg-accent/50 transition-colors group",
                  selectedId === note.id && "bg-accent",
                  note.pinned && selectedId !== note.id && "bg-amber-50/50 dark:bg-amber-950/20"
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className={cn("text-sm font-medium truncate flex-1", note.pinned && "text-primary")}>
                    {note.pinned && <Pin className="inline h-2.5 w-2.5 mr-1 fill-current" />}
                    {note.title}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={(e) => { e.stopPropagation(); setDeletingId(note.id) }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {note.content
                    ? note.content
                        .replace(/^#{1,3}\s+/gm, "")
                        .replace(/\*\*|__/g, "")
                        .replace(/\*|_/g, "")
                        .replace(/`{1,3}/g, "")
                        .replace(/^[-*+]\s+/gm, "")
                        .replace(/^---$/gm, "")
                        .trim() || "（空白）"
                    : "（空白）"}
                </p>
                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                  <p className="text-[10px] text-muted-foreground/60">
                    {formatRelative(note.updatedAt)}
                  </p>
                  {note.content.length > 0 && (
                    <span className="text-[9px] text-muted-foreground/50">{note.content.length}字</span>
                  )}
                  {note.company && (
                    <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1 rounded">
                      {note.company.name}
                    </span>
                  )}
                  {note.tags && note.tags.split(",").filter(Boolean).slice(0, 2).map((tag) => (
                    <span key={tag.trim()} className="text-[9px] bg-muted/60 px-1 rounded text-muted-foreground/70">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* エディタパネル - モバイルでは選択時のみ表示 */}
      <div className={cn("flex-1 overflow-hidden flex flex-col", !selectedId && "hidden sm:flex")}>
        {/* モバイル用戻るボタン */}
        {selectedNote && (
          <button
            onClick={() => {
              setSelectedId(null)
              const p = new URLSearchParams(searchParams.toString())
              p.delete("id")
              router.replace(`/notes${p.toString() ? "?" + p.toString() : ""}`, { scroll: false })
            }}
            className="sm:hidden flex items-center gap-1.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground border-b bg-background shrink-0"
          >
            ← ノート一覧に戻る
          </button>
        )}
        {selectedNote ? (
          <div className="flex-1 overflow-hidden">
            <NoteEditor
              note={selectedNote}
              companies={companies}
              onSave={handleSave}
              onDelete={(id) => setDeletingId(id)}
              onTogglePin={handleTogglePin}
            />
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="ノートを選択してください"
            description="左のパネルからノートを選ぶか、+ ボタンで新規作成"
            action={{ label: "新規ノートを作成", onClick: handleCreate }}
          />
        )}
      </div>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="ノートを削除しますか？"
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
