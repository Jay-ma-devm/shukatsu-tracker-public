import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
const USER_ID = 'cmp5p8zczkb6bbqjt';
async function getId() { await new Promise(r => setTimeout(r, 2)); return `c${Date.now().toString(36)}${Math.random().toString(36).substring(2,10)}`; }

// アクセンチュアのIDを取得
const acc = await client.execute(`SELECT id FROM Company WHERE userId='${USER_ID}' AND name LIKE '%Accenture%' OR (userId='${USER_ID}' AND name LIKE '%アクセンチュア%')`);
let accId: string | null = null;
if (acc.rows.length > 0) {
  accId = acc.rows[0].id as string;
  // Accenture（アクセンチュア）にnotesを更新
  await client.execute(
    `UPDATE Company SET notes='戦略コンサル・IT・デザイン等多様なコース。Accenture Strategy(旧XVS)セミナーに参加済み。マイページ登録完了。', updatedAt=CURRENT_TIMESTAMP WHERE id='${accId}'`
  );
}

if (accId) {
  // 5/20 AIアーキテクトセミナー
  const ev1 = await getId();
  const existing1 = await client.execute(`SELECT id FROM Event WHERE companyId='${accId}' AND title LIKE '%AIアーキテクト%'`);
  if (existing1.rows.length === 0) {
    await client.execute(
      `INSERT INTO Event (id, companyId, title, type, startAt, notes, createdAt)
       VALUES ('${ev1}', '${accId}', 'アクセンチュア AIアーキテクト職 セミナー', 'info_session', '2026-05-20T00:00:00.000Z', 'AIアーキテクト職インターン紹介。予約締切確認が必要。', CURRENT_TIMESTAMP)`
    );
    console.log('✅ アクセンチュア 5/20 AIアーキテクトセミナー追加');
  }
  
  // 5/27 Accenture Song Designセミナー
  const ev2 = await getId();
  const existing2 = await client.execute(`SELECT id FROM Event WHERE companyId='${accId}' AND title LIKE '%Song Design%'`);
  if (existing2.rows.length === 0) {
    await client.execute(
      `INSERT INTO Event (id, companyId, title, type, startAt, notes, createdAt)
       VALUES ('${ev2}', '${accId}', 'アクセンチュア Song Design Internship セミナー', 'info_session', '2026-05-27T00:00:00.000Z', 'デザイン職インターン紹介セミナー。予約締切 5/26（火）16時。', CURRENT_TIMESTAMP)`
    );
    console.log('✅ アクセンチュア 5/27 Song Designセミナー追加');
  }
}

console.log('🎉 完了');
