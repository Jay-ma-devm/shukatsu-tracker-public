"use client"

import { useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Plus, Copy, Check, Pencil, Trash2, Mail, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { TemplateFormModal } from "./template-form-modal"
import { EMAIL_CATEGORIES } from "@/lib/constants"
import type { EmailTemplate } from "@/types"
import { cn } from "@/lib/utils"

interface TemplatesPageClientProps {
  initialTemplates: EmailTemplate[]
}

function HighlightedText({ text, lineClamp }: { text: string; lineClamp?: boolean }) {
  const parts = text.split(/({{[^}]+}})/)
  return (
    <span className={lineClamp ? "line-clamp-3" : undefined}>
      {parts.map((part, i) =>
        /^{{.+}}$/.test(part) ? (
          <mark key={i} className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded px-0.5 not-italic font-medium">
            {part}
          </mark>
        ) : part
      )}
    </span>
  )
}

export function TemplatesPageClient({ initialTemplates }: TemplatesPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [templates, setTemplates] = useState(initialTemplates)
  const [showCreate, setShowCreate] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [fillTemplate, setFillTemplate] = useState<{ template: EmailTemplate; vars: string[]; values: Record<string, string> } | null>(null)
  const [search, setSearch] = useState(searchParams.get("q") ?? "")
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") ?? "all")
  const [sort, setSort] = useState<"usage" | "name" | "newest">((searchParams.get("sort") as "usage" | "name" | "newest") ?? "usage")

  const updateUrl = (params: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== "all" && v !== "" && v !== "usage") p.set(k, v)
      else p.delete(k)
    })
    router.replace(`/templates?${p.toString()}`, { scroll: false })
  }

  const filtered = useMemo(() => {
    const f = templates.filter((t) => {
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q)
      }
      return true
    })
    if (sort === "usage") return [...f].sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0))
    if (sort === "name") return [...f].sort((a, b) => a.name.localeCompare(b.name, "ja"))
    return f // newest: server order
  }, [templates, search, categoryFilter, sort])

  const doActualCopy = async (template: EmailTemplate, values: Record<string, string> = {}) => {
    let subject = template.subject
    let body = template.body
    Object.entries(values).forEach(([k, v]) => {
      if (v) {
        subject = subject.replace(new RegExp(`{{${k}}}`, "g"), v)
        body = body.replace(new RegExp(`{{${k}}}`, "g"), v)
      }
    })
    const text = `件名: ${subject}\n\n${body}`
    await navigator.clipboard.writeText(text)
    setCopiedId(template.id)
    setTimeout(() => setCopiedId(null), 2000)
    await fetch(`/api/templates/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usageCount: template.usageCount + 1 }),
    })
    setTemplates((prev) =>
      prev.map((t) => t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t)
    )
    toast.success("クリップボードにコピーしました")
  }

  const handleCopy = async (template: EmailTemplate) => {
    const allText = template.subject + "\n" + template.body
    const matches = [...allText.matchAll(/{{([^}]+)}}/g)]
    const uniqueVars = [...new Set(matches.map((m) => m[1]))]
    if (uniqueVars.length > 0) {
      setFillTemplate({ template, vars: uniqueVars, values: Object.fromEntries(uniqueVars.map((v) => [v, ""])) })
    } else {
      await doActualCopy(template)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    const res = await fetch(`/api/templates/${deletingId}`, { method: "DELETE" })
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== deletingId))
      toast.success("テンプレートを削除しました")
    }
    setDeletingId(null)
  }

  const previewTemplate = templates.find((t) => t.id === previewId)

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">メールテンプレート</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{templates.length}件</span>
            {templates.reduce((s, t) => s + t.usageCount, 0) > 0 && (
              <span>合計使用 {templates.reduce((s, t) => s + t.usageCount, 0)}回</span>
            )}
            <span>プレースホルダ: <code className="bg-muted px-1 rounded">{"{{担当者名}}"}</code>{" "}
            <code className="bg-muted px-1 rounded">{"{{会社名}}"}</code></span>
          </div>
        </div>
        <AiTemplateButton onSuccess={(t) => setTemplates((prev) => [t, ...prev])} />
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" />
          テンプレート追加
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="テンプレート名・件名で検索..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); updateUrl({ q: e.target.value }) }}
          className="h-8 w-52 text-sm"
        />
        <Select value={categoryFilter} onValueChange={(v: string | null) => { const val = v ?? "all"; setCategoryFilter(val); updateUrl({ category: val }) }}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="カテゴリ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {EMAIL_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v: string | null) => { const val = (v ?? "usage") as typeof sort; setSort(val); updateUrl({ sort: val }) }}>
          <SelectTrigger className="h-8 w-28 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="usage">使用回数順</SelectItem>
            <SelectItem value="name">名前順</SelectItem>
            <SelectItem value="newest">新しい順</SelectItem>
          </SelectContent>
        </Select>
        {(search || categoryFilter !== "all" || sort !== "usage") && (
          <button
            onClick={() => { setSearch(""); setCategoryFilter("all"); setSort("usage"); router.replace("/templates", { scroll: false }) }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕ リセット
          </button>
        )}
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <Mail className="h-10 w-10 text-muted-foreground mx-auto" />
          <div>
            <p className="font-medium">メールテンプレートがありません</p>
            <p className="text-sm text-muted-foreground mt-1">よく使うメールのテンプレートを登録しましょう</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="default" size="sm" onClick={() => setShowCreate(true)}>テンプレートを追加</Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const samples = [
                  { name: "面接後お礼メール", category: "お礼", subject: "本日の面接のお礼【{{大学名}} {{氏名}}】", body: "{{担当者名}} 様\n\nお世話になっております。\n本日はお忙しい中、面接のお時間をいただきありがとうございました。\n\n貴社の{{部署名}}への理解が深まり、より一層志望意欲が高まりました。\n\n引き続きどうぞよろしくお願いいたします。\n\n{{署名}}" },
                  { name: "OB訪問お礼メール", category: "お礼", subject: "本日のOB訪問のお礼【{{大学名}} {{氏名}}】", body: "{{担当者名}} 様\n\nお世話になっております。\n本日はお忙しい中、貴重なお時間をいただきありがとうございました。\n\n{{担当者名}}様のお話を聞いて、貴社への理解と志望度がさらに高まりました。\n\n引き続きよろしくお願いいたします。\n\n{{署名}}" },
                  { name: "選考辞退メール", category: "辞退", subject: "選考辞退のご連絡【{{大学名}} {{氏名}}】", body: "{{担当者名}} 様\n\nお世話になっております。\n\nこの度は選考を進めていただきありがとうございました。\n誠に恐れ入りますが、今回の選考を辞退させていただきたく、ご連絡申し上げます。\n\n貴重なお時間をいただきながら大変申し訳ございませんが、何卒ご了承いただけますと幸いです。\n\n{{署名}}" },
                ]
                for (const s of samples) {
                  await fetch("/api/templates", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(s),
                  }).then((r) => r.ok ? r.json() : null).then((t) => {
                    if (t) setTemplates((prev) => [...prev, t])
                  })
                }
                toast.success("3件のサンプルテンプレートを追加しました")
              }}
            >
              サンプルを追加
            </Button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">該当するテンプレートがありません</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((template) => (
            <Card key={template.id} className={cn("cursor-pointer hover:shadow-md transition-shadow", previewId === template.id && "ring-2 ring-primary")}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{template.name}</p>
                      {template.category && (
                        <Badge variant="outline" className="text-[10px] shrink-0">{template.category}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      件名: {template.subject}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`https://mail.google.com/mail/?view=cm&su=${encodeURIComponent(template.subject)}&body=${encodeURIComponent(template.body)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      title="Gmailで作成"
                      onClick={() => handleCopy(template)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopy(template)}
                      title="コピー"
                    >
                      {copiedId === template.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditingTemplate(template)}
                      title="編集"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeletingId(template.id)}
                      className="text-destructive hover:text-destructive"
                      title="削除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <button
                  className="w-full text-left"
                  onClick={() => setPreviewId(previewId === template.id ? null : template.id)}
                >
                  <p className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <HighlightedText text={template.body} lineClamp />
                  </p>
                </button>
                {template.usageCount > 0 && (
                  <p className="text-[10px] text-muted-foreground/50 mt-2">使用回数: {template.usageCount}</p>
                )}
              </CardContent>

              {previewId === template.id && (
                <div className="mx-4 mb-4 p-3 bg-muted/50 rounded-lg border">
                  <p className="text-xs font-medium mb-2">件名: <HighlightedText text={template.subject} /></p>
                  <pre className="text-xs whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    <HighlightedText text={template.body} />
                  </pre>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {(showCreate || editingTemplate) && (
        <TemplateFormModal
          open={showCreate || !!editingTemplate}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreate(false)
              setEditingTemplate(null)
            }
          }}
          template={editingTemplate ?? undefined}
          onSuccess={(result) => {
            if (editingTemplate) {
              setTemplates((prev) => prev.map((t) => t.id === result.id ? result : t))
            } else {
              setTemplates((prev) => [result, ...prev])
            }
            setShowCreate(false)
            setEditingTemplate(null)
          }}
        />
      )}

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="テンプレートを削除しますか？"
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleDelete}
      />

      {/* 変数入力ダイアログ */}
      {fillTemplate && (
        <Dialog open={!!fillTemplate} onOpenChange={(open) => !open && setFillTemplate(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm">テンプレートの変数を入力</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {fillTemplate.vars.map((varName) => (
                <div key={varName} className="space-y-1">
                  <Label className="text-xs">{`{{${varName}}}`}</Label>
                  <Input
                    value={fillTemplate.values[varName] ?? ""}
                    onChange={(e) => setFillTemplate((prev) => prev ? {
                      ...prev,
                      values: { ...prev.values, [varName]: e.target.value },
                    } : null)}
                    placeholder={varName}
                    className="h-8 text-sm"
                    autoFocus={fillTemplate.vars[0] === varName}
                  />
                </div>
              ))}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" size="sm" onClick={() => setFillTemplate(null)}>キャンセル</Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!fillTemplate) return
                  let subject = fillTemplate.template.subject
                  let body = fillTemplate.template.body
                  Object.entries(fillTemplate.values).forEach(([k, v]) => {
                    if (v) {
                      subject = subject.replace(new RegExp(`{{${k}}}`, "g"), v)
                      body = body.replace(new RegExp(`{{${k}}}`, "g"), v)
                    }
                  })
                  window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank")
                }}
              >
                📧 メーラーで開く
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  if (!fillTemplate) return
                  await doActualCopy(fillTemplate.template, fillTemplate.values)
                  setFillTemplate(null)
                }}
              >
                コピー
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function AiTemplateButton({ onSuccess }: { onSuccess: (t: import("@/types").EmailTemplate) => void }) {
  const [loading, setLoading] = useState(false)
  const types = [
    "面接後のお礼メール",
    "OB訪問後のお礼メール",
    "選考辞退メール",
    "面接日程確認メール",
    "内定承諾メール",
  ]

  const handleGenerate = async (typeName: string) => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `種別: ${typeName}\n用途: 就活生が企業に送るビジネスメール`, type: "email_template" }),
      })
      if (!res.ok) return
      const { summary } = await res.json()
      // テンプレートを保存
      const saveRes = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: typeName,
          category: typeName.includes("お礼") ? "お礼" : typeName.includes("辞退") ? "辞退" : "その他",
          subject: `${typeName.replace("メール", "")}のご連絡`,
          body: summary,
        }),
      })
      if (saveRes.ok) {
        const template = await saveRes.json()
        onSuccess(template)
        toast.success(`「${typeName}」テンプレートを生成しました`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <select
        disabled={loading}
        onChange={(e) => { if (e.target.value) { handleGenerate(e.target.value); e.target.value = "" } }}
        className="h-8 text-sm px-2 border rounded-lg bg-background text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-50"
        defaultValue=""
      >
        <option value="" disabled>{loading ? "⏳ 生成中..." : "✨ AI生成"}</option>
        {types.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
  )
}
