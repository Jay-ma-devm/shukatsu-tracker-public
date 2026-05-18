import { toast } from "sonner"

/**
 * AI要約APIを呼び出す共通関数
 * 403（プラン制限）の場合はアップグレードプロンプトを表示
 */
export async function callAI(type: string, text: string): Promise<string | null> {
  const res = await fetch("/api/ai/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, text }),
  })

  if (res.ok) {
    const data = await res.json()
    return data.summary as string
  }

  if (res.status === 403) {
    toast.error("AI機能はProプランのみ利用可能です", {
      description: "¥980の買い切りでAI機能が永久に使えます",
      action: {
        label: "⭐ Proを見る",
        onClick: () => { window.location.href = "/pricing" },
      },
      duration: 6000,
    })
    return null
  }

  if (res.status === 503) {
    toast.error("AI APIキーが設定されていません")
    return null
  }

  toast.error("AIの生成に失敗しました")
  return null
}
