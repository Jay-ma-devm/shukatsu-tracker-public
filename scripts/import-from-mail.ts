/**
 * Gmail・Googleカレンダーから収集した就活データを一括インポート
 * 実行: npx tsx scripts/import-from-mail.ts
 */
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "@prisma/client"

const adapter = new PrismaLibSql({ url: "file:dev.db" })
const prisma = new PrismaClient({ adapter } as unknown as ConstructorParameters<typeof PrismaClient>[0])

const USER_ID = "local-user"

const newCompanies = [
  // === コンサルティング ===
  {
    name: "マーサージャパン",
    industry: "コンサルティング",
    position: "新卒選考",
    status: "screening",
    priority: 4,
    notes: "書類選考合格。グループ選考へ（5/17まで予約必須）。マイページから予約。",
    url: "https://saiyo.jp",
  },
  {
    name: "KPMGコンサルティング",
    industry: "コンサルティング",
    position: "総合職",
    status: "screening",
    priority: 4,
    notes: "書類選考（ES）通過。WEBテスト受検期限5/20(水)23:59。所要約90分、言語・計数・英語・パーソナリティ。個人ID: XXMWYI0RFYR。Windows推奨（macOS非対応）。",
  },
  {
    name: "PwCアドバイザリー（M&A・戦略）",
    industry: "コンサルティング",
    position: "M&A・戦略コンサルタント",
    status: "applied",
    priority: 4,
    notes: "Summer Internship 第1締切5/19。戦略コンサルタント職（XVS）説明会参加済み。",
  },
  {
    name: "PwCコンサルティング（BC）",
    industry: "コンサルティング",
    position: "ビジネスコンサルタント（BC）",
    status: "applied",
    priority: 3,
    notes: "Summer Internship ES締切5/17。説明会参加済み（5/12, 5/15）。",
  },
  {
    name: "BCG（ボストン・コンサルティング・グループ）",
    industry: "コンサルティング",
    position: "アソシエイト（サマーインターン）",
    status: "applied",
    priority: 5,
    notes: "Summer Internship 東京オフィス。エントリー締切6/4。最難関コンサル。",
  },
  {
    name: "レイヤーズ・コンサルティング",
    industry: "コンサルティング",
    position: "コンサルタント",
    status: "applied",
    priority: 3,
    notes: "6/12(金)説明会【A: コンサル業界・企業概要編】。6/9(火)就活対策セミナー（応募〆切5/29 12:00）。",
  },
  // === 金融・銀行 ===
  {
    name: "日本政策投資銀行（DBJ）",
    industry: "金融",
    position: "1DAY SUMMER WORKSHOP",
    status: "applied",
    priority: 3,
    notes: "1次エントリー〆切5/26(火)正午。金融知識+グループワーク形式。",
  },
  {
    name: "野村証券",
    industry: "金融",
    position: "総合職（ビジネスコース）",
    status: "applied",
    priority: 3,
    notes: "夏季ワークショップコース合同説明会開催決定。コンテンツ・カンパニー（リサーチ）コース。",
  },
  {
    name: "野村総合研究所（NRI）",
    industry: "ITコンサルティング",
    position: "ITソリューション・コンサルティング",
    status: "applied",
    priority: 3,
    notes: "夏インターンシップ紹介セミナー予約受付中。実践型インターン4種類のコース。",
  },
  {
    name: "三菱UFJ銀行",
    industry: "金融",
    position: "システムデジタルコース",
    status: "applied",
    priority: 3,
    notes: "dodaキャンパス経由でインターンオファー。返答期限5/17。「次世代金融インフラを創るMUFGシステム部門Program」。",
  },
  // === 広告・マーケ ===
  {
    name: "Hakuhodo DY ONE",
    industry: "広告/マーケティング",
    position: "インターンシップ",
    status: "screening",
    priority: 3,
    notes: "5/13(水)インターンシップ説明会参加済み。夏季インターンシップ（早期選考直結）エントリー済み。",
    appliedAt: new Date("2026-05-13"),
  },
  // === エンタメ ===
  {
    name: "ワンキャリア",
    industry: "HR-tech",
    position: "ビジネス職",
    status: "screening",
    priority: 3,
    notes: "インターンシップ参加済み。5/21(木)12:00 人事面談（事後面談の後の次回面談）。",
  },
  {
    name: "グッドパッチ",
    industry: "UXデザイン",
    position: "サマーインターン（事業創造×UXデザイン）",
    status: "screening",
    priority: 3,
    notes: "一次面接（グループ面接・オンラインGoogle Meet・60分）の予約締切5/22。まだ予約未完了！マイページから予約すること。",
  },
  {
    name: "令和トラベル",
    industry: "旅行/観光",
    position: "ビジネス職",
    status: "interview",
    priority: 2,
    notes: "5/11の面接を無断欠席してしまった。採用担当から再調整連絡あり。5/25(月)以降の平日10:00-17:00で都合のつく日程を複数連絡すること。recruit@reiwatravel.co.jp",
  },
  {
    name: "丸井グループ",
    industry: "小売/流通",
    position: "総合職",
    status: "interview",
    priority: 3,
    notes: "春インターンシップ確定。7/10-7/11（2日間）。交通費一律2,000円。個人ID: M28000395。無断欠席で今後の選考不可。",
  },
  {
    name: "GMOインターネットグループ",
    industry: "IT/インターネット",
    position: "ビジネス職",
    status: "rejected",
    priority: 2,
    notes: "5/8 選考結果：不採用通知受信。10月以降再応募可能。",
  },
  // === ポーラ・オルビス（説明会）===
  {
    name: "ポーラ・オルビスHD",
    industry: "化粧品/FMCG",
    position: "総合職",
    status: "applied",
    priority: 3,
    notes: "5/15(金)15:00-16:00 オンライン会社説明会予約済み（URL確認済み）。",
    appliedAt: new Date("2026-05-08"),
  },
  // === 日本TCS ===
  {
    name: "日本TCS",
    industry: "IT/コンサルティング",
    position: "早期選考",
    status: "applied",
    priority: 2,
    notes: "早期選考応募受付延長。5/17締切。",
  },
  // === PwC Japan（監査法人・デジタルリスク）===
  {
    name: "PwC Japan有限責任監査法人",
    industry: "監査/コンサルティング",
    position: "デジタルリスクコンサルタント（RA）",
    status: "screening",
    priority: 3,
    notes: "1Day Job選考 Wave2振替。WEB適性検査+動画テスト 締切7/5(日)23:59。前回Wave1は未提出で振替。",
  },
]

