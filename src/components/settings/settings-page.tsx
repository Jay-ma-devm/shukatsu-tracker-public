"use client"

import { useState, useRef, useEffect } from "react"
import { Download, Upload, Moon, Sun, Monitor, User, Calendar, Info, AlertTriangle, Star, Lock } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { LocalUser } from "@/types"

interface DataStats {
  companies: number; tasks: number; notes: number; cases: number
  interviews: number; meetings: number; templates: number; es: number
}

interface SettingsPageClientProps {
  user: { id: string; name?: string | null; email?: string | null; image?: string | null } | LocalUser
  dataStats?: DataStats
}

const DEFAULT_SIGNATURE = `〇〇大学〇〇学部 / 2028年3月卒業予定
Demo User
TEL: 090-XXXX-XXXX
Mail: demo@example.com`

export function SettingsPageClient({ user, dataStats }: SettingsPageClientProps) {
  const { theme, setTheme } = useTheme()
  const [isPro, setIsPro] = useState<boolean | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetch("/api/user/plan").then(r => r.ok ? r.json() : null).then(d => {
      if (d) setIsPro(d.isPro)
    }).catch(() => {})
  }, [])
  const [importing, setImporting] = useState(false)
  const [importPreview, setImportPreview] = useState<{ data: unknown; stats: Record<string, number> } | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const [signature, setSignature] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_SIGNATURE
    return localStorage.getItem("student-signature") ?? DEFAULT_SIGNATURE
  })
  const [editingSignature, setEditingSignature] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch("/api/export")
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `shukatsu-tracker-export-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("エクスポートしました")
    } catch {
      toast.error("エクスポートに失敗しました")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold">設定</h1>

      {/* プロフィール */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            プロフィール
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">名前</p>
            <p className="text-sm font-medium">{user.name ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">メール</p>
            <p className="text-sm font-medium">{user.email ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ユーザーID</p>
            <p className="text-xs font-mono text-muted-foreground">{user.id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">認証モード</p>
            <p className="text-sm font-medium">
              {process.env.NEXT_PUBLIC_AUTH_MODE === "auth" ? "Google OAuth" : "ローカルモード"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* プランステータス */}
      {process.env.NEXT_PUBLIC_AUTH_MODE === "auth" && (
        <Card className={isPro ? "border-amber-300 dark:border-amber-700" : ""}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              {isPro ? <Star className="h-4 w-4 text-amber-500 fill-amber-400" /> : <Lock className="h-4 w-4" />}
              プランと請求
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isPro ? (
              <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-700 dark:text-amber-400">⭐ Proプラン（買い切り）</p>
                  <p className="text-xs text-muted-foreground mt-0.5">企業数無制限・AI機能フル・永久利用</p>
                </div>
                <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-full font-medium">有効</span>
              </div>
            ) : isPro === false ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Freeプラン</p>
                    <p className="text-xs text-muted-foreground mt-0.5">企業10社まで・AI機能なし</p>
                  </div>
                </div>
                <div className="border rounded-xl p-4 space-y-3">
                  <p className="text-sm font-bold">🚀 Proにアップグレード ¥980（買い切り）</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>✓ 企業数無制限</li>
                    <li>✓ AI面接対策・ES改善</li>
                    <li>✓ 全機能アンロック</li>
                    <li>✓ 一度の購入で永久利用</li>
                  </ul>
                  <Link href="/pricing">
                    <button className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors">
                      Proにアップグレード →
                    </button>
                  </Link>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* テーマ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            テーマ
          </CardTitle>
          <CardDescription className="text-xs">アプリの表示テーマを選択します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("light")}
              className="gap-1.5"
            >
              <Sun className="h-3.5 w-3.5" />
              ライト
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("dark")}
              className="gap-1.5"
            >
              <Moon className="h-3.5 w-3.5" />
              ダーク
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("system")}
              className="gap-1.5"
            >
              <Monitor className="h-3.5 w-3.5" />
              システム
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* データ管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">データ管理</CardTitle>
          <CardDescription className="text-xs">エクスポート・インポート・カレンダー連携</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* JSONエクスポート */}
            <div className="p-3 border rounded-xl space-y-2">
              <p className="text-sm font-medium">JSONエクスポート</p>
              <p className="text-xs text-muted-foreground">全データをバックアップ</p>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="w-full gap-1.5">
                <Download className="h-3.5 w-3.5" />
                {exporting ? "処理中..." : "ダウンロード"}
              </Button>
            </div>

            {/* Markdownレポート */}
            <div className="p-3 border rounded-xl space-y-2">
              <p className="text-sm font-medium">就活レポート</p>
              <p className="text-xs text-muted-foreground">Markdown形式で全体サマリー</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5"
                onClick={async () => {
                  const res = await fetch("/api/export-md")
                  const blob = await res.blob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `shukatsu-report-${new Date().toISOString().split("T")[0]}.md`
                  a.click()
                  URL.revokeObjectURL(url)
                  toast.success("就活レポートをダウンロードしました")
                }}
              >
                <Download className="h-3.5 w-3.5" />
                レポート生成
              </Button>
            </div>

            {/* JSONインポート */}
            <div className="p-3 border rounded-xl space-y-2">
              <p className="text-sm font-medium">JSONインポート</p>
              <p className="text-xs text-muted-foreground">バックアップから復元</p>
              <input
                ref={importRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const text = await file.text()
                    const parsed = JSON.parse(text)
                    const data = parsed.data ?? parsed
                    const stats: Record<string, number> = {
                      companies: (data.companies as unknown[])?.length ?? 0,
                      tasks: (data.tasks as unknown[])?.length ?? 0,
                      notes: (data.notes as unknown[])?.length ?? 0,
                      cases: (data.cases as unknown[])?.length ?? 0,
                      interviews: (data.interviewLogs as unknown[])?.length ?? 0,
                      meetings: (data.meetings as unknown[])?.length ?? 0,
                    }
                    setImportPreview({ data, stats })
                  } catch {
                    toast.error("ファイルの読み込みに失敗しました")
                  } finally {
                    if (importRef.current) importRef.current.value = ""
                  }
                }}
              />
              {importPreview && (
                <div className="bg-muted/50 rounded-lg p-2 space-y-2">
                  <p className="text-xs font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    インポート内容の確認
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    {Object.entries(importPreview.stats).filter(([, v]) => v > 0).map(([k, v]) => (
                      <div key={k}>• {k}: {v}件</div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="default" size="sm" disabled={importing} className="flex-1 text-xs h-7"
                      onClick={async () => {
                        setImporting(true)
                        try {
                          const res = await fetch("/api/import", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ data: importPreview.data, mode: "merge" }),
                          })
                          const result = await res.json()
                          if (res.ok) {
                            toast.success(`インポート完了: 企業${result.stats.companies}社, ケース${result.stats.cases}件`)
                          } else {
                            toast.error("インポートに失敗しました")
                          }
                        } finally {
                          setImporting(false)
                          setImportPreview(null)
                        }
                      }}
                    >
                      {importing ? "処理中..." : "インポート実行"}
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setImportPreview(null)}>
                      キャンセル
                    </Button>
                  </div>
                </div>
              )}
              {!importPreview && (
                <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} disabled={importing} className="w-full gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  ファイルを選択
                </Button>
              )}
            </div>

            {/* 企業CSV インポート */}
            <div className="p-3 border rounded-xl space-y-2">
              <p className="text-sm font-medium">企業CSVインポート</p>
              <p className="text-xs text-muted-foreground">スプレッドシートから一括登録</p>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="csv-import"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const text = await file.text()
                  const lines = text.split("\n").filter((l) => l.trim())
                  if (lines.length < 2) { toast.error("データが見つかりません"); return }
                  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
                  const companies = lines.slice(1).map((line) => {
                    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
                    const obj: Record<string, string> = {}
                    headers.forEach((h, i) => { obj[h] = cells[i] ?? "" })
                    return {
                      name: obj["企業名"] || obj["name"] || "",
                      position: obj["職種"] || obj["position"] || undefined,
                      industry: obj["業界"] || obj["industry"] || undefined,
                      status: obj["ステータス"] || obj["status"] || "applied",
                      priority: parseInt(obj["優先度"] || obj["priority"] || "3") || 3,
                      url: obj["URL"] || obj["url"] || undefined,
                      notes: obj["備考"] || obj["notes"] || undefined,
                    }
                  }).filter((c) => c.name)
                  if (companies.length === 0) { toast.error("有効な企業データが見つかりません"); return }
                  const res = await fetch("/api/import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ data: { companies }, mode: "merge" }),
                  })
                  if (res.ok) {
                    const result = await res.json()
                    toast.success(`${result.stats?.companies ?? companies.length}社をインポートしました`)
                  } else {
                    toast.error("インポートに失敗しました")
                  }
                  e.target.value = ""
                }}
              />
              <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => document.getElementById("csv-import")?.click()}>
                <Upload className="h-3.5 w-3.5" />
                CSVを選択
              </Button>
              <p className="text-[10px] text-muted-foreground">列名: 企業名,職種,業界,ステータス,優先度,URL,備考</p>
            </div>

            {/* .icsエクスポート */}
            <div className="p-3 border rounded-xl space-y-2">
              <p className="text-sm font-medium">カレンダー連携</p>
              <p className="text-xs text-muted-foreground">Googleカレンダーに追加</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5"
                onClick={async () => {
                  const res = await fetch("/api/export-ics")
                  const blob = await res.blob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `shukatsu-${new Date().toISOString().split("T")[0]}.ics`
                  a.click()
                  URL.revokeObjectURL(url)
                  toast.success(".icsをダウンロードしました")
                }}
              >
                <Calendar className="h-3.5 w-3.5" />
                .ics ダウンロード
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-1">接続情報</p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>• DB: Turso (libsql)</p>
              <p>• 認証: {process.env.NEXT_PUBLIC_AUTH_MODE === "auth" ? "Google OAuth" : "ローカルモード"}</p>
              <p>• Node.js: {process.version ?? "不明"}</p>
            </div>
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/health")
                  const data = await res.json()
                  if (data.status === "ok") {
                    toast.success(`DB接続OK (レイテンシ: ${data.latencyMs}ms)`)
                  } else {
                    toast.error("DB接続エラー")
                  }
                } catch {
                  toast.error("接続テスト失敗")
                }
              }}
              className="text-[10px] text-primary hover:text-primary/80 underline mt-1 block"
            >
              接続テスト
            </button>
          </div>
        </CardContent>
      </Card>

      {/* キーボードショートカット */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            ⌨️ キーボードショートカット
          </CardTitle>
          <CardDescription className="text-xs">よく使うショートカットの一覧</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
            {[
              { keys: "⌘K", label: "コマンドパレット（検索）" },
              { keys: "?", label: "ショートカット一覧" },
              { keys: "⌘⇧H", label: "ダッシュボードへ" },
              { keys: "⌘⇧C", label: "企業一覧へ" },
              { keys: "⌘⇧T", label: "タスクへ" },
              { keys: "⌘⇧L", label: "カレンダーへ" },
              { keys: "⌘⇧I", label: "面接ログへ" },
              { keys: "⌘⇧S", label: "統計ページへ" },
              { keys: "⌘⇧N", label: "企業を追加" },
              { keys: "⌘⇧K", label: "ケース練習へ" },
              { keys: "⌘⇧M", label: "OB訪問へ" },
              { keys: "⌘S", label: "保存（ES・ノート）" },
              { keys: "⌘P", label: "プレビュー切替（ノート）" },
              { keys: "⌘B", label: "太字（ノートエディタ）" },
              { keys: "S", label: "スター切替（企業詳細）" },
              { keys: "E", label: "編集モード（企業詳細）" },
              { keys: "1-5 / n,t,i", label: "タブ切替（企業詳細）" },
              { keys: "→/←", label: "前後の質問（面接練習）" },
              { keys: "Space", label: "回答表示（面接練習）" },
            ].map(({ keys, label }) => (
              <div key={keys} className="flex items-center justify-between py-1 border-b border-muted/50 last:border-0">
                <span className="text-muted-foreground">{label}</span>
                <kbd className="text-[10px] font-mono bg-muted border px-1.5 py-0.5 rounded">{keys}</kbd>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 署名テンプレート情報 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">学生署名</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditingSignature(!editingSignature)} className="text-xs h-6">
              {editingSignature ? "完了" : "編集"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {editingSignature ? (
            <Textarea
              value={signature}
              onChange={(e) => {
                setSignature(e.target.value)
                localStorage.setItem("student-signature", e.target.value)
              }}
              className="text-xs font-mono resize-none"
              rows={5}
            />
          ) : (
            <pre className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg leading-relaxed">
              {signature}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* データ統計 */}
      {dataStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">データ統計</CardTitle>
            <CardDescription className="text-xs">現在保存されているデータ数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "企業", value: dataStats.companies, href: "/companies" },
                { label: "タスク", value: dataStats.tasks, href: "/tasks" },
                { label: "ノート", value: dataStats.notes, href: "/notes" },
                { label: "ケース", value: dataStats.cases, href: "/cases" },
                { label: "面接ログ", value: dataStats.interviews, href: "/interviews" },
                { label: "OB訪問", value: dataStats.meetings, href: "/meetings" },
                { label: "ES", value: dataStats.es, href: "/entry-sheets" },
                { label: "テンプレート", value: dataStats.templates, href: "/templates" },
              ].map(({ label, value, href }) => (
                <a key={label} href={href} className="text-center p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors block">
                  <p className="text-lg font-bold text-primary">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* バージョン情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            バージョン情報
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground space-y-1.5">
            <div className="flex justify-between">
              <span>アプリバージョン</span>
              <span className="font-mono font-medium text-foreground">v2.5.0</span>
            </div>
            <div className="flex justify-between">
              <span>フレームワーク</span>
              <span className="font-mono">Next.js 16 (App Router)</span>
            </div>
            <div className="flex justify-between">
              <span>データベース</span>
              <span className="font-mono">Turso (libSQL)</span>
            </div>
            <div className="flex justify-between">
              <span>ORM</span>
              <span className="font-mono">Prisma 7</span>
            </div>
            <div className="flex justify-between">
              <span>ビルド日時</span>
              <span className="font-mono">{new Date().toLocaleDateString("ja-JP")}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-medium mb-2">v2.5.0 Gmail/Calendar連携・internshipステータス追加</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>📧 Gmail・Googleカレンダー連携で57社のデータを自動インポート</li>
              <li>🎯 「インターン参加」ステータスを新設（シアン色で管理）</li>
              <li>🔥 「最終選考」バナーをダッシュボードに追加（Pivot Studio・Sora Health）</li>
              <li>📅 /today ページ新設（今日やること・面接直前チェックリスト）</li>
              <li>🧠 タスクカンバンビュー・ポモドーロタイマー追加</li>
              <li>🤖 AI最終面接対策・インターン戦略AIを企業詳細に追加</li>
              <li>📋 ES管理バッジをサイドバーに追加（今週締切件数）</li>
              <li>📊 企業一覧に「最終選考」「インターン」クイックフィルター追加</li>
            </ul>
            <p className="text-xs font-medium mb-2 mt-3">v2.1.0 商用品質強化アップデート</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>🏷️ グリッドカードにホバー時クイックアクション（スター・ステータス変更）</li>
              <li>🔍 面接質問アーカイブにキーワード検索・ハイライト・コピーボタン</li>
              <li>🔔 通知ベルにOB訪問お礼メール未送信通知追加</li>
              <li>🔑 企業詳細にタブ切替キーボードショートカット（1-5, n, t, i）</li>
              <li>⚠️ 企業詳細ページに停滞警告バナー（7日以上更新なし）</li>
              <li>✨ AI志望動機ドラフト生成機能（企業詳細ノートタブ）</li>
              <li>✉️ AI辞退メール生成機能（内定企業の次のアクション）</li>
              <li>⏱️ 面接準備セクションに残り時間カウントダウン表示</li>
              <li>📊 カンバンヘッダーに面接中企業数・スター数サマリー</li>
              <li>🛡️ ErrorBoundaryコンポーネントでクラッシュ対策強化</li>
            </ul>
            <p className="text-xs font-medium mb-2 mt-3">v2.0.0 商用品質フルリリース</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>🏥 就活ヘルススコア（5項目100点満点・グレード評価）</li>
              <li>🏆 就活マイルストーン達成バッジ</li>
              <li>📝 ノートタブにテンプレートクイック作成</li>
              <li>📊 ES詳細に締切カウントダウンとプログレスバー</li>
              <li>🧠 ケースページに面接中企業バナー・AI練習問題生成</li>
              <li>📚 ケースフレームワーク参照ライブラリ（6種類）</li>
              <li>🔔 通知ベルに面接通知・サイドバーに面接中企業数バッジ</li>
              <li>📱 ノートページモバイル対応・停滞フィルター</li>
              <li>🔗 ES回答相互参照・OB訪問後ノート自動提案</li>
              <li>✉️ お礼メールに署名付与・メーラー起動</li>
              <li>💡 MarkdownレポートエクスポートAPI</li>
            </ul>
            <p className="text-xs font-medium mb-2 mt-3">v1.8.0 最終品質アップデート</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>🔔 通知センター（トップバーのベルアイコン）</li>
              <li>📊 統計ページに選考コンバージョンファネル・AI分析・ケース評価推移</li>
              <li>🎯 企業詳細に面接準備度スコア・選考フロービジュアル</li>
              <li>📅 今日の面接がある場合の準備チェックリスト</li>
              <li>🏢 企業一覧にグリッドカードビュー・直近予定フィルター</li>
              <li>⌨️ 面接練習モードにキーボードショートカット</li>
              <li>🔢 企業詳細の前後ナビゲーション（N/M社表示）</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
