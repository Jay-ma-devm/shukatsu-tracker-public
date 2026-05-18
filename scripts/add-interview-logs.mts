/**
 * 面接ログを Turso に追加
 */
import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function getId(): Promise<string> {
  return `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10)}`;
}

async function getCompanyId(name: string): Promise<string | null> {
  const r = await client.execute(`SELECT id FROM Company WHERE userId='local-user' AND name='${name.replace(/'/g, "''")}'`);
  return r.rows.length > 0 ? r.rows[0].id as string : null;
}

const interviewLogs = [
  // ===== Lumen Robotics（内定済み） =====
  {
    companyName: 'Lumen Robotics',
    type: 'behavioral',
    conductedAt: '2025-11-15T10:00:00.000Z',
    duration: 45,
    interviewerName: '採用担当',
    interviewerRole: 'HR',
    questions: JSON.stringify([
      '自己紹介をしてください',
      'なぜLumen Roboticsに興味を持ちましたか',
      '学生時代に力を入れたことを教えてください',
      'マーケティング経験を活かして何をしたいですか',
    ]),
    myAnswers: JSON.stringify([
      '〇〇大学〇〇学部2年のDemo Userです。ONE株式会社での広告営業とABABAでのSEOコンテンツ制作、SNS運用管理を並行して経験しています。',
      '健康経営×D2Cという領域が面白いと感じました。スポーツと日常生活の橋渡しをするブランドとして、マーケティングの可能性が非常に大きいと思っています。',
      'ONE株式会社での広告営業では月間20件以上のアポを獲得し、医療・健康メディアの価値を企業に伝えることに注力しました。',
      'SNS×コンテンツマーケティングの経験を活かし、Lumen Roboticsのブランド認知拡大に貢献したい。特にD2C領域での顧客体験の最適化を行いたい。',
    ]),
    feedback: '明るく積極的な印象。具体的な数字で実績を語れていた。健康経営への共感が伝わった。',
    rating: 4,
    outcome: 'passed',
    nextStepNotes: '二次面接へ',
  },
  {
    companyName: 'Lumen Robotics',
    type: 'behavioral',
    conductedAt: '2025-12-01T14:00:00.000Z',
    duration: 60,
    interviewerName: 'マーケティング部長',
    interviewerRole: 'マーケティングマネージャー',
    questions: JSON.stringify([
      'Lumen Roboticsのマーケティング課題をどう捉えますか',
      'SNS施策で最も効果的だったものを教えてください',
      '競合他社との差別化ポイントは何だと思いますか',
      '5年後どうなっていたいですか',
    ]),
    myAnswers: JSON.stringify([
      'ブランド認知はある程度あるが、コンバージョン率の最適化とLTV向上が課題と思います。特にリピーター育成のためのCRM施策が重要ではないかと考えます。',
      'ABABAでのSEO×SNS連動施策で月間5万PV増を達成。検索流入とSNSエンゲージメントを連動させた施策が最も効果的でした。',
      '健康経営の文脈でのB2B展開とD2Cの組み合わせは競合にはない強み。スポーツ×ウェルネスの文脈でのブランドポジションが独自。',
      'マーケターとして事業成長に直接貢献し、ゆくゆくはプロダクト開発にも関わる人材になりたい。',
    ]),
    feedback: '課題分析が的確。論理的思考と行動力のバランスが良い。',
    rating: 5,
    outcome: 'passed',
    nextStepNotes: '最終面接（役員）へ',
  },
  {
    companyName: 'Lumen Robotics',
    type: 'executive',
    conductedAt: '2025-12-20T11:00:00.000Z',
    duration: 60,
    interviewerName: '代表取締役CEO',
    interviewerRole: 'CEO',
    questions: JSON.stringify([
      '当社に入社したら最初の100日で何をしますか',
      '人生で最大のチャレンジは何でしたか',
      '就活の中でLumen Roboticsを第一志望にしている理由を教えてください',
      '逆質問はありますか',
    ]),
    myAnswers: JSON.stringify([
      '最初の1ヶ月は現場を徹底的に理解する。顧客インタビュー、各チームとの1on1、競合分析。2ヶ月目から小さな施策を高速で実行し始める。',
      'ONE株式会社での営業で初月に目標を大幅に下回り、自分の弱さを直視した経験。そこから逆算思考とKPI管理を徹底するようになった。',
      '「健康的な生活を届ける」というミッションが自分の価値観と完全に合致している。また、成長フェーズの会社で自分の仕事が直接事業に響くことに魅力を感じています。',
      '入社後、どのような人材になることを期待されますか。また、チームの雰囲気を教えてください。',
    ]),
    feedback: '内定を出します。強い志望動機と成長意欲を感じた。ぜひLumen Roboticsで活躍してください。',
    rating: 5,
    outcome: 'offer',
    nextStepNotes: '内定承諾済み',
  },
  // ===== Pivot Studio（最終選考） =====
  {
    companyName: 'Pivot Studio',
    type: 'behavioral',
    conductedAt: '2026-04-15T10:00:00.000Z',
    duration: 45,
    interviewerName: '採用担当',
    interviewerRole: 'HR',
    questions: JSON.stringify([
      '自己紹介と志望動機を教えてください',
      'どのような事業に興味がありますか',
      'チームで困難を乗り越えた経験はありますか',
    ]),
    myAnswers: JSON.stringify([
      'Demo Userです。ONE、ABABA、SNS運用を掛け持ちしながら、就活も進めています。Pivot Studioのインダストリーテック領域に惹かれています。',
      '製造業・物流のDXに強い関心。アナログ産業のデジタル変革が最もインパクトが大きいと考えています。',
      'ONE株式会社での営業チームで目標未達が続いた時期、チームで毎週振り返りを行い、個人の弱みを補い合う仕組みを作った。結果として月次目標を達成。',
    ]),
    feedback: '真摯な姿勢と多様な経験が印象的。インダストリーへの理解を深めてほしい。',
    rating: 4,
    outcome: 'passed',
    nextStepNotes: '二次面接・3daysインターン直結選考へ',
  },
  {
    companyName: 'Pivot Studio',
    type: 'case_interview',
    conductedAt: '2026-04-30T14:00:00.000Z',
    duration: 60,
    interviewerName: '事業部マネージャー',
    interviewerRole: '事業開発',
    questions: JSON.stringify([
      '製造業向けSaaSの市場規模を試算してください',
      'Pivot Studioが新規事業を立ち上げるとしたら何を選びますか',
      '競合比較でPivot Studioが勝てる領域はどこだと思いますか',
    ]),
    myAnswers: JSON.stringify([
      '日本の製造業事業所数約70万社 × 平均SaaS導入率10% × 年間ARR100万円 = 約700億円市場。DX化が進めば3兆円超の可能性。',
      'AIを活用した需給予測・在庫最適化SaaS。製造業の最大コスト要因は在庫過剰と欠品。既存ERPとの連携APIで差別化可能。',
      'ニッチ産業（金属加工・精密部品）向けの特化型SoRが強み。競合がカバーしにくい垂直統合型の提案が有効。',
    ]),
    feedback: 'フェルミ推定の精度が高い。事業提案に独自視点あり。ただし業界特有の商慣習理解をもっと深めてほしい。',
    rating: 4,
    outcome: 'passed',
    nextStepNotes: '三次面接（社員面談）へ',
  },
  {
    companyName: 'Pivot Studio',
    type: 'behavioral',
    conductedAt: '2026-05-07T15:00:00.000Z',
    duration: 45,
    interviewerName: '現場社員',
    interviewerRole: 'ビジネス開発',
    questions: JSON.stringify([
      '入社後にどんな貢献をしたいですか',
      'Pivot Studioのプロダクトを使ってみましたか。感想は？',
      'ストレス耐性はどうですか',
    ]),
    myAnswers: JSON.stringify([
      '最初は現場を深く理解しながら、自分の営業・マーケ経験を活かして新規顧客開拓に貢献したい。中長期的には業界特化の新機能企画にも関わりたい。',
      'トライアル版を使いました。UXが洗練されていて直感的。特に進捗管理ダッシュボードがわかりやすい。改善点としては製造ライン別のカスタマイズ性がもう少しあると嬉しい。',
      'ONE株式会社で毎月高いKPI目標を追いかけてきたのでプレッシャーには慣れています。むしろ追い詰められる状況の方が集中できるタイプです。',
    ]),
    feedback: 'プロダクトへの関心が高く、現場視点のフィードバックが的確。インターンで活躍できる素質を感じる。',
    rating: 5,
    outcome: 'passed',
    nextStepNotes: '最終選考（3daysインターン 5/29-31）へ',
  },
  // ===== Sora Health（最終選考） =====
  {
    companyName: 'Sora Health',
    type: 'behavioral',
    conductedAt: '2026-03-15T10:00:00.000Z',
    duration: 45,
    interviewerName: '採用担当',
    interviewerRole: 'HR',
    questions: JSON.stringify([
      '自己PRと志望理由を教えてください',
      'HRテック市場をどう見ていますか',
      '学生時代に最も誇れる成果は何ですか',
    ]),
    myAnswers: JSON.stringify([
      'HRテック×SaaSのプロダクトマーケティングに強く惹かれています。ONE/ABABAでの経験を活かしてSora Healthのプロダクト成長に貢献したい。',
      '中小企業のデジタル化が遅れている領域で最大のチャンスがある。HRデータの活用による採用・組織最適化市場は今後5年で数倍になると見ています。',
      'ABABAでのSEO施策で月間5万PVのオーガニック流入増加を達成。データ分析・仮説立案・実行の一連のプロセスを独力で回した経験が最も誇れます。',
    ]),
    feedback: 'プロダクトへの理解が深い。マーケ経験がある学生は珍しく、期待できる。',
    rating: 4,
    outcome: 'passed',
    nextStepNotes: '二次面接へ',
  },
  // ===== Helix Therapeutics（二次面接） =====
  {
    companyName: 'Helix Therapeutics',
    type: 'behavioral',
    conductedAt: '2026-04-20T11:00:00.000Z',
    duration: 40,
    interviewerName: '採用担当',
    interviewerRole: 'HR',
    questions: JSON.stringify([
      '当社を知ったきっかけは？',
      'ファッションテック業界に興味を持った理由は？',
      'BizDevとして何をしたいですか？',
    ]),
    myAnswers: JSON.stringify([
      'SNS運用でファッション系アカウントを担当していた際に認知。D2C×サステナビリティという組み合わせが刺さった。',
      '消費行動のデータ化と、個人に最適化された体験の提供が今後の小売の鍵だと思っている。その中でHelix Therapeuticsのアプローチが革新的だと感じた。',
      '新規パートナーシップ開拓と既存ブランドとのコラボ企画を担当したい。自分のSNSネットワークと営業経験を活かせると思っている。',
    ]),
    feedback: '情熱と行動力を感じた。もう少し具体的なビジネス提案力を磨いてほしい。',
    rating: 3,
    outcome: 'pending',
    nextStepNotes: '二次面接結果待ち',
  },
];

