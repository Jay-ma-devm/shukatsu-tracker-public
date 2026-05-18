import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
const esResult = await client.execute(
  `SELECT e.id FROM EntrySheet e JOIN Company c ON e.companyId=c.id WHERE c.name='A.T.カーニー' ORDER BY e.createdAt DESC LIMIT 1`
);
if (esResult.rows.length === 0) { console.log('ATK ES not found'); process.exit(1); }
const esId = esResult.rows[0].id as string;
const questions = await client.execute(`SELECT id, "order", question FROM EsQuestion WHERE entrySheetId='${esId}' ORDER BY "order"`);
const answers = [
  {
    order: 1,
    answer: `Why strategy consulting and A.T.Kearney?

I am drawn to strategy consulting because of my belief that the most impactful decisions — those that shape the long-term trajectory of organizations and society — are made at the strategic level. Through my experience in sales at ONE Corporation, I directly witnessed how the quality of strategic thinking determines a company's fate in competitive markets.

I chose A.T. Kearney specifically for three reasons: First, A.T. Kearney's renowned expertise in operations and supply chain strategy aligns with my passion for making industry-specific transformations in Japan's manufacturing sector. Second, the collaborative and action-oriented culture means that strategy doesn't stop at the PowerPoint — it gets implemented. Third, A.T. Kearney's global network provides opportunities to work on cross-border projects that matter at a global scale.

As Japan faces demographic challenges and industrial restructuring, I want to be part of the team that helps Japanese companies reinvent themselves and compete globally.（200字）`
  },
  {
    order: 2,
    answer: `学術・職業上の最大の成果：ABABAでのSEOコンテンツ戦略で月間5万PVを増加させたこと。

ABABA（就活支援プラットフォーム）でコンテンツSEO担当として、競合に大きく劣る検索流入を改善する課題に取り組みました。

競合分析により、一次情報（就活生の体験談・インタビュー）を含むコンテンツが上位を獲得していることを発見。仮説を立て、月3-5本の一次情報記事を制作しながら、内部リンク戦略も同時に最適化しました。データを毎週分析し、効果の高い手法に絞り込む「高速PDCA」を繰り返した結果、6ヶ月で月間オーガニック流入を5万PV増加させ、主要キーワードでのシェア拡大に成功しました。

この経験で最も学んだのは、「仮説の質と検証スピードの掛け算がアウトカムを決める」という原則。この思考法はコンサルティングの仕事においても核心的なスキルだと確信しています。（290字）`
  },
];
for (const ans of answers) {
  const q = questions.rows.find(r => r.order === ans.order);
  if (!q) continue;
  const escaped = ans.answer.replace(/'/g, "''");
  await client.execute(`UPDATE EsQuestion SET answer='${escaped}', charCount=${ans.answer.length}, updatedAt=CURRENT_TIMESTAMP WHERE id='${q.id}'`);
  console.log(`  ✅ Q${ans.order}: ${ans.answer.length}字追加`);
}
console.log('✅ A.T.カーニー ES 全設問に下書き追加完了');
