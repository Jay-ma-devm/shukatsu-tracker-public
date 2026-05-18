"use client"

import { useState } from "react"
import { Check, Infinity, Sparkles, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PLANS } from "@/lib/plans"

const freePlanFeatures = [
  "企業10社まで登録",
  "ES管理・文字数カウント",
  "面接ログ",
  "ケース練習ログ",
  "カンバンボード",
  "スケジュール管理",
  "タスク管理",
]

const proPlanFeatures = [
  "企業数無制限",
  "AI面接対策・フィードバック",
  "AIによるES改善提案",
  "ES共有機能",
  "詳細統計・分析",
  "優先サポート",
  "全機能アンロック",
]

export default function PricingPage() {
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const handleUpgrade = async () => {
    setCheckoutLoading(true)
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
      })
      const data = await res.json()
      if (data.url && data.url !== "/pricing") {
        window.location.href = data.url
      } else {
        // Stripe未設定の場合
        alert("現在Proプランへのアップグレードは準備中です。今しばらくお待ちください。")
      }
    } catch {
      alert("エラーが発生しました。しばらくしてから再度お試しください。")
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* 戻るリンク */}
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        ダッシュボードに戻る
      </Link>

      {/* ヘッダー */}
      <div className="mb-12 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          料金プラン
        </div>
        <h1 className="text-3xl font-bold">シンプルな料金体系</h1>
        <p className="mt-3 text-muted-foreground">
          就活が終わるまで使い続けられる、リーズナブルな価格設定
        </p>
      </div>

      {/* プランカード */}
      <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
        {/* Free プラン */}
        <div className="rounded-2xl border bg-card p-8">
          <div className="mb-6">
            <p className="text-sm font-medium text-muted-foreground">Free</p>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-5xl font-bold">¥{PLANS.free.price.toLocaleString()}</span>
              <span className="mb-1 text-muted-foreground">/月</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">まずは無料で試してみる</p>
          </div>

          <ul className="mb-8 space-y-3">
            {freePlanFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm">
                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <Button variant="outline" className="w-full" onClick={() => window.location.href = "/"}>
            現在のプラン
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">クレジットカード不要</p>
        </div>

        {/* Pro プラン */}
        <div className="relative rounded-2xl border-2 border-emerald-500 bg-card p-8">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-white shadow">
              おすすめ
            </span>
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium text-muted-foreground">Pro</p>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-5xl font-bold">¥{PLANS.pro.price.toLocaleString()}</span>
              <span className="mb-1 text-muted-foreground">買い切り</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">一度の購入で永久利用</p>
          </div>

          <ul className="mb-8 space-y-3">
            {proPlanFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm">
                {f === "企業数無制限" ? (
                  <Infinity className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                )}
                {f === "AI面接対策・フィードバック" || f === "AIによるES改善提案" ? (
                  <span>
                    {f} <span className="text-xs text-emerald-500">NEW</span>
                  </span>
                ) : (
                  f
                )}
              </li>
            ))}
          </ul>

          <Button
            onClick={handleUpgrade}
            disabled={checkoutLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {checkoutLoading ? "処理中..." : "Proにアップグレード"}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">返金保証なし・永久利用</p>
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto mt-16 max-w-2xl">
        <h2 className="mb-6 text-center text-xl font-bold">よくある質問</h2>
        <div className="space-y-4">
          {[
            {
              q: "無料プランはいつまでも使えますか？",
              a: "はい、無料プランはずっと無料でご利用いただけます。企業10社まで登録でき、基本的な管理機能をすべてお使いいただけます。",
            },
            {
              q: "Proプランは買い切りとはどういう意味ですか？",
              a: "¥980の一度の支払いで、永久にProプランをご利用いただけます。月額課金ではありません。就活が終わっても継続して使い続けることができます。",
            },
            {
              q: "Proプランにアップグレードするとデータは引き継がれますか？",
              a: "はい、無料プランで登録したデータはそのまま引き継がれます。企業数10社の制限が解除され、すべての機能が使えるようになります。",
            },
            {
              q: "就活が終わったら退会できますか？",
              a: "もちろんです。設定ページからいつでもアカウントを削除できます。",
            },
          ].map((item) => (
            <div key={item.q} className="rounded-xl border bg-card p-5">
              <p className="font-semibold text-sm">{item.q}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
