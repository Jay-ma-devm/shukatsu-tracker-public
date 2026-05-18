import type { CompanyStatus, EventType, StageStatus } from "@/types"

export const COMPANY_STATUSES: {
  value: CompanyStatus
  label: string
  color: string
  bgColor: string
}[] = [
  { value: "applied", label: "応募済", color: "text-slate-600", bgColor: "bg-slate-100" },
  { value: "screening", label: "書類選考", color: "text-blue-600", bgColor: "bg-blue-100" },
  { value: "interview", label: "面接中", color: "text-amber-600", bgColor: "bg-amber-100" },
  { value: "internship", label: "インターン参加", color: "text-cyan-600", bgColor: "bg-cyan-100" },
  { value: "case", label: "ケース面接", color: "text-violet-600", bgColor: "bg-violet-100" },
  { value: "final", label: "最終面接", color: "text-orange-600", bgColor: "bg-orange-100" },
  { value: "offer", label: "内定", color: "text-emerald-600", bgColor: "bg-emerald-100" },
  { value: "accepted", label: "承諾", color: "text-emerald-700", bgColor: "bg-emerald-200" },
  { value: "rejected", label: "不合格", color: "text-red-600", bgColor: "bg-red-100" },
  { value: "withdrawn", label: "辞退", color: "text-zinc-500", bgColor: "bg-zinc-100" },
]

export const STAGE_STATUSES: {
  value: StageStatus
  label: string
  color: string
}[] = [
  { value: "pending", label: "未実施", color: "text-zinc-500" },
  { value: "scheduled", label: "予定あり", color: "text-blue-500" },
  { value: "passed", label: "通過", color: "text-emerald-600" },
  { value: "failed", label: "不通過", color: "text-red-500" },
  { value: "cancelled", label: "キャンセル", color: "text-zinc-400" },
]

export const EVENT_TYPES: {
  value: EventType
  label: string
  icon: string
}[] = [
  { value: "interview", label: "面接", icon: "👤" },
  { value: "case_interview", label: "ケース面接", icon: "📊" },
  { value: "deadline", label: "締切", icon: "⏰" },
  { value: "task", label: "タスク", icon: "✅" },
  { value: "meeting", label: "ミーティング", icon: "🤝" },
  { value: "info_session", label: "説明会", icon: "📋" },
  { value: "coffee_chat", label: "コーヒーチャット", icon: "☕" },
]

export const INDUSTRIES = [
  "IT/SaaS",
  "AI",
  "AI/Strategy",
  "Consulting",
  "FinanceVC",
  "HR-tech",
  "HR-tech/SaaS",
  "Industry-tech",
  "Marketing/D2C",
  "Fashion-tech",
  "Wellness/D2C",
  "IT/Gaming",
  "EC/Retail",
  "Healthcare",
  "EdTech",
  "PropTech",
  "金融・銀行",
  "証券",
  "保険",
  "製造業",
  "総合商社",
  "専門商社",
  "小売・流通",
  "不動産",
  "建設",
  "食品・飲料",
  "メディア・広告",
  "エンタメ",
  "インフラ・エネルギー",
  "官公庁・公共",
  "その他",
]

export const COMPANY_SIZES = [
  { value: "Startup", label: "スタートアップ (〜50名)" },
  { value: "Mid", label: "中堅 (50〜300名)" },
  { value: "Large", label: "大手 (300〜1000名)" },
  { value: "Mega", label: "メガ (1000名〜)" },
]

export const CASE_CATEGORIES = [
  "市場規模推定",
  "売上向上",
  "新規事業",
  "M&A",
  "コスト削減",
  "採用・HR",
  "マーケティング",
  "オペレーション改善",
  "デジタル化・DX",
  "その他",
]

export const PRIORITIES = [
  { value: 5, label: "最高", stars: "★★★★★" },
  { value: 4, label: "高", stars: "★★★★☆" },
  { value: 3, label: "中", stars: "★★★☆☆" },
  { value: 2, label: "低", stars: "★★☆☆☆" },
  { value: 1, label: "最低", stars: "★☆☆☆☆" },
]

