/**
 * PwCコンサルティング（BC）のES設問に回答下書きを追加
 * 締切5/17（緊急）
 */
import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// PwCBC のESを取得
const esResult = await client.execute(
  `SELECT e.id FROM EntrySheet e
   JOIN Company c ON e.companyId=c.id
   WHERE c.name='PwCコンサルティング（BC）'
   ORDER BY e.createdAt DESC LIMIT 1`
);
if (esResult.rows.length === 0) { console.log('PwCBC ES not found'); process.exit(1); }
const esId = esResult.rows[0].id as string;
console.log('PwCBC ES ID:', esId);

// 現在の設問一覧を取得
const questions = await client.execute(
  `SELECT id, "order", question, answer FROM EsQuestion WHERE entrySheetId='${esId}' ORDER BY "order"`
);
console.log('Questions:');
questions.rows.forEach(r => console.log(`  Q${r.order}: ${r.question} [${(r.answer as string)?.substring(0, 50) || '未記入'}]`));

// 設問への回答下書きを追加
const answers = [
  {
    order: 1,
    answer: `〇〇大学〇〇学部2年のDemo Userと申します。ONE株式会社での広告営業で月間20件超のアポ獲得を達成した経験と、ABABAでのSEOコンテンツ制作で月間5万PVの流入増加を実現した経験が、私の強みです。

この経験で最も困難だったのは、ONE入社初月に目標達成率が30%に留まった時期です。原因を分析したところ、ターゲティングの精度不足と判明。業界別・企業規模別の成約率データを独自に収集し、高成約率セグメントへ集中することで翌月には目標を達成しました。

この経験から「データで仮説を立て、高速で検証する」という習慣が身につきました。感情や感覚ではなく、数字に基づいて意思決定する姿勢は、コンサルタントの仕事にも直結すると確信しています。（280字）`
  },
  {
    order: 2,
    answer: `PwCコンサルティングBC職を志望する理由は、「社会課題の根本解決」をビジネス変革の文脈で実現できると確信しているからです。

ONE株式会社での営業経験で、企業の意思決定の質が事業成果を大きく左右することを実感しました。数十億円の投資判断が、正確な市場分析と戦略的思考によって劇的に改善される場面を目の当たりにし、コンサルタントというプロフェッショナルの価値を強く意識しました。

PwCBCを選んだ理由は、テクノロジー×ビジネス変革の統合的なアプローチと、Paying for Successという結果重視の文化が自分の価値観と合致しているからです。特にDX案件を通じてクライアントの根本的な変革に関わりたいと思っています。（270字）`
  },
  {
    order: 3,
    answer: `私の強みは「高速PDCAによる問題解決力」です。

ONE株式会社での広告営業では、KPIを週次でトラッキングし、成功パターンの抽出と失敗要因の特定を繰り返すことで月次目標を継続的に達成しました。ABABAでは検索意図の分析→コンテンツ設計→効果測定→改善という一連のプロセスを独力で回しました。

コンサルの仕事では、クライアントの課題を素早く構造化し、データに基づく仮説を立て、検証を繰り返すことが求められます。私のPDCAサイクルを回す習慣と、数字で語る思考法は、分析から提案まで一貫したコンサルティングプロセスに直接活かせると確信しています。（250字）`
  },
  {
    order: 4,
    answer: `【ガクチカ】ONE株式会社での広告営業

〇〇大学〇〇学部2年在学中、ONE株式会社の医療・健康メディア事業部でインターンとして広告営業に従事しました。

最大の壁は入社初月の目標達成率30%という現実でした。感情に流されず原因分析に集中した結果、「訪問先の選定基準が曖昧」という根本課題を発見。業界別・規模別の商談記録を体系化し、成約率の高いセグメントを特定しました。その後、高成約率セグメントへ集中的にアプローチすることで翌月から継続して目標達成できるようになりました。

この経験から得た教訓は、「課題の本質を正確に特定してから行動する」こと。コンサルタントとして最も重要なスキルの一つだと確信しています。現在も月間20件以上のアポ取得を継続中。（290字）`
  },
];

// 設問IDを取得して回答を更新
for (const ans of answers) {
  const q = questions.rows.find(r => r.order === ans.order);
  if (!q) { console.log(`  ⚠️  Q${ans.order}が見つからない`); continue; }
  const escaped = ans.answer.replace(/'/g, "''");
  await client.execute(
    `UPDATE EsQuestion SET answer='${escaped}', charCount=${ans.answer.length}, updatedAt=CURRENT_TIMESTAMP WHERE id='${q.id}'`
  );
  console.log(`  ✅ Q${ans.order}: 回答を追加（${ans.answer.length}字）`);
}

// 確認
const updated = await client.execute(
  `SELECT "order", length(answer) as len, question FROM EsQuestion WHERE entrySheetId='${esId}' ORDER BY "order"`
);
console.log('\nES進捗:');
updated.rows.forEach(r => console.log(`  Q${r.order}: ${(r.len as number) > 0 ? `✅ ${r.len}字` : '⬜ 未記入'} - ${(r.question as string).substring(0, 30)}...`));
