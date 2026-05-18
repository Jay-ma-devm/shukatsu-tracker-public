import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
async function getId(): Promise<string> {
  await new Promise(r => setTimeout(r, 2));
  return `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10)}`;
}
const co = await client.execute("SELECT id FROM Company WHERE userId='local-user' AND name='Sora Health'");
if (co.rows.length === 0) { process.exit(1); }
const coId = co.rows[0].id as string;
const id = await getId();
const q = JSON.stringify([
  'Sora Healthのプロダクトを実際に使ったことはありますか？その感想は？',
  'HRテック市場で5年後Sora Healthはどういうポジションにいると思いますか？',
  'プロダクトマーケターとして入社後最初の半年でどんな成果を出したいですか？',
  'Sora Healthのミッション「社会の非合理を、なくしていく」に共感できるエピソードを教えてください',
  '役員として最後に聞きますが、あなたが当社に入社すべき理由を30秒で話してください',
]).replace(/'/g, "''");
const a = JSON.stringify([
  'フリートライアルで実際に入退社手続きの電子化機能を試しました。紙ベースの手続きが一元化されるUXの良さに感動。一方、カスタマイズ性がもう少し高いとより多くの会社が採用しやすくなると感じました。',
  'Sora HealthはHRのプラットフォーム企業として、給与・採用・評価・組織分析を統合するPoS（Platform of Platforms）のポジションを確立すると見ています。シェア80%以上の圧倒的支配的地位を築いた上で、海外展開も見えてくると思います。',
  '最初の3ヶ月は徹底的にプロダクトと市場を理解すること。その後CSチームと協力し、活用率の低いユーザーの課題を特定。6ヶ月以内に活用率改善施策（オンボーディング改善/コンテンツマーケ）を一つ成果として出せるようにする。',
  'ONE株式会社での営業で、採用担当の方が「応募書類の管理が紙とExcelで大変で、本来候補者と向き合う時間が削られている」という悩みを聞いた経験があります。Sora Healthがあれば解決できたのに、と感じたのが志望のきっかけの一つです。',
  '私がSora Healthに入社すべき理由は3つです。第一に「労働の非合理をなくす」というミッションが私の価値観と完全に一致している。第二に、ONE・ABABAでのマーケティング実践経験をSaaS環境で活かしたい。第三に、今がSora Healthの成長を最も間近で経験できる最高のタイミングだと確信しているからです。',
]).replace(/'/g, "''");
const fb = '（準備）Q5は30秒以内に凝縮して話す練習が必要。数字（ONE/ABABAの実績）を冒頭に入れると説得力が上がる。'.replace(/'/g, "''");
await client.execute(
  `INSERT INTO InterviewLog (id, companyId, type, conductedAt, duration, interviewerName, interviewerRole, questions, myAnswers, feedback, rating, outcome, nextStepNotes, createdAt, updatedAt)
   VALUES ('${id}', '${coId}', 'executive', '2026-05-14T11:00:00.000Z', 30, '（練習）', '役員面接想定', '${q}', '${a}', '${fb}', 4, 'pending', '面接前日に5回通し練習。特にQ5（30秒エレベーターピッチ）を完璧にする', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
);
console.log('✅ Sora Health役員面接想定質問ログ追加');
