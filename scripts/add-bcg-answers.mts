import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
const esResult = await client.execute(
  `SELECT e.id FROM EntrySheet e JOIN Company c ON e.companyId=c.id WHERE c.name='BCG' ORDER BY e.createdAt DESC LIMIT 1`
);
if (esResult.rows.length === 0) { console.log('BCG ES not found'); process.exit(1); }
const esId = esResult.rows[0].id as string;
const questions = await client.execute(`SELECT id, "order", question FROM EsQuestion WHERE entrySheetId='${esId}' ORDER BY "order"`);
const answers: { order: number; answer: string }[] = [
  {
    order: 1, // Why BCG?
    answer: `BCGを志望する理由は、「テクノロジー×戦略」という最前線でクライアントの根本的な変革を支援できる場所だからです。

ONE株式会社での広告営業とABABAでのSEO施策で、データドリブンな意思決定が事業成果を劇的に変える場面を経験しました。ただ、現場レベルではなく企業の経営・事業ポートフォリオレベルで変革に関わりたいという思いが強くなりました。

BCGを選んだ理由は3つです。第一に、AIやデジタル技術を核とした戦略案件においてグローバルで最先端であること。第二に、BCGのPurpose（社会へのポジティブインパクト）が自分の価値観と合致していること。第三に、TBCGのような社会課題特化の取り組みで、ビジネスと社会貢献を両立できる点です。

インターンを通じて、BCGが世界に与えるインパクトの現場を体験したいと思っています。（320字）`
  },
  {
    order: 2, // リーダーシップ
    answer: `ONE株式会社での営業チームでのリーダーシップ経験をお話します。

チームで連続2ヶ月間、目標を下回る状態が続いた時期、私は自分のデータ分析を全体に展開することを提案しました。当初は「個人の成果として隠しておけばいい」という声もありましたが、「チーム全体が成功しないと個人の評価も上がらない」と説得し、高成約セグメントの情報をチーム全体でシェアする仕組みを作りました。

その結果、チーム全体の成約率が改善し、目標達成に貢献できました。この経験から、リーダーシップとは「自分の成功を他者の成功に転換する行為」だと学びました。自分の気づきや分析をオープンにシェアし、チーム全体を引き上げる。これがBCGでも実践したいスタイルです。（290字）`
  },
  {
    order: 3, // ガクチカ
    answer: `【ガクチカ】ABABAでのSEO施策で月間5万PV増を達成

ABABAのコンテンツSEO担当として、競合サイトとの流入格差を埋めるための戦略を独力で立案・実行しました。

課題は「主要検索ワードでの順位が競合に劣っている」こと。原因分析のため、競合のコンテンツをすべて分析し、「E-E-A-T（経験・専門性・権威・信頼性）を意識した一次情報記事」が上位を取っていることを発見しました。

施策として、就活生の実体験インタビューを基にした一次情報記事を月3-5本制作。加えて、内部リンク戦略を見直し、コアキーワードページへの流入を集中させました。

6ヶ月後、月間オーガニック流入が5万PV増加し、主要キーワードで上位表示を達成。この経験から「仮説の質を高め、検証を最速で回す」プロセスの重要性を学びました。（310字）`
  },
  {
    order: 4, // 社会へのインパクト
    answer: `私が社会に与えたいインパクトは、「日本の産業競争力の再興」です。

ONE株式会社での営業で、日本の中小企業が世界水準のデジタル化・マーケティングに大きく遅れを取っていることを実感しました。一方でその企業には高い技術力や独自の強みがある。その課題と可能性のギャップを埋める仕事がしたいと強く思っています。

コンサルタントとして、戦略立案から実行まで企業の変革を支援することで、日本の製造業・医療・教育などの産業が世界で戦える競争力を取り戻す手助けをしたい。特にAI・デジタル技術の活用による生産性向上と、グローバル市場へのアクセスを支援することで、日本企業が再び世界で輝く未来を作りたいと考えています。（280字）`
  },
];

for (const ans of answers) {
  const q = questions.rows.find(r => r.order === ans.order);
  if (!q) continue;
  const escaped = ans.answer.replace(/'/g, "''");
  await client.execute(`UPDATE EsQuestion SET answer='${escaped}', charCount=${ans.answer.length}, updatedAt=CURRENT_TIMESTAMP WHERE id='${q.id}'`);
  console.log(`  ✅ Q${ans.order}: ${ans.answer.length}字追加`);
}
console.log('✅ BCG ES 全設問に下書き追加完了');
