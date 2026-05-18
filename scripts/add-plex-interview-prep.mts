import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });

async function getId(): Promise<string> {
  await new Promise(r => setTimeout(r, 2));
  return `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10)}`;
}

const plex = await client.execute("SELECT id FROM Company WHERE userId='local-user' AND name='Pivot Studio'");
if (plex.rows.length === 0) { console.log('Pivot Studio not found'); process.exit(1); }
const plexId = plex.rows[0].id as string;

// Pivot Studioインターン最終選考向け想定質問の練習ログを追加
const prepLog = {
  companyId: plexId,
  type: 'behavioral',
  conductedAt: '2026-05-14T10:00:00.000Z', // 練習日として今日
  duration: 30,
  interviewerName: '（練習）',
  interviewerRole: '最終選考想定',
  questions: JSON.stringify([
    'このインターンを通じて何を達成したいですか？',
    'Pivot Studioのビジネスモデルをどう理解していますか？製造業SaaSとして強みは何だと思いますか？',
    'グループワーク中、意見が対立した時にどう対処しますか？',
    '5年後にどんなビジネスパーソンになっていたいですか？Pivot Studioでそれを実現できると思う理由は？',
    '最終面接でPivot Studioに入社したい一番の理由を一言で教えてください',
  ]),
  myAnswers: JSON.stringify([
    'このインターンを通じて、製造業DXの本質的な課題を実際の業務を通じて体感したい。また、Pivot Studioの社員の方々と密接に働く中で、ビジネス開発の実際のプロセスを学びたい。',
    'Pivot Studioは製造業特化のクラウドERPで、既存のオンプレミスERPをSaaS化することで、リアルタイムデータの可視化と生産性向上を実現している。強みは業界特有の規制・商慣習への深い理解とUI/UXの高さ。',
    '（準備回答）まず各自の意見を整理し、根拠データを確認する。次に目標（何を達成すべきか）から逆算して、どちらの案が目標達成に近いかを客観的に評価する。最終的にはチームの意思決定を尊重しながら、自分の意見を建設的に伝える。',
    '5年後はビジネス開発・営業戦略を担うリーダーとして、複数の大型案件をクローズした実績を持つ人材になりたい。Pivot StudioはインダストリーテックのリーダーとしてSaaS市場で急拡大中であり、成長の机上ではなく現場で貢献できる環境が整っている。',
    'Pivot Studioのミッション「産業のDXを最前線で支援する」という使命感が、私の「ものづくり日本の競争力再生」という志と完全に一致しているから。',
  ]),
  feedback: '（自己評価）5問全てを通じて一貫したメッセージ（製造業DX・Pivot Studioのミッションへの共感・データドリブン）を伝えられた。特にQ5は30秒以内に端的に答える練習が必要。',
  rating: 4,
  outcome: 'pending',
  nextStepNotes: '5/28（前日）に再度5回練習する。特にQ2の製造業SaaS説明を30秒バージョンでも言えるようにする。',
};

const id = await getId();
const q = prepLog.questions.replace(/'/g, "''");
const a = prepLog.myAnswers.replace(/'/g, "''");
const fb = prepLog.feedback.replace(/'/g, "''");
const ns = prepLog.nextStepNotes.replace(/'/g, "''");
const in_name = prepLog.interviewerName.replace(/'/g, "''");
const in_role = prepLog.interviewerRole.replace(/'/g, "''");

await client.execute(
  `INSERT INTO InterviewLog (id, companyId, type, conductedAt, duration, interviewerName, interviewerRole, questions, myAnswers, feedback, rating, outcome, nextStepNotes, createdAt, updatedAt)
   VALUES ('${id}', '${prepLog.companyId}', '${prepLog.type}', '${prepLog.conductedAt}', ${prepLog.duration}, '${in_name}', '${in_role}', '${q}', '${a}', '${fb}', ${prepLog.rating}, '${prepLog.outcome}', '${ns}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
);

const total = await client.execute("SELECT COUNT(*) as count FROM InterviewLog");
console.log(`✅ Pivot Studio最終インターン想定質問ログ追加（合計${total.rows[0].count}件）`);
