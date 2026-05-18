import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "@prisma/client"

const adapter = new PrismaLibSql({ url: "file:dev.db" })
const prisma = new PrismaClient({ adapter } as unknown as ConstructorParameters<typeof PrismaClient>[0])
const USER_ID = "local-user"

const SIGNATURE = `---
〇〇大学〇〇学部 / 2028年3月卒業予定
Demo User
TEL: 090-XXXX-XXXX
Mail: demo@example.com`

async function main() {
  const templates = [
    {
      name: "面接無断欠席・日程再調整のお詫び",
      category: "謝罪・お詫び",
      subject: "面接のご欠席に関するお詫びと日程再調整のお願い",
      body: `{{採用担当者名}}様

お世話になっております。
〇〇大学〇〇学部3年のDemo Userと申します。

この度は、{{面接日}}にご予定いただいておりました面接に、
ご連絡もなく欠席してしまいましたこと、誠に申し訳ございませんでした。

大変失礼な行為であったことを深くお詫び申し上げます。

もし可能であれば、改めて面接の機会をいただけますでしょうか。
以下の日程にて、ご都合のよい時間帯をご指定いただけますと幸いです。

【候補日程】
・{{候補日1（例：5月26日（月）10:00〜17:00）}}
・{{候補日2（例：5月27日（火）10:00〜17:00）}}
・{{候補日3（例：5月28日（水）10:00〜17:00）}}

ご多忙のところ誠に恐れ入りますが、
ご検討のほどよろしくお願いいたします。

${SIGNATURE}`,
      tags: "謝罪,リスケ,面接",
    },
    {
      name: "インターンシップ当日お礼メール",
      category: "お礼",
      subject: "本日のインターンシップへのご参加御礼",
      body: `{{採用担当者名}}様

本日はお忙しい中、インターンシップにご参加の機会をいただき、
誠にありがとうございました。

{{会社名}}の{{プログラム名}}を通じて、
{{学んだこと・印象的だったこと}}について深く理解することができました。

特に{{具体的なエピソード}}が印象的で、
貴社への志望度がさらに高まりました。

今後ともどうぞよろしくお願いいたします。

${SIGNATURE}`,
      tags: "お礼,インターン",
    },
    {
      name: "WEBテスト受験完了のご連絡",
      category: "連絡",
      subject: "WEBテスト受験完了のご連絡",
      body: `{{採用担当者名}}様

お世話になっております。
〇〇大学〇〇学部3年のDemo Userと申します。

この度、ご案内いただいておりましたWEBテストの受験を完了いたしましたのでご連絡申し上げます。

引き続きどうぞよろしくお願いいたします。

${SIGNATURE}`,
      tags: "連絡,WEBテスト",
    },
  ]

  for (const tpl of templates) {
    const existing = await prisma.emailTemplate.findFirst({ where: { userId: USER_ID, name: tpl.name } })
    if (existing) { console.log("⏭️  既存: " + tpl.name); continue }
    await prisma.emailTemplate.create({ data: { userId: USER_ID, ...tpl, usageCount: 0 } })
    console.log("✅ テンプレート追加: " + tpl.name)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
