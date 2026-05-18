"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  FileText,
  MessageSquare,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type StyleType = "consulting" | "enterprise" | "startup" | "mixed"

interface StyleOption {
  id: StyleType
  label: string
  desc: string
  emoji: string
}

const styleOptions: StyleOption[] = [
  {
    id: "consulting",
    label: "外資コンサル志望",
    desc: "MBB・外資系コンサルを中心に受ける",
    emoji: "💼",
  },
  {
    id: "enterprise",
    label: "日系大手志望",
    desc: "総合商社・メガバンク・大手メーカーなど",
    emoji: "🏢",
  },
  {
    id: "startup",
    label: "IT・スタートアップ志望",
    desc: "テックカンパニー・成長スタートアップ中心",
    emoji: "🚀",
  },
  {
    id: "mixed",
    label: "混合（幅広く）",
    desc: "業界を問わず幅広く選考を受ける",
    emoji: "🌐",
  },
]

// スタイルに応じたサンプル企業
const sampleCompaniesByStyle: Record<StyleType, { name: string; industry: string; position: string }[]> = {
  consulting: [
    { name: "McKinsey & Company", industry: "Consulting", position: "ビジネスアナリスト" },
    { name: "BCG", industry: "Consulting", position: "アソシエイト" },
    { name: "Bain & Company", industry: "Consulting", position: "アソシエイトコンサルタント" },
  ],
  enterprise: [
    { name: "三菱商事", industry: "総合商社", position: "総合職" },
    { name: "三井物産", industry: "総合商社", position: "総合職" },
    { name: "みずほフィナンシャルグループ", industry: "金融", position: "総合職" },
  ],
  startup: [
    { name: "メルカリ", industry: "EC/テック", position: "ビジネス職" },
    { name: "Sora Health", industry: "HR-tech/SaaS", position: "BizDev" },
    { name: "Sansan", industry: "SaaS", position: "営業・マーケティング" },
  ],
  mixed: [
    { name: "リクルート", industry: "HR/メディア", position: "総合職" },
    { name: "ソフトバンク", industry: "通信/テック", position: "総合職" },
    { name: "Verdant Foods", industry: "IT/ゲーム", position: "ビジネス職" },
  ],
}