// カレンダーから収集した重要な締切・イベント
const upcomingEvents = [
  // マーサージャパン
  { companyName: "マーサージャパン", title: "グループ選考 予約締切", type: "deadline", startAt: new Date("2026-05-17T23:59:00+09:00"), notes: "マイページから予約" },
  // KPMG
  { companyName: "KPMGコンサルティング", title: "WEBテスト 受検締切", type: "deadline", startAt: new Date("2026-05-20T23:59:00+09:00"), notes: "約90分。Windows推奨。個人ID: XXMWYI0RFYR" },
  // PwCアドバイザリー
  { companyName: "PwCアドバイザリー（M&A・戦略）", title: "Summer Internship ES第1締切", type: "deadline", startAt: new Date("2026-05-19T23:59:00+09:00") },
  // PwC BC
  { companyName: "PwCコンサルティング（BC）", title: "Summer Internship ES締切", type: "deadline", startAt: new Date("2026-05-17T23:59:00+09:00") },
  // BCG
  { companyName: "BCG（ボストン・コンサルティング・グループ）", title: "Summer Internship エントリー締切", type: "deadline", startAt: new Date("2026-06-04T22:00:00+09:00") },
  // SoftBank
  { companyName: "ソフトバンク", title: "JOB-MATCHインターン エントリー動画+コースアンケート締切", type: "deadline", startAt: new Date("2026-05-19T18:00:00+09:00"), notes: "マイページで希望コースアンケート回答＋動画提出" },
  // USJ
  { companyName: "USJ（ユー・エス・ジェイ）", title: "WEB適性検査・ES提出期限", type: "deadline", startAt: new Date("2026-07-02T23:59:00+09:00"), notes: "USJ Marketing Challenge 2026" },
  // ポーラ・オルビス
  { companyName: "ポーラ・オルビスHD", title: "オンライン会社説明会", type: "info_session", startAt: new Date("2026-05-15T15:00:00+09:00"), endAt: new Date("2026-05-15T16:00:00+09:00"), notes: "オンライン（URL要確認）" },
  // DBJ
  { companyName: "日本政策投資銀行（DBJ）", title: "1DAY SUMMER WORKSHOP 1次エントリー締切", type: "deadline", startAt: new Date("2026-05-26T12:00:00+09:00") },
  // ワンキャリア
  { companyName: "ワンキャリア", title: "人事面談（インターン事後面談）", type: "meeting", startAt: new Date("2026-05-21T12:00:00+09:00") },
  // グッドパッチ
  { companyName: "グッドパッチ", title: "一次面接（グループ面接）予約締切", type: "deadline", startAt: new Date("2026-05-22T23:59:00+09:00"), notes: "Google Meetオンライン・60分。マイページから予約！" },
  // 令和トラベル
  { companyName: "令和トラベル", title: "面接日程リスケ連絡", type: "deadline", startAt: new Date("2026-05-25T09:00:00+09:00"), notes: "5/11無断欠席。recruit@reiwatravel.co.jpへ平日10-17の候補日程を複数連絡する" },
  // 三菱UFJ
  { companyName: "三菱UFJ銀行", title: "インターンオファー返答期限", type: "deadline", startAt: new Date("2026-05-17T23:59:00+09:00"), notes: "dodaキャンパスで確認・回答" },
  // レイヤーズ
  { companyName: "レイヤーズ・コンサルティング", title: "就活対策セミナー応募締切", type: "deadline", startAt: new Date("2026-05-29T12:00:00+09:00"), notes: "6/9(火)開催の就活対策セミナー（コンサル業界・ケース・グルディス対策）" },
  { companyName: "レイヤーズ・コンサルティング", title: "就活対策セミナー", type: "meeting", startAt: new Date("2026-06-09T18:00:00+09:00"), notes: "コンサル業界・ケース・グルディス対策。オフィスにて。" },
  { companyName: "レイヤーズ・コンサルティング", title: "オンライン会社説明会【A: コンサル業界・企業概要編】", type: "info_session", startAt: new Date("2026-06-12T18:00:00+09:00") },
  // 丸井G
  { companyName: "丸井グループ", title: "春インターンシップ Day1", type: "interview", startAt: new Date("2026-07-10T09:00:00+09:00"), notes: "確定。2日間インターン。交通費一律2,000円。無断欠席厳禁。" },
  { companyName: "丸井グループ", title: "春インターンシップ Day2", type: "interview", startAt: new Date("2026-07-11T09:00:00+09:00") },
  // PwC Japan監査法人
  { companyName: "PwC Japan有限責任監査法人", title: "デジタルリスクコンサルタント WEBテスト締切", type: "deadline", startAt: new Date("2026-07-05T23:59:00+09:00"), notes: "Wave2振替。WEB適性検査+動画テスト" },
  // 日本TCS
  { companyName: "日本TCS", title: "早期選考エントリー締切", type: "deadline", startAt: new Date("2026-05-17T23:59:00+09:00") },
]

