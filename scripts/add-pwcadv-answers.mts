import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const esResult = await client.execute(
  `SELECT e.id FROM EntrySheet e JOIN Company c ON e.companyId=c.id
   WHERE c.name='PwCアドバイザリー（M&A・戦略）' ORDER BY e.createdAt DESC LIMIT 1`
);
if (esResult.rows.length === 0) { console.log('PwCAdvisory ES not found'); process.exit(1); }
const esId = esResult.rows[0].id as string;

const questions = await client.execute(
  `SELECT id, "order", question FROM EsQuestion WHERE entrySheetId='${esId}' ORDER BY "order"`
);
const answers = [
  {
    order: 1,
    answer: `M&A・戦略コンサルタント職を志望する理由は、企業の最も重要な意思決定（M&A・事業ポートフォリオ戦略）に貢献できる仕事だからです。

ONE株式会社での広告営業と、自身のM&Aアドバイザリーファームでの短期インターン経験を通じ、「企業の経営判断の質が事業の命運を決める」という事実を強く実感しました。その中で、最も高度な経営判断であるM&Aや事業戦略の立案に関わるPwCアドバイザリーに強く惹かれています。

PwCを選んだ理由は、M&A・デジタル・リスクが統合された独自のケイパビリティと、グローバル案件にも関われる環境があるからです。特に日本企業の海外M&A支援や、クロスボーダー案件での価値創造に関わりたいと考えています。（280字）`
  },
  {
    order: 2,
    answer: `学生時代の最も誇る実績は、ONE株式会社での広告営業でのKPI達成です。

入社初月に目標比30%という低成約率に直面した際、データ分析により高成約セグメント（医薬品・保険・健康食品メーカー）を特定しました。そこへ集中的にリソースを投下し、翌月から連続して月次KPIを達成しました。この取組みにより、チーム内でのアポ取得件数ランキングで上位を維持しました。

また、ABABAでのSEO施策では、競合分析・キーワード戦略・コンテンツ制作のフルサイクルを独力で担当し、6ヶ月で月間オーガニック流入を5万PV増加させました。どちらも「仮説→検証→改善」の高速サイクルを意識した結果です。（270字）`
  },
  {
    order: 3,
    answer: `5年後のキャリアビジョンは、M&A領域のプロフェッショナルとして、日本企業のクロスボーダー案件をリードするコンサルタントになることです。

入社後1〜2年はM&A実務の基礎（デューデリジェンス・バリュエーション・PMI）を徹底習得し、案件に直接貢献できる専門性を身につけます。3〜5年目は中規模案件のリード経験を積み、クライアントのCFO・CSOと直接対話できるレベルを目指します。

長期的には、デジタル×M&Aという新領域（デジタルM&A・テック企業買収支援）の専門家として、日本企業のグローバル競争力強化に貢献したいと思っています。（230字）`
  },
];

for (const ans of answers) {
  const q = questions.rows.find(r => r.order === ans.order);
  if (!q) continue;
  const escaped = ans.answer.replace(/'/g, "''");
  await client.execute(`UPDATE EsQuestion SET answer='${escaped}', charCount=${ans.answer.length}, updatedAt=CURRENT_TIMESTAMP WHERE id='${q.id}'`);
  console.log(`  ✅ Q${ans.order}: ${ans.answer.length}字追加`);
}

const updated = await client.execute(`SELECT "order", length(answer) as len FROM EsQuestion WHERE entrySheetId='${esId}' ORDER BY "order"`);
console.log('\nPwCアドバイザリーES進捗:');
updated.rows.forEach(r => console.log(`  Q${r.order}: ${(r.len as number) > 0 ? `✅ ${r.len}字` : '⬜ 未記入'}`));