interface OnboardingWizardProps {
  onComplete: () => void
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedStyle, setSelectedStyle] = useState<StyleType | null>(null)
  const [companyName, setCompanyName] = useState("")
  const [companyStatus, setCompanyStatus] = useState("applied")
  const [adding, setAdding] = useState(false)
  const [loadingSample, setLoadingSample] = useState(false)

  // Step 3: 企業登録
  const handleAddCompany = async () => {
    if (!companyName.trim()) return
    setAdding(true)
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName.trim(),
          status: companyStatus,
          priority: 3,
        }),
      })
      if (res.ok) {
        setStep(4)
      } else {
        toast.error("企業の登録に失敗しました")
      }
    } catch {
      toast.error("エラーが発生しました")
    } finally {
      setAdding(false)
    }
  }

  // サンプルデータを登録
  const handleLoadSample = async () => {
    if (!selectedStyle) return
    setLoadingSample(true)
    const samples = sampleCompaniesByStyle[selectedStyle]
    try {
      await Promise.all(
        samples.map((s) =>
          fetch("/api/companies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: s.name,
              industry: s.industry,
              position: s.position,
              status: "applied",
              priority: 3,
            }),
          })
        )
      )
      toast.success("サンプルデータを追加しました！")
      setStep(4)
    } catch {
      toast.error("サンプルデータの追加に失敗しました")
    } finally {
      setLoadingSample(false)
    }
  }

  const handleComplete = () => {
    onComplete()
    router.refresh()
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* プログレスバー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  s === step
                    ? "bg-emerald-500 text-white"
                    : s < step
                    ? "bg-emerald-500/20 text-emerald-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
            ))}
          </div>
          <div className="relative h-1.5 rounded-full bg-muted">
            <div
              className="absolute h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: ようこそ */}
        {step === 1 && (
          <div className="text-center">
            <div className="mb-6 inline-flex rounded-full bg-emerald-500/10 p-4">
              <Sparkles className="h-10 w-10 text-emerald-500" />
            </div>
            <h2 className="mb-3 text-2xl font-bold">就活トラッカーへようこそ！</h2>
            <p className="mb-8 text-muted-foreground">
              外資・コンサル就活に特化した管理ツールです。
              <br />
              まず使い方を簡単にご案内します。
            </p>
            <div className="mb-8 grid gap-4 text-left sm:grid-cols-3">
              <div className="rounded-xl border bg-card p-4">
                <Building2 className="mb-2 h-6 w-6 text-emerald-500" />
                <h3 className="mb-1 font-semibold text-sm">企業管理</h3>
                <p className="text-xs text-muted-foreground">受ける企業を登録して選考フェーズを追跡</p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <FileText className="mb-2 h-6 w-6 text-emerald-500" />
                <h3 className="mb-1 font-semibold text-sm">ES管理</h3>
                <p className="text-xs text-muted-foreground">設問ごとに文字数カウントしながら回答を記録</p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <MessageSquare className="mb-2 h-6 w-6 text-emerald-500" />
                <h3 className="mb-1 font-semibold text-sm">面接ログ</h3>
                <p className="text-xs text-muted-foreground">面接の質問・回答・フィードバックを蓄積</p>
              </div>
            </div>
            <Button
              onClick={() => setStep(2)}
              className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
              size="lg"
            >
              始める <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: 就活スタイル選択 */}
        {step === 2 && (
          <div>
            <h2 className="mb-2 text-2xl font-bold text-center">あなたの就活スタイルは？</h2>
            <p className="mb-6 text-center text-muted-foreground text-sm">
              スタイルに合わせたサンプルデータを用意します
            </p>
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              {styleOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedStyle(opt.id)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    selectedStyle === opt.id
                      ? "border-emerald-500 bg-emerald-500/5"
                      : "border-transparent bg-card hover:border-muted-foreground/20"
                  }`}
                >
                  <div className="mb-1 text-2xl">{opt.emoji}</div>
                  <div className="font-semibold text-sm">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                戻る
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedStyle}
                className="flex-1 gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                次へ <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: 最初の企業を登録 */}
        {step === 3 && (
          <div>
            <h2 className="mb-2 text-2xl font-bold text-center">最初の企業を登録しよう</h2>
            <p className="mb-6 text-center text-muted-foreground text-sm">
              受けたい企業を追加するか、サンプルデータで試してみましょう
            </p>
            <div className="mb-6 rounded-xl border bg-card p-5">
              <div className="mb-4 space-y-3">
                <div>
                  <Label htmlFor="company-name">企業名</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="例：McKinsey & Company"
                    className="mt-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && companyName.trim()) {
                        handleAddCompany()
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="company-status">現在のステータス</Label>
                  <select
                    id="company-status"
                    value={companyStatus}
                    onChange={(e) => setCompanyStatus(e.target.value)}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="applied">エントリー済み</option>
                    <option value="screening">書類選考中</option>
                    <option value="interview">面接中</option>
                    <option value="case">ケース面接</option>
                    <option value="final">最終面接</option>
                    <option value="offer">内定</option>
                  </select>
                </div>
              </div>
              <Button
                onClick={handleAddCompany}
                disabled={!companyName.trim() || adding}
                className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {adding && <Loader2 className="h-4 w-4 animate-spin" />}
                企業を登録する
              </Button>
            </div>
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs text-muted-foreground">
                <span className="bg-background px-2">または</span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLoadSample}
              disabled={loadingSample}
              className="w-full"
            >
              {loadingSample && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              サンプルデータで試してみる
            </Button>
            <Button variant="ghost" onClick={() => setStep(2)} className="mt-2 w-full text-sm">
              戻る
            </Button>
          </div>
        )}

        {/* Step 4: 完了 */}
        {step === 4 && (
          <div className="text-center">
            <div className="mb-6 inline-flex rounded-full bg-emerald-500/10 p-4">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
            </div>
            <h2 className="mb-3 text-2xl font-bold">準備完了！</h2>
            <p className="mb-8 text-muted-foreground">
              就活トラッカーの準備が整いました。
              <br />
              ダッシュボードから就活管理を始めましょう。
            </p>
            <div className="mb-6 rounded-xl border bg-card p-4 text-left text-sm">
              <p className="font-semibold mb-2">次にやること：</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  受ける企業を追加する（企業一覧 → ＋追加）
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  ESの設問を登録して文字数を管理する
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  面接・締切をカレンダーに登録する
                </li>
              </ul>
            </div>
            <Button
              onClick={handleComplete}
              className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
              size="lg"
            >
              ダッシュボードへ <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
