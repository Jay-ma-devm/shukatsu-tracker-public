/**
 * ケース面接練習ログを Turso に追加
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

const caseLogs = [
  {
    companyName: 'Pivot Studio',
    title: '製造業SaaS市場の市場規模推定',
    category: 'market_sizing',
    prompt: '日本の製造業向けSaaS市場の規模を推定してください。',
    premise: '日本の製造業事業所数、ITへの投資意欲、既存ERPからの移行率を考慮する',
    structure: '①市場の定義→②ターゲット企業数の推定→③単価の推定→④市場規模計算→⑤成長率の考察',
    analysis: '日本の製造業事業所数：約30万社（従業員10人以上）/ SaaS化率：現在5%→5年後20%想定 / 平均ARR：100万円（中小）〜500万円（大企業） / 現市場規模：30万×5%×平均200万円 = 3000億円 / 5年後：30万×20%×平均300万円 = 1.8兆円',
    conclusion: '現在3000億円、5年後1.8兆円規模。DX化の波と政府のデジタル化支援で急成長が期待される。Pivot Studioが得意とするニッチ製造業（金属・精密）では特に競合が少なく、シェア10%でも1800億円の機会がある。',
    feedback: '数字の根拠が明確で説得力がある。ただし、既存のERPベンダー（SAP等）のSaaS移行競合を考慮すべきだった。',
    rating: 4,
    difficulty: 3,
    duration: 30,
    practiceWith: 'solo',
    tags: '市場規模,SaaS,製造業',
  },
  {
    companyName: 'Northstar Bank',
    title: 'AIを活用した物流最適化戦略の立案',
    category: 'strategy',
    prompt: 'AIを活用して物流コストを30%削減するための戦略を提案してください。',
    premise: '物流会社のドライバー不足、燃料費高騰、配送効率化が課題',
    structure: '①現状課題の整理→②AI活用の優先順位付け→③施策の具体化→④KPI設定→⑤実行ロードマップ',
    analysis: '優先施策3つ：(1)需要予測AIによる積載率向上（現60%→85%、コスト15%削減）(2)ルート最適化AIで走行距離削減（10%削減）(3)倉庫内ピッキングロボット×AI（人件費5%削減）。3施策合計で約30%コスト削減が実現可能。',
    conclusion: 'AI×物流は積載率改善とルート最適化が最も即効性が高い。12ヶ月で投資回収可能。特にNorthstar Bankのデータ解析強みを活かせる領域。',
    feedback: '論理構成が明快。施策の優先順位付け理由がもう少し詳しいと完璧。実現可能性の検証が弱い。',
    rating: 4,
    difficulty: 4,
    duration: 40,
    practiceWith: 'solo',
    tags: 'AI戦略,物流,コスト削減',
  },
  {
    companyName: 'Sora Health',
    title: 'HRSaaS企業のユーザー数10倍成長戦略',
    category: 'growth',
    prompt: 'Sora Healthが5年でユーザー数を10倍にするための戦略を提案してください。',
    premise: '現在中小〜中堅企業がメインターゲット。大企業への展開と海外展開が課題。',
    structure: '①現状ユーザー分析→②成長ドライバーの特定→③攻める市場の優先順位→④施策の具体化→⑤財務インパクト',
    analysis: '3つの成長ドライバー：(1)プロダクト拡張（給与・採用・評価など隣接機能の追加）でクロスセル率50%向上 (2)大企業攻略（1000社→10000社）でARR10倍 (3)東南アジア進出（シンガポール・インドネシア）で新市場開拓。最重要は大企業向けカスタマイズ機能の強化。',
    conclusion: '5年10倍は大企業攻略（ARR単価10倍）とプロダクト拡張（解約率低下）の2軸で実現可能。HR領域のプラットフォームとなることが長期的な護城河。',
    feedback: 'プロダクト思考と事業戦略の掛け合わせが良い。財務モデルの詳細があるとより説得力が増す。',
    rating: 5,
    difficulty: 4,
    duration: 45,
    practiceWith: 'solo',
    tags: '成長戦略,SaaS,HR',
  },
  {
    companyName: null,
    title: 'コンサル志望者向け：日本のコーヒーチェーン店数推定',
    category: 'market_sizing',
    prompt: '日本のコーヒーチェーン店の総店舗数を推定してください。',
    premise: '定義：全国展開している主要コーヒーチェーン（スタバ・ドトール・コメダ等）の合計',
    structure: '需要サイド：日本人口×コーヒーを飲む割合×1日の来店頻度÷1店舗の1日の顧客数',
    analysis: '人口：1.2億人 / コーヒー飲用率：70% = 8400万人 / 週1回チェーン利用：30% = 2520万人 / 年間2520万人×52回 / 1店舗の年間来店客数：平均300人/日×365日 = 10万9500人 / 推定店舗数：2520万人×52÷109500 ≒ 約12000店',
    conclusion: '約1.2万店と推定。実際のスタバ（1700店）、ドトール（1100店）、コメダ（950店）などを合計すると約6000-8000店が主要チェーンの実態。推定値は上振れしたが、カフェ全体（個人経営含む）なら25000店程度も納得感あり。',
    feedback: '思考の筋道は明確。最初に定義を確認することが重要（チェーン限定か全カフェか）。数字の感度分析があると良い。',
    rating: 3,
    difficulty: 2,
    duration: 20,
    practiceWith: 'solo',
    tags: 'フェルミ推定,コーヒー,市場規模',
  },
  {
    companyName: 'デロイト トーマツ コンサルティング',
    title: 'デロイト対策：日本の小売業DX化戦略',
    category: 'strategy',
    prompt: '日本の大手小売業（百貨店・GMSなど）のDX戦略を提案してください。',
    premise: 'コロナ後の購買行動変化、EC台頭、人口減少による来店客数減を背景に',
    structure: '①現状分析（内部・外部）→②DXの優先領域→③具体的施策→④実行体制→⑤KPI',
    analysis: 'DX優先3領域：(1)顧客データ統合・パーソナライズ（購買履歴×来店データ）でリピート率20%改善 (2)在庫最適化AIで廃棄ロス30%削減 (3)デジタル接客（AR試着・QR決済）で顧客体験向上。特に顧客データの一元管理が最重要課題。',
    conclusion: 'DXは単なるIT化ではなく事業変革。顧客の購買データを軸に、オムニチャネル体験の構築が小売DXの核心。投資回収は3-5年を想定。',
    feedback: '業界の本質的な課題を捉えている。コンサルの提案として「なぜ今できていないか」（既存システムのサイロ化、組織変革の壁）の考察があると深みが増す。',
    rating: 4,
    difficulty: 4,
    duration: 40,
    practiceWith: 'solo',
    tags: 'DX戦略,小売,デジタル変革',
  },
];

async function main() {
  console.log('🚀 ケース練習ログ追加開始...\n');
  let added = 0;

  for (const log of caseLogs) {
    const id = await getId();
    const companyId = log.companyName ? await getCompanyId(log.companyName) : null;

    const fields = ['id', 'userId', 'title', 'category', 'prompt', 'premise', 'structure', 'analysis', 'conclusion', 'feedback', 'rating', 'difficulty', 'duration', 'practiceWith', 'tags', 'createdAt', 'updatedAt'];
    const esc = (s: string) => s.replace(/'/g, "''");

    const companyIdVal = companyId ? `'${companyId}'` : 'NULL';

    await client.execute(
      `INSERT INTO CaseLog (id, userId, companyId, title, category, prompt, premise, structure, analysis, conclusion, feedback, rating, difficulty, duration, practiceWith, tags, createdAt, updatedAt)
       VALUES ('${id}', 'local-user', ${companyIdVal}, '${esc(log.title)}', '${log.category}', '${esc(log.prompt)}', '${esc(log.premise)}', '${esc(log.structure)}', '${esc(log.analysis)}', '${esc(log.conclusion)}', '${esc(log.feedback)}', ${log.rating}, ${log.difficulty}, ${log.duration}, '${log.practiceWith}', '${log.tags}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    );
    added++;
    console.log(`  ✅ ${log.companyName ?? '汎用'}: ${log.title}`);
  }

  const total = await client.execute("SELECT COUNT(*) as count FROM CaseLog WHERE userId='local-user'");
  console.log(`\n🎉 ケース練習ログ: ${added}件追加（合計${total.rows[0].count}件）`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