async function main() {
  console.log('🚀 面接ログ追加開始...\n');
  let added = 0;

  for (const log of interviewLogs) {
    const companyId = await getCompanyId(log.companyName);
    if (!companyId) {
      console.log(`  ⚠️  企業未登録: ${log.companyName}`);
      continue;
    }

    const id = await getId();
    const questions = log.questions.replace(/'/g, "''");
    const myAnswers = log.myAnswers.replace(/'/g, "''");
    const feedback = (log.feedback ?? '').replace(/'/g, "''");
    const interviewerName = (log.interviewerName ?? '').replace(/'/g, "''");
    const interviewerRole = (log.interviewerRole ?? '').replace(/'/g, "''");
    const nextStepNotes = (log.nextStepNotes ?? '').replace(/'/g, "''");

    await client.execute(
      `INSERT INTO InterviewLog (id, companyId, type, conductedAt, duration, interviewerName, interviewerRole, questions, myAnswers, feedback, rating, outcome, nextStepNotes, createdAt, updatedAt)
       VALUES ('${id}', '${companyId}', '${log.type}', '${log.conductedAt}', ${log.duration}, '${interviewerName}', '${interviewerRole}', '${questions}', '${myAnswers}', '${feedback}', ${log.rating}, '${log.outcome}', '${nextStepNotes}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    );
    added++;
    console.log(`  ✅ ${log.companyName} [${log.type}] ${log.outcome}`);
  }

  console.log(`\n🎉 面接ログ追加完了: ${added}件`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
