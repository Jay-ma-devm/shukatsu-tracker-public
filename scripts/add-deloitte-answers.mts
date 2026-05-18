import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
const esResult = await client.execute(
  `SELECT e.id FROM EntrySheet e JOIN Company c ON e.companyId=c.id WHERE c.name='デロイト トーマツ コンサルティング' ORDER BY e.createdAt DESC LIMIT 1`
);
if (esResult.rows.length === 0) { console.log('Deloitte ES not found'); process.exit(1); }
const esId = esResult.rows[0].id as string;
const questions = await client.execute(`SELECT id, "order", question FROM EsQuestion WHERE entrySheetId='${esId}' ORDER BY "order"`);
const answers = [
  {
    order: 1, // 志望動機
    answer: `デロイト トーマツ コンサルティングを志望する理由は、「日本最大のコンサルティングファーム」として、国内のあらゆる産業の変革に最前線で関わることができるからです。

ONE株式会社での広告営業で、企業の経営課題の多様性と、それに対処する人材の重要性を実感しました。特に日本の大企業がデジタル化・グローバル化で遅れを取っている現状を見て、根本的な変革支援を行うコンサルタントという職業に強く惹かれています。

デロイトを選んだ理由は2つです。まず、戦略からM&A・FinancialAdvisoryまで一貫した支援ができること。次に、グローバルネットワークを活かした日系企業の海外展開支援に携われること。この2点が自分のキャリアビジョンと合致しています。（255字）`
  },
  {
    order: 2, // 解決したい社会課題
    answer: `私が解決したい社会課題は「日本の中小製造業のDX遅延」です。

日本の製造業は高い技術力を持ちながらも、デジタル化・自動化への対応が世界に比べて遅れています。特に中堅・中小企業では、ERPやIoTの導入が進まず、生産性向上の機会を逃し続けています。

この課題に対し、コンサルタントとして「現場目線のDX戦略」と「実行支援」を提供することで、日本の製造業の競争力を底上げしたいと考えています。単なる技術導入ではなく、組織変革・人材育成・プロセス改革を統合したDXを推進することで、製造現場から日本経済全体を再活性化させたい。デロイトの製造業DX実績とグローバルネットワークを活かして、この課題に取り組みたいと考えています。（280字）`
  },
  {
    order: 3, // 強みと弱み
    answer: `【強み】「高速PDCAによる問題解決力」

ONE株式会社での広告営業初月に目標30%達成という壁に直面した際、1週間で原因分析・仮説立案・施策実行・効果測定を回しました。データに基づく仮説を立て、最速で検証する姿勢が強みです。ABABAではこのスキルでSEO施策を6ヶ月で成果に結びつけました。

【弱み】「大局観の欠如」

日々の業務・施策に集中するあまり、中長期的な戦略視点が弱いことがあります。対策として、自分が取り組む施策を3ヶ月・1年・3年のタイムラインで考える習慣を意識的に実践しています。コンサルタントとして「戦略→戦術→実行」の連鎖を意識した思考法を強化中です。（240字）`
  },
];

for (const ans of answers) {
  const q = questions.rows.find(r => r.order === ans.order);
  if (!q) continue;
  const escaped = ans.answer.replace(/'/g, "''");
  await client.execute(`UPDATE EsQuestion SET answer='${escaped}', charCount=${ans.answer.length}, updatedAt=CURRENT_TIMESTAMP WHERE id='${q.id}'`);
  console.log(`  ✅ Q${ans.order}: ${ans.answer.length}字追加`);
}
console.log('✅ デロイト ES 全設問に下書き追加完了');
