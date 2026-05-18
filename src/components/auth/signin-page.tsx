"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import {
  GraduationCap,
  CheckCircle,
  Sparkles,
  FileText,
  MessageSquare,
  Brain,
  LayoutGrid,
  Calendar,
  TrendingUp,
  ArrowRight,
  Check,
  Infinity,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// Google ロゴ SVG
function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

const features = [
  {
    icon: FileText,
    title: "ES管理・文字数カウント",
    desc: "設問ごとに文字数制限を設定。リアルタイムでカウントしながら回答を記録。",
  },
  {
    icon: MessageSquare,
    title: "面接ログ",
    desc: "質問・回答・フィードバックを記録。次の面接に向けた振り返りに活用。",
  },
  {
    icon: Brain,
    title: "ケース練習",
    desc: "ケース面接の構造・分析・結論をフォーマットに沿って記録・蓄積。",
  },
  {
    icon: LayoutGrid,
    title: "カンバン管理",
    desc: "選考フェーズをビジュアルで管理。ドラッグ＆ドロップでステータス更新。",
  },
  {
    icon: Sparkles,
    title: "AI面接対策",
    desc: "AIが回答の改善点をフィードバック。本番前の練習に最適。（Pro）",
  },
  {
    icon: Calendar,
    title: "カレンダー統合",
    desc: "説明会・面接・締切を一元管理。見落としゼロのスケジュール管理。",
  },
]

const freePlanFeatures = [
  "企業10社まで登録",
  "ES管理・文字数カウント",
  "面接ログ",
  "カンバンボード",
  "基本スケジュール管理",
]

const proPlanFeatures = [
  "企業数無制限",
  "AI面接対策・フィードバック",
  "AIによるES改善提案",
  "ES共有機能",
  "優先サポート",
  "全機能アンロック",
]

export function SignInPageClient() {
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    await signIn("google", { callbackUrl: "/" })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ナビバー */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-emerald-500" />
            <span className="font-bold text-lg">就活トラッカー</span>
          </div>
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            size="sm"
            className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <GoogleIcon />
            {loading ? "サインイン中..." : "無料で始める"}
          </Button>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          外資・コンサル志望者向け就活SaaS
        </div>
        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          外資・コンサル就活を、
          <br />
          <span className="text-emerald-500">一画面で管理する</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
          ES管理、面接ログ、ケース練習、スケジュール管理を統合。
          <br className="hidden sm:block" />
          MBB・外資コンサル志望者のための就活SaaS。
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            size="lg"
            className="w-full gap-3 bg-emerald-500 hover:bg-emerald-600 text-white sm:w-auto px-8 py-6 text-base"
          >
            <GoogleIcon />
            {loading ? "サインイン中..." : "Googleで無料登録"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
          <p className="text-sm text-muted-foreground">クレジットカード不要・無料プランあり</p>
        </div>
        <div className="mt-10 flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            無料プランあり
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            30秒で登録完了
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            いつでも解約可能
          </div>
        </div>
      </section>

      {/* 機能ハイライト */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold">就活に必要な機能がすべて揃う</h2>
            <p className="mt-3 text-muted-foreground">
              バラバラだったツールを一つにまとめ、選考に集中できる環境を提供します
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="rounded-xl border bg-background p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-emerald-500/10 p-2.5">
                    <Icon className="h-5 w-5 text-emerald-500" />
                  </div>
                  <h3 className="mb-2 font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 選考フロー可視化 */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">選考フローを一目で把握</h2>
          <p className="mb-12 text-muted-foreground">
            書類・ES・一次・二次・最終・内定まで、全フェーズをトラッキング
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            {["書類選考", "ES", "一次面接", "ケース面接", "最終面接", "内定"].map((stage, i) => (
              <div key={stage} className="flex items-center gap-3">
                <div className="rounded-full border-2 border-emerald-500 bg-emerald-500/10 px-4 py-2 font-medium text-emerald-600 dark:text-emerald-400">
                  {stage}
                </div>
                {i < 5 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 料金プラン */}
      <section id="pricing" className="bg-muted/30 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold">シンプルな料金プラン</h2>
            <p className="mt-3 text-muted-foreground">就活が終わるまで使い続けられる、手頃な価格設定</p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
            {/* Free プラン */}
            <div className="rounded-xl border bg-background p-8">
              <div className="mb-6">
                <p className="text-sm font-medium text-muted-foreground">Free</p>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-bold">¥0</span>
                  <span className="mb-1 text-muted-foreground">/月</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">企業10社まで無料</p>
              </div>
              <ul className="mb-8 space-y-3">
                {freePlanFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                無料で始める
              </Button>
            </div>

            {/* Pro プラン */}
            <div className="relative rounded-xl border-2 border-emerald-500 bg-background p-8">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white">
                  おすすめ
                </span>
              </div>
              <div className="mb-6">
                <p className="text-sm font-medium text-muted-foreground">Pro</p>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-bold">¥980</span>
                  <span className="mb-1 text-muted-foreground">買い切り</span>
                </div>
                <p className="mt-2 text-sm text-emerald-600 font-medium">一度の購入で永久利用 🎉</p>
              </div>
              <ul className="mb-8 space-y-3">
                {proPlanFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    {f === "企業数無制限" ? (
                      <Infinity className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    )}
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <GoogleIcon />
                {loading ? "サインイン中..." : "Proプランで始める"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <TrendingUp className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
          <h2 className="mb-4 text-3xl font-bold">
            今すぐ就活管理を
            <br />
            <span className="text-emerald-500">一元化しよう</span>
          </h2>
          <p className="mb-8 text-muted-foreground">
            Notionやスプレッドシートでの管理はもう終わり。
            <br />
            就活に特化したツールで、選考突破に集中できる環境を。
          </p>
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            size="lg"
            className="gap-3 bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-6 text-base"
          >
            <GoogleIcon />
            {loading ? "サインイン中..." : "Googleで無料登録"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
          <div className="mb-2 flex items-center justify-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="font-medium">就活トラッカー</span>
          </div>
          <p>外資・コンサル志望者のための就活管理SaaS</p>
        </div>
      </footer>
    </div>
  )
}
