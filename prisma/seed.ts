import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { LOCAL_USER_ID, STUDENT_SIGNATURE } from "../src/lib/constants"

/**
 * デモシード — public OSS 用のサンプルデータです。
 * 会社名・人名・メール・電話番号はすべて架空のもの。
 * 本番運用時は本ファイルを実行せず、ユーザーがGoogleログイン後にUIから登録します。
 */

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:dev.db", ...(process.env.TURSO_AUTH_TOKEN ? { authToken: process.env.TURSO_AUTH_TOKEN } : {}) })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding demo data...")

  await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      id: LOCAL_USER_ID,
      name: "Demo User",
      email: "demo@example.com",
      emailVerified: new Date(),
    },
  })

  const now = new Date()
  const companies = [
    {
      name: "Lumen Robotics",
      industry: "AI",
      position: "AIストラテジスト（インターン）",
      priority: 5,
      status: "interview",
      starred: true,
      notes: "最終面接前。差別化ポイントの整理が必要。",
      stages: [
        { name: "書類選考", order: 1, status: "passed" },
        { name: "1次面接", order: 2, status: "passed" },
        { name: "最終面接", order: 3, status: "scheduled", scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      ],
    },
    {
      name: "Northstar Bank",
      industry: "金融・銀行",
      position: "総合職",
      priority: 5,
      status: "interview",
      starred: false,
      notes: "OB訪問済み。事前課題提出完了。",
      stages: [
        { name: "書類選考", order: 1, status: "passed" },
        { name: "GD", order: 2, status: "scheduled", scheduledAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) },
      ],
    },
    {
      name: "Pivot Studio",
      industry: "Marketing/D2C",
      position: "戦略コンサルインターン",
      priority: 4,
      status: "interview",
      starred: false,
      notes: "3daysインターン参加予定。ケース課題は事前送付済み。",
      stages: [
        { name: "書類選考", order: 1, status: "passed" },
        { name: "インターン", order: 2, status: "scheduled", scheduledAt: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000) },
      ],
    },
    {
      name: "Helix Therapeutics",
      industry: "Healthcare",
      position: "BizDev",
      priority: 4,
      status: "screening",
      starred: false,
      notes: "ヘルステック領域、サイエンスバックグラウンドが評価されそう。",
      stages: [
        { name: "書類選考", order: 1, status: "pending" },
      ],
    },
    {
      name: "Cobalt Cloud",
      industry: "IT/SaaS",
      position: "プロダクトマーケティング",
      priority: 3,
      status: "screening",
      starred: false,
      notes: null,
      stages: [
        { name: "書類選考", order: 1, status: "pending" },
      ],
    },
    {
      name: "Junction Mobility",
      industry: "Industry-tech",
      position: "新規事業企画",
      priority: 3,
      status: "applied",
      starred: false,
      notes: null,
      stages: [],
    },
    {
      name: "Atelier Atlas",
      industry: "総合商社",
      position: "総合職",
      priority: 4,
      status: "applied",
      starred: false,
      notes: null,
      stages: [],
    },
    {
      name: "Sora Health",
      industry: "HR-tech/SaaS",
      position: "ビジネス職",
      priority: 4,
      status: "applied",
      starred: false,
      notes: null,
      stages: [],
    },
    {
      name: "Verdant Foods",
      industry: "食品・飲料",
      position: "マーケティング",
      priority: 4,
      status: "applied",
      starred: false,
      notes: null,
      stages: [],
    },
    {
      name: "Citadel Consulting",
      industry: "Consulting",
      position: "戦略コンサルインターン",
      priority: 3,
      status: "applied",
      starred: false,
      notes: null,
      stages: [],
    },
  ]

  for (const { stages, ...companyData } of companies) {
    const company = await prisma.company.create({
      data: {
        ...companyData,
        notes: companyData.notes ?? undefined,
        userId: LOCAL_USER_ID,
        appliedAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    })

    for (const stage of stages) {
      await prisma.stage.create({
        data: {
          ...stage,
          companyId: company.id,
          scheduledAt: "scheduledAt" in stage ? stage.scheduledAt as Date : undefined,
        },
      })
    }
  }

  const lumen = await prisma.company.findFirst({ where: { name: "Lumen Robotics" } })
  const northstar = await prisma.company.findFirst({ where: { name: "Northstar Bank" } })
  const pivot = await prisma.company.findFirst({ where: { name: "Pivot Studio" } })

  const events = [
    {
      title: "Lumen Robotics 最終面接",
      type: "interview",
      startAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      location: "Lumen Robotics 本社",
      companyId: lumen?.id,
    },
    {
      title: "Northstar Bank GD",
      type: "info_session",
      startAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      location: "Northstar Bank オフィス",
      companyId: northstar?.id,
    },
    {
      title: "Pivot Studio 3daysインターン",
      type: "case_interview",
      startAt: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      location: "Pivot Studio オフィス",
      companyId: pivot?.id,
    },
    {
      title: "Sora Health ES締切",
      type: "deadline",
      startAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      companyId: null,
    },
  ]

  for (const event of events) {
    await prisma.event.create({
      data: {
        ...event,
        companyId: event.companyId ?? undefined,
      },
    })
  }

  const caseLogs = [
    {
      title: "スタバ売上向上ケース",
      category: "売上向上",
      prompt: "スターバックスの日本国内での売上を1.5倍にするためにどうするか？",
      premise: "現状の店舗数維持。既存事業の延長で考える。",
      structure: "顧客数 × 来店頻度 × 客単価 の3軸で分解。\n顧客セグメント: 学生・ビジネス・ファミリー",
      analysis: "学生セグメントの来店頻度アップが最も効果的。\nサブスク型月額パス（月5杯3000円）を導入することで固定顧客化できる。",
      conclusion: "サブスクパス導入で来店頻度+30%、ドライブスルー強化で客単価+15%が実現可能。",
      feedback: "構造化は良かったが、競合（コンビニコーヒー）の考慮が浅かった。",
      rating: 4,
      difficulty: 3,
      duration: 30,
      tags: "売上向上,サービス業,消費者向け",
      userId: LOCAL_USER_ID,
    },
    {
      title: "ベビーカーレンタル新規事業",
      category: "新規事業",
      prompt: "観光地でのベビーカーシェアリングサービスを立ち上げるとしたら？",
      premise: "国内大手商業施設チェーンとの提携前提。初期投資5000万円。",
      structure: "①市場規模推定 → ②競合分析 → ③収益モデル → ④実装ロードマップ",
      analysis: "ターゲット: 年間2000万人の観光地訪問者のうち乳幼児連れ5%=100万人。\n単価500円/日×利用率20%=年間1億円の市場。",
      conclusion: "施設内シェアリング型で初期ROI3年で達成可能。観光庁との連携で補助金活用が鍵。",
      feedback: "数字の根拠が弱い。市場規模推定のロジックをもっと丁寧に。",
      rating: 3,
      difficulty: 4,
      duration: 45,
      tags: "新規事業,観光,D2C",
      userId: LOCAL_USER_ID,
    },
    {
      title: "占い師の市場規模推定",
      category: "市場規模推定",
      prompt: "日本の占い市場の規模はいくら？",
      premise: "オンライン含む全形態。",
      structure: "人口ベース: 日本人口1.2億 × 占い利用率10% × 年間消費額5000円",
      analysis: "6000億円。うちオンライン占いは40%=2400億円。\n実際の調査データは5000〜6000億円で合致。",
      conclusion: "フェルミ推定として高精度。ただし利用率の根拠がやや感覚的。",
      feedback: "結果は合っていたが、もっと複数のアプローチで検証すべきだった。",
      rating: 4,
      difficulty: 2,
      duration: 15,
      tags: "市場規模推定,フェルミ推定",
      userId: LOCAL_USER_ID,
    },
  ]

  for (const caseLog of caseLogs) {
    await prisma.caseLog.create({ data: caseLog })
  }

  const templates = [
    {
      name: "選考辞退",
      category: "辞退",
      subject: "選考辞退のご連絡",
      body: `{{担当者名}} 様\n\nお世話になっております。\n{{大学名}}の{{氏名}}と申します。\n\nこのたびは{{選考名}}の選考をご検討いただき、誠にありがとうございます。\n\n大変恐縮ながら、他社との兼ね合いを熟慮した結果、\n今回の選考を辞退させていただきたく、ご連絡申し上げます。\n\n貴重なお時間をいただいたにも関わらず、誠に申し訳ございません。\n{{会社名}}の益々のご発展をお祈り申し上げます。\n\n---\n${STUDENT_SIGNATURE}`,
      tags: "辞退,重要",
      userId: LOCAL_USER_ID,
    },
    {
      name: "日程調整希望",
      category: "調整",
      subject: "面接日程のご確認",
      body: `{{担当者名}} 様\n\nお世話になっております。\n{{大学名}}の{{氏名}}と申します。\n\n{{選考内容}}についてご連絡いただき、ありがとうございます。\n\n以下の日程にてご都合はいかがでしょうか。\n\n【候補日程】\n①{{日程1}}\n②{{日程2}}\n③{{日程3}}\n\nご多忙のところ恐れ入りますが、何卒よろしくお願いいたします。\n\n---\n${STUDENT_SIGNATURE}`,
      tags: "日程調整",
      userId: LOCAL_USER_ID,
    },
    {
      name: "面接お礼",
      category: "お礼",
      subject: "本日の面接のお礼",
      body: `{{担当者名}} 様\n\nお世話になっております。\n本日{{選考名}}にてお時間をいただきました、{{大学名}}の{{氏名}}です。\n\n本日は貴重なお時間をいただき、誠にありがとうございました。\n\n{{印象に残った話}}について伺い、{{会社名}}への志望度がさらに高まりました。\n引き続き何卒よろしくお願いいたします。\n\n---\n${STUDENT_SIGNATURE}`,
      tags: "お礼,面接後",
      userId: LOCAL_USER_ID,
    },
    {
      name: "説明会お礼",
      category: "お礼",
      subject: "本日の会社説明会のお礼",
      body: `{{担当者名}} 様\n\nお世話になっております。\n本日の{{説明会名}}に参加いたしました、{{大学名}}の{{氏名}}と申します。\n\n本日は貴重な機会をいただき、誠にありがとうございました。\n\n{{学んだこと・印象に残ったこと}}について大変勉強になりました。\nぜひ選考に挑戦させていただきたいと思っております。\n\n引き続きよろしくお願いいたします。\n\n---\n${STUDENT_SIGNATURE}`,
      tags: "お礼,説明会",
      userId: LOCAL_USER_ID,
    },
    {
      name: "OB訪問依頼",
      category: "依頼",
      subject: "OB訪問のお願い",
      body: `{{お名前}} 様\n\n突然のご連絡、失礼いたします。\n{{大学名}}3年の{{氏名}}と申します。\n\n{{接点・きっかけ}}にてご連絡先を教えていただきました。\n\n{{会社名}}にご就職された先輩にお話を伺いたく、ご連絡いたしました。\n30〜45分程度、オンラインでのお話をいただくことは可能でしょうか。\n\nお忙しいところ大変恐縮ですが、ご検討いただけますと幸いです。\n\n---\n${STUDENT_SIGNATURE}`,
      tags: "OB訪問,依頼",
      userId: LOCAL_USER_ID,
    },
  ]

  for (const template of templates) {
    await prisma.emailTemplate.create({ data: template })
  }

  const lumenCo = await prisma.company.findFirst({ where: { name: "Lumen Robotics" } })
  const northstarCo = await prisma.company.findFirst({ where: { name: "Northstar Bank" } })
  const tasks = [
    { title: "Lumen Robotics の企業研究を深める", description: "競合の差別化ポイントを整理", status: "todo", priority: 5, companyId: lumenCo?.id, dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), tags: "企業研究" },
    { title: "Northstar Bank のGD対策", description: "頻出テーマを整理してロールプレイ", status: "doing", priority: 5, companyId: northstarCo?.id, dueAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), tags: "GD,対策" },
    { title: "Sora Health のES提出", description: "志望動機・学生時代力を入れたこと", status: "todo", priority: 4, dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), tags: "ES" },
    { title: "Verdant Foods のエントリー", status: "todo", priority: 3, tags: "エントリー" },
    { title: "面接後のお礼メール送信 (Lumen Robotics)", status: "done", priority: 4, completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), companyId: lumenCo?.id },
  ]
  for (const task of tasks) {
    await prisma.task.create({ data: { ...task, userId: LOCAL_USER_ID, companyId: task.companyId ?? undefined } })
  }

  if (lumenCo) {
    const es = await prisma.entrySheet.create({
      data: {
        companyId: lumenCo.id,
        title: "Lumen Robotics 本選考ES",
        status: "submitted",
        submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    })
    await prisma.esQuestion.createMany({
      data: [
        { entrySheetId: es.id, order: 1, question: "学生時代に最も力を入れたことを教えてください（400字以内）", answer: "（サンプル）大学のゼミでマーケティング調査プロジェクトを主導しました。", charLimit: 400, charCount: 35 },
        { entrySheetId: es.id, order: 2, question: "Lumen Robotics を志望する理由を教えてください（400字以内）", answer: "（サンプル）AI/ロボティクス領域での独自ポジショニングに魅力を感じます。", charLimit: 400, charCount: 38 },
        { entrySheetId: es.id, order: 3, question: "入社後にやりたいことを教えてください（300字以内）", charLimit: 300, charCount: 0 },
      ],
    })
  }

  if (lumenCo) {
    const lumenStages = await prisma.stage.findMany({ where: { companyId: lumenCo.id } })
    await prisma.interviewLog.create({
      data: {
        companyId: lumenCo.id,
        stageId: lumenStages[1]?.id,
        type: "1st",
        conductedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        duration: 45,
        interviewerName: "面接官A（サンプル）",
        interviewerRole: "事業企画部 マネージャー",
        questions: "Q1: 自己紹介をお願いします\nQ2: 学生時代に力を入れたことは？\nQ3: Lumen Robotics を選んだ理由は？\nQ4: 入社後にやりたいことは？",
        myAnswers: "（サンプル回答）",
        feedback: "論理的な回答は評価された。競合分析が甘かった点を改善すること。",
        rating: 4,
        outcome: "passed",
        nextStepNotes: "最終面接までに競合分析を深める",
      },
    })
  }

  if (lumenCo) {
    await prisma.meeting.create({
      data: {
        userId: LOCAL_USER_ID,
        companyId: lumenCo.id,
        type: "ob",
        title: "Lumen Robotics 先輩社員 OB訪問",
        conductedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        duration: 60,
        location: "Zoom",
        topics: "・入社の決め手\n・部署の日常業務\n・どんな学生が活躍しているか\n・面接対策",
        insights: "・現場主義で、学生でも裁量を持てる\n・データドリブンな意思決定文化",
        followUp: "お礼メール送信済み。面接準備に活かす。",
        thankYouSent: true,
      },
    })
  }

  if (lumenCo) {
    await prisma.note.createMany({
      data: [
        {
          companyId: lumenCo.id,
          userId: LOCAL_USER_ID,
          title: "Lumen Robotics 企業研究メモ",
          content: "# Lumen Robotics 企業研究\n\n## 事業概要\n- AI / ロボティクス領域のスタートアップ\n- B2B プロダクトを中心に展開\n\n## 強み\n- 技術ブランドが明確\n- 独自のデータ基盤\n\n## 課題\n- 知名度はまだ低い\n\n## 競合\n- （サンプル）",
          category: "research",
          tags: "企業研究",
          pinned: true,
        },
        {
          userId: LOCAL_USER_ID,
          title: "就活全体戦略メモ",
          content: "# 就活全体方針\n\n## 軸\n1. 事業グロースに直接関われる環境\n2. データドリブン文化\n3. 若いうちから裁量\n\n## ターゲット業界\n- AI / SaaS\n- 金融\n- 商社\n\n## スケジュール\n- 5月: インターン選考集中\n- 6月: 本選考エントリー\n- 7月: 面接ラッシュ",
          category: "general",
          pinned: true,
        },
      ],
    })
  }

  await prisma.careerEntry.createMany({
    data: [
      {
        userId: LOCAL_USER_ID,
        type: "internship",
        title: "Web系スタートアップ マーケインターン",
        organization: "某スタートアップ（サンプル）",
        role: "マーケティングインターン",
        startAt: new Date("2025-04-01"),
        endAt: new Date("2025-09-30"),
        description: "SNS マーケティング施策の企画・実行。",
        takeaways: "・仮説検証の重要性を体感\n・KPIの設計方法",
        skills: "SNS運用,コンテンツ制作,データ分析",
      },
      {
        userId: LOCAL_USER_ID,
        type: "milestone",
        title: "マーケティングゼミ 入ゼミ",
        organization: "（サンプル大学）",
        startAt: new Date("2025-04-01"),
        description: "中小企業のマーケティング課題をフィールドワークで解決するゼミ。",
        takeaways: "・実践的なマーケティング思考",
        skills: "マーケティング,プレゼン,フィールドワーク",
      },
      {
        userId: LOCAL_USER_ID,
        type: "event",
        title: "ビジネスコンテスト 参加",
        organization: "（サンプル大学）",
        startAt: new Date("2025-10-15"),
        endAt: new Date("2025-10-15"),
        description: "学生向けビジネスアイデアコンテスト。",
        takeaways: "・ケース思考の基礎\n・短時間での仮説構築",
        skills: "ケース,プレゼン",
      },
    ],
  })

  console.log("✅ Demo seeding complete!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
