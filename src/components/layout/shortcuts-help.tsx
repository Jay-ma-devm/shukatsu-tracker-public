"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const SHORTCUTS = [
  { category: "ナビゲーション", items: [
    { keys: ["⌘", "⇧", "H"], label: "ホーム" },
    { keys: ["⌘", "⇧", "C"], label: "企業一覧" },
    { keys: ["⌘", "⇧", "T"], label: "タスク" },
    { keys: ["⌘", "⇧", "L"], label: "カレンダー" },
    { keys: ["⌘", "⇧", "N"], label: "ノート作成" },
    { keys: ["⌘", "⇧", "I"], label: "面接ログ記録" },
    { keys: ["⌘", "⇧", "E"], label: "エントリーシート" },
    { keys: ["⌘", "⇧", "M"], label: "OB訪問" },
    { keys: ["⌘", "⇧", "K"], label: "ケース練習" },
    { keys: ["⌘", "⇧", "S"], label: "就活統計" },
  ]},
  { category: "グローバル", items: [
    { keys: ["⌘", "K"], label: "コマンドパレット (検索)" },
    { keys: ["?"], label: "ショートカット一覧" },
    { keys: ["Esc"], label: "モーダルを閉じる" },
  ]},
  { category: "ノートエディタ", items: [
    { keys: ["⌘", "S"], label: "保存" },
    { keys: ["⌘", "P"], label: "プレビュー切替" },
    { keys: ["⌘", "B"], label: "太字" },
    { keys: ["⌘", "I"], label: "斜体" },
  ]},
]

interface ShortcutsHelpProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShortcutsHelp({ open, onOpenChange }: ShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">キーボードショートカット</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {SHORTCUTS.map((section) => (
            <div key={section.category}>
              <p className="text-xs font-medium text-muted-foreground mb-2">{section.category}</p>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm">{item.label}</span>
                    <div className="flex items-center gap-0.5">
                      {item.keys.map((key) => (
                        <kbd
                          key={key}
                          className="inline-flex items-center justify-center h-5 min-w-5 px-1 text-[10px] font-mono font-medium bg-muted border border-border rounded shadow-sm"
                        >
                          {key}
                        </kbd>
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
  )
}
