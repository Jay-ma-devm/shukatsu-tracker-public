/**
 * 前セッションで言及された追加企業を投入
 */
import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });

const existing = await client.execute("SELECT name FROM Company WHERE userId='local-user'");
const existingNames = new Set(existing.rows.map(r => r.name as string));

async function getId(): Promise<string> {
  await new Promise(r => setTimeout(r, 2));
  return `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10)}`;
}

const companies = [
  // HR-tech / Startup
  { name: 'タイミー', industry: 'HR-tech', position: '総合職', status: 'applied', priority: 3, notes: 'スキマバイトプラットフォーム。急成長スタートアップ。エントリー検討中。' },
  { name: 'ログラス', industry: 'SaaS/クラウド会計', position: '総合職', status: 'applied', priority: 3, notes: 'SaaS型予算管理ツール。B2B SaaS急成長企業。PMM/BizDev希望。' },
  { name: 'マネーフォワード', industry: 'FinTech/SaaS', position: '総合職（ビジネス）', status: 'applied', priority: 3, notes: 'マネーフォワード クラウド。会計・HR SaaS。内定直結インターン候補。' },
  { name: 'FreakOut（フリークアウト）', industry: 'AdTech', position: 'ビジネス職', status: 'applied', priority: 2, notes: 'DSP・プログラマティック広告。広告テック企業。ONE株式会社の業務知識が活かせる。' },
  // コンサル追加
  { name: 'オリバー・ワイマン', industry: 'コンサルティング', position: '新卒コンサルタント', status: 'applied', priority: 3, notes: '金融特化の戦略コンサルティングファーム。MBBに次ぐ最難関の一つ。' },
  { name: 'アクセンチュア（戦略）', industry: 'コンサルティング', position: 'Strategy Consultant', status: 'applied', priority: 3, notes: 'アクセンチュアの中でも戦略部門（Strategy）。BCGと競合するケース多い。' },
  { name: 'ローランド・ベルガー', industry: 'コンサルティング', position: 'ジュニアコンサルタント', status: 'applied', priority: 2, notes: 'ドイツ系戦略コンサル。日本では自動車・製造業に強み。' },
  // 金融
  { name: '三井住友フィナンシャルグループ（SMFG）', industry: '金融', position: 'DX・デジタルコース', status: 'applied', priority: 2, notes: 'メガバンクDX部門。デジタル・DX新卒採用。' },
  // IT
  { name: 'Sansan株式会社', industry: 'SaaS/B2B', position: 'ビジネス職', status: 'applied', priority: 3, notes: '名刺管理→Bill One（請求書管理）など。BizDev、インサイドセールス希望。' },
  // 広告追加
  { name: 'CARTA HOLDINGS', industry: '広告/マーケティング', position: 'ビジネス職', status: 'applied', priority: 2, notes: 'アドテク・デジタルマーケティング。ONE株式会社の業界知識が活かせる。' },
  // 採用済みだが既に就活の視点でも研究
  { name: 'ユーザベース（SPEEDA/FORCAS）', industry: 'B2B SaaS', position: '総合職', status: 'applied', priority: 3, notes: 'SPEEDA（経済情報プラットフォーム）。コンサル・証券向けリサーチツール。' },
  // 不採用記録
  { name: '電通デジタル', industry: '広告/デジタル', position: 'ビジネス職', status: 'rejected', priority: 2, notes: '書類選考不採用。' },
  { name: 'サイバーエージェント', industry: 'IT/広告', position: '総合職', status: 'rejected', priority: 2, notes: 'Abema・Ameba・アドテク。書類選考不採用。' },
  { name: 'オールアバウト', industry: 'メディア/広告', position: 'ビジネス職', status: 'withdrawn', priority: 1, notes: '情報メディア運営。辞退（志望度が下がった）。' },
];

let added = 0;
for (const c of companies) {
  if (existingNames.has(c.name)) {
    console.log(`  ⏭️  スキップ: ${c.name}`);
    continue;
  }
  const id = await getId();
  const notes = (c.notes ?? '').replace(/'/g, "''");
  await client.execute(
    `INSERT INTO Company (id, userId, name, industry, position, status, priority, starred, notes, createdAt, updatedAt)
     VALUES ('${id}', 'local-user', '${c.name.replace(/'/g, "''")}', '${c.industry}', '${c.position}', '${c.status}', ${c.priority}, 0, '${notes}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  added++;
  console.log(`  ✅ [${c.status}] ${c.name}`);
}

const total = await client.execute("SELECT COUNT(*) as count FROM Company WHERE userId='local-user'");
console.log(`\n🎉 追加: ${added}社（合計${total.rows[0].count}社）`);