async function main() {
  console.log("🚀 メール・カレンダーデータのインポート開始...")

  // 既存企業名を取得（重複回避）
  const existing = await prisma.company.findMany({
    where: { userId: USER_ID },
    select: { name: true },
  })
  const existingNames = new Set(existing.map((c) => c.name))
  console.log(`📋 既存企業: ${existingNames.size}社`)

  // 新企業を追加
  let addedCompanies = 0
  const companyMap = new Map<string, string>() // name -> id

  // 既存企業のIDも取得
  const existingCompanies = await prisma.company.findMany({
    where: { userId: USER_ID },
    select: { name: true, id: true },
  })
  existingCompanies.forEach((c) => companyMap.set(c.name, c.id))

  for (const company of newCompanies) {
    if (existingNames.has(company.name)) {
      console.log(`  ⏭️  スキップ（既存）: ${company.name}`)
      continue
    }
    const created = await prisma.company.create({
      data: {
        userId: USER_ID,
        ...company,
      },
    })
    companyMap.set(company.name, created.id)
    addedCompanies++
    console.log(`  ✅ 追加: ${company.name} [${company.status}]`)
  }

  console.log(`\n📊 企業追加完了: ${addedCompanies}社`)

  // SOFTBANKとUSJが既存ならIDを取得
  const sbCompany = await prisma.company.findFirst({ where: { userId: USER_ID, name: { contains: "ソフトバンク" } } })
  if (sbCompany) companyMap.set("ソフトバンク", sbCompany.id)
  const usjCompany = await prisma.company.findFirst({ where: { userId: USER_ID, name: { contains: "USJ" } } })
  if (usjCompany) companyMap.set("USJ（ユー・エス・ジェイ）", usjCompany.id)

  // イベントを追加
  let addedEvents = 0
  for (const event of upcomingEvents) {
    const companyId = companyMap.get(event.companyName)
    if (!companyId) {
      console.log(`  ⚠️  企業が見つからないためスキップ: ${event.companyName} (${event.title})`)
      continue
    }
    await prisma.event.create({
      data: {
        companyId,
        title: event.title,
        type: event.type,
        startAt: event.startAt,
        endAt: event.endAt ?? null,
        notes: event.notes ?? null,
      },
    })
    addedEvents++
    console.log(`  📅 イベント追加: [${event.companyName}] ${event.title}`)
  }

  console.log(`\n📅 イベント追加完了: ${addedEvents}件`)
  console.log("\n🎉 インポート完了！")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
