"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Pin, Trash2, Eye, Edit3, Download, Copy, Check, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { NOTE_CATEGORIES } from "@/lib/constants"
import { formatDatetime } from "@/lib/utils/date"
import type { Note } from "@/types"
import { cn } from "@/lib/utils"

type NoteWithCompany = Note & { company: { id: string; name: string } | null }
type CompanyOption = { id: string; name: string }

interface NoteEditorProps {
  note: NoteWithCompany
  companies: CompanyOption[]
  onSave: (id: string, data: Partial<NoteWithCompany>) => Promise<void>
  onDelete: (id: string) => void
  onTogglePin: (note: NoteWithCompany) => Promise<void>
}

export function NoteEditor({ note, companies, onSave, onDelete, onTogglePin }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [category, setCategory] = useState(note.category ?? "")
  const [tags, setTags] = useState(note.tags ?? "")
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [preview, setPreview] = useState(false)
  const [copied, setCopied] = useState(false)
  const [aiSummarizing, setAiSummarizing] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // noteが切り替わったら状態をリセット
  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
    setCategory(note.category ?? "")
    setTags(note.tags ?? "")
    setLastSaved(null)
  }, [note.id])

  const save = useCallback(async (data: { title?: string; content?: string; category?: string; tags?: string }) => {
    setSaving(true)
    await onSave(note.id, data)
    setLastSaved(new Date())
    setSaving(false)
  }, [note.id, onSave])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTitle(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save({ title: val }), 1000)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save({ content: val }), 1000)
  }

  const handleCategoryChange = (v: string | null) => {
    const val = v ?? ""
    setCategory(val)
    save({ category: val || undefined })
  }

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTags(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save({ tags: val || undefined } as Parameters<typeof save>[0]), 1000)
  }

  // キーボードショートカット
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        save({ title, content, category })
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "p") {
        e.preventDefault()
        setPreview((p) => !p)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault()
        const ta = document.querySelector("textarea[placeholder*='ここにメモ']") as HTMLTextAreaElement
        if (!ta) return
        const start = ta.selectionStart
        const end = ta.selectionEnd
        const sel = content.slice(start, end)
        const newText = content.slice(0, start) + "**" + sel + "**" + content.slice(end)
        setContent(newText)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => save({ content: newText }), 1000)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [title, content, category, save])

  const handleCompanyChange = (v: string | null) => {
    const companyId = v && v !== "__none__" ? v : null
    save({ companyId } as Parameters<typeof save>[0])
  }

  const handleAiSummarize = async () => {
    if (!content || content.length < 50) {
      toast.error("要約するには50文字以上のコンテンツが必要です")
      return
    }
    setAiSummarizing(true)
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `${title}\n\n${content}`, type: "company_notes" }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "AI要約に失敗しました")
        return
      }
      const { summary } = await res.json()
      const newContent = content + "\n\n---\n**AI要約:**\n" + summary
      setContent(newContent)
      save({ content: newContent })
      toast.success("AI要約を追加しました")
    } catch {
      toast.error("AI要約に失敗しました")
    } finally {
      setAiSummarizing(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* ツールバー */}
      <div className="flex items-center gap-2 px-6 py-3 border-b shrink-0 flex-wrap">
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="h-7 w-36 text-xs"><SelectValue placeholder="カテゴリ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">なし</SelectItem>
            {NOTE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={tags}
          onChange={handleTagsChange}
          placeholder="タグ (カンマ区切り)"
          className="h-7 text-xs w-36 border-0 shadow-none bg-transparent focus-visible:ring-0 px-0"
          title="タグを入力 (例: 志望, IT)"
        />

        {companies.length > 0 && (
          <Select value={note.companyId ?? "__none__"} onValueChange={handleCompanyChange}>
            <SelectTrigger className="h-7 w-32 text-xs">
              <SelectValue placeholder="企業リンク" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">企業なし</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex-1" />

        {content.length > 0 && (
          <span className="text-xs text-muted-foreground/60 tabular-nums">{content.length}字</span>
        )}
        {saving ? (
          <span className="text-xs text-muted-foreground">保存中...</span>
        ) : lastSaved ? (
          <span className="text-xs text-muted-foreground">保存済み</span>
        ) : null}

        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7"
          title={aiSummarizing ? "AI要約中..." : "AIで要約を追加"}
          onClick={handleAiSummarize}
          disabled={aiSummarizing}
        >
          <Sparkles className={cn("h-3.5 w-3.5", aiSummarizing && "animate-pulse text-primary")} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7"
          title={copied ? "コピー済み" : "テキストをコピー"}
          onClick={async () => {
            await navigator.clipboard.writeText(`${title}\n\n${content}`)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7"
          title="Markdownでダウンロード"
          onClick={() => {
            const blob = new Blob([`# ${title}\n\n${content}`], { type: "text/markdown;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${title.replace(/[^a-zA-Z0-9ぁ-ん一-龥ー]/g, "-")}.md`
            a.click()
            URL.revokeObjectURL(url)
          }}
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setPreview(!preview)}
          className="h-7 w-7"
          title={preview ? "編集モード" : "プレビュー"}
        >
          {preview ? <Edit3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onTogglePin(note)}
          className={cn("h-7 w-7", note.pinned && "text-primary")}
          title={note.pinned ? "ピン解除" : "ピン留め"}
        >
          <Pin className={cn("h-3.5 w-3.5", note.pinned && "fill-current")} />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(note.id)}
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* エディタ本体 */}
      <div className="flex-1 overflow-y-auto p-6">
        <Input
          value={title}
          onChange={handleTitleChange}
          placeholder="タイトル"
          className="text-2xl font-bold border-none shadow-none px-0 h-auto py-2 focus-visible:ring-0"
        />

        {note.company && (
          <Badge variant="outline" className="mt-2 text-xs">{note.company.name}</Badge>
        )}

        {/* Markdownツールバー */}
        {!preview && (
          <div className="flex items-center gap-0.5 mt-4 mb-1">
            {[
              { label: "B", insert: "**", wrap: true, title: "太字 (Cmd+B)" },
              { label: "I", insert: "*", wrap: true, title: "斜体" },
              { label: "H2", insert: "## ", wrap: false, title: "見出し2" },
              { label: "H3", insert: "### ", wrap: false, title: "見出し3" },
              { label: "•", insert: "- ", wrap: false, title: "箇条書き" },
              { label: "1.", insert: "1. ", wrap: false, title: "番号リスト" },
              { label: "☐", insert: "- [ ] ", wrap: false, title: "チェックボックス" },
              { label: ">", insert: "> ", wrap: false, title: "引用" },
              { label: "`", insert: "`", wrap: true, title: "コード" },
              { label: "—", insert: "\n---\n", wrap: false, title: "区切り線" },
              { label: "📅", insert: `\n📅 ${new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })} `, wrap: false, title: "今日の日付を挿入" },
            ].map(({ label, insert, wrap, title }) => (
              <button
                key={label}
                title={title}
                onClick={() => {
                  const ta = document.querySelector("textarea[placeholder*='ここにメモ']") as HTMLTextAreaElement
                  if (!ta) return
                  const start = ta.selectionStart
                  const end = ta.selectionEnd
                  const sel = content.slice(start, end)
                  const newText = wrap
                    ? content.slice(0, start) + insert + sel + insert + content.slice(end)
                    : content.slice(0, start) + insert + sel + content.slice(end)
                  setContent(newText)
                  if (debounceRef.current) clearTimeout(debounceRef.current)
                  debounceRef.current = setTimeout(() => save({ content: newText }), 1000)
                  setTimeout(() => {
                    ta.focus()
                    const newCursor = wrap ? start + insert.length : start + insert.length
                    ta.setSelectionRange(newCursor, newCursor + sel.length)
                  }, 0)
                }}
                className="h-6 w-6 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors font-mono flex items-center justify-center"
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {preview ? (
          <div
            className="mt-4 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: content
                .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                .replace(/```[\s\S]*?```/g, (m) => `<pre class="bg-muted rounded-lg p-3 my-2 text-xs font-mono overflow-x-auto">${m.replace(/```/g, "").trim()}</pre>`)
                .replace(/^---$/gm, '<hr class="my-4 border-t border-muted">')
                .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-1">$1</h3>')
                .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-5 mb-2">$1</h2>')
                .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-2">$1</h1>')
                .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-muted-foreground/30 pl-3 my-1 text-muted-foreground italic">$1</blockquote>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>')
                .replace(/^- \[x\] (.+)$/gm, '<li class="ml-4 flex items-center gap-1.5 text-muted-foreground line-through"><span class="text-emerald-500">✓</span>$1</li>')
                .replace(/^- \[ \] (.+)$/gm, '<li class="ml-4 flex items-center gap-1.5"><span class="inline-block w-3.5 h-3.5 border border-current rounded-sm opacity-40"></span>$1</li>')
                .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
                .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
                .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
                .replace(/(https?:\/\/[^\s<>"]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
                .replace(/\n/g, '<br>')
            }}
          />
        ) : (
          <Textarea
            value={content}
            onChange={handleContentChange}
            placeholder="ここにメモを書く... (Markdownが使えます)"
            className="mt-4 border-none shadow-none px-0 resize-none min-h-[60vh] focus-visible:ring-0 text-sm leading-relaxed"
            rows={30}
          />
        )}

        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground flex items-center justify-between">
          <div>
            <p>最終更新: {formatDatetime(note.updatedAt)}</p>
            <p className="mt-0.5">作成: {formatDatetime(note.createdAt)}</p>
          </div>
          <div className="text-right space-y-0.5">
            <p>{content.length.toLocaleString()} 字</p>
            <p>{content.trim().split(/\s+/).filter(Boolean).length} 語</p>
          </div>
        </div>
      </div>
    </div>
  )
}