export const EMAIL_CATEGORIES = ["辞退", "調整", "お礼", "依頼", "質問", "その他"]

export const LOCAL_USER_ID = "local-user"

// メールテンプレートで使われるデフォルト署名（サンプル）。
// 本番運用時は環境変数 NEXT_PUBLIC_STUDENT_SIGNATURE で上書き、
// もしくは設定画面からユーザー自身が書き換える前提のプレースホルダ。
export const STUDENT_SIGNATURE = process.env.NEXT_PUBLIC_STUDENT_SIGNATURE ?? `〇〇大学〇〇学部 / 2028年3月卒業予定
山田 太郎（やまだ たろう）
TEL: 090-XXXX-XXXX
Mail: your-email@example.com`

export const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード", icon: "LayoutDashboard" },
  { href: "/companies", label: "企業管理", icon: "Building2" },
  { href: "/companies/kanban", label: "カンバン", icon: "Kanban" },
  { href: "/calendar", label: "カレンダー", icon: "Calendar" },
  { href: "/tasks", label: "タスク", icon: "CheckSquare" },
  { href: "/cases", label: "ケース練習", icon: "BookOpen" },
  { href: "/notes", label: "ノート", icon: "FileText" },
  { href: "/interviews", label: "面接ログ", icon: "MessageSquare" },
  { href: "/meetings", label: "OB訪問", icon: "Users" },
  { href: "/career", label: "キャリア軌跡", icon: "Timeline" },
  { href: "/companies/compare", label: "企業比較", icon: "GitCompare" },
  { href: "/templates", label: "メールテンプレ", icon: "Mail" },
  { href: "/settings", label: "設定", icon: "Settings" },
]

// Task status
export const TASK_STATUSES = [
  { value: "todo", label: "未着手", color: "text-zinc-500", bgColor: "bg-zinc-100" },
  { value: "doing", label: "進行中", color: "text-blue-600", bgColor: "bg-blue-100" },
  { value: "done", label: "完了", color: "text-emerald-600", bgColor: "bg-emerald-100" },
] as const

// Entry Sheet status
export const ES_STATUSES = [
  { value: "draft", label: "下書き", color: "text-zinc-500", bgColor: "bg-zinc-100" },
  { value: "writing", label: "執筆中", color: "text-amber-600", bgColor: "bg-amber-100" },
  { value: "reviewing", label: "見直し中", color: "text-violet-600", bgColor: "bg-violet-100" },
  { value: "submitted", label: "提出済", color: "text-blue-600", bgColor: "bg-blue-100" },
  { value: "passed", label: "通過", color: "text-emerald-600", bgColor: "bg-emerald-100" },
  { value: "failed", label: "落選", color: "text-red-500", bgColor: "bg-red-100" },
] as const

// Interview types
export const INTERVIEW_TYPES = [
  { value: "casual", label: "カジュアル面談" },
  { value: "1st", label: "1次面接" },
  { value: "2nd", label: "2次面接" },
  { value: "final", label: "最終面接" },
  { value: "case", label: "ケース面接" },
  { value: "group", label: "グループ面接" },
] as const

// Meeting types
export const MEETING_TYPES = [
  { value: "ob", label: "OB訪問" },
  { value: "casual", label: "カジュアル面談" },
  { value: "info_session", label: "会社説明会" },
  { value: "coffee_chat", label: "コーヒーチャット" },
] as const

// Career entry types
export const CAREER_ENTRY_TYPES = [
  { value: "internship", label: "インターンシップ" },
  { value: "event", label: "イベント・コンテスト" },
  { value: "milestone", label: "マイルストーン" },
  { value: "achievement", label: "実績・受賞" },
] as const

// Note categories
export const NOTE_CATEGORIES = [
  "企業研究",
  "OB訪問",
  "面接振り返り",
  "業界分析",
  "就活全体戦略",
  "その他",
] as const
