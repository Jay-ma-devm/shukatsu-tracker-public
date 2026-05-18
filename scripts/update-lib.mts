import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
const USER_ID = 'cmp5p8zczkb6bbqjt';
async function getId() { await new Promise(r => setTimeout(r, 2)); return `c${Date.now().toString(36)}${Math.random().toString(36).substring(2,10)}`; }

const lib = await client.execute(`SELECT id FROM Company WHERE userId='${USER_ID}' AND name LIKE '%リブ%'`);
if (lib.rows.length === 0) {
  const id = await getId();
  await client.execute(
    `INSERT INTO Company (id, userId, name, industry, position, status, priority, starred, notes, createdAt, updatedAt)
     VALUES ('${id}', '${USER_ID}', 'リブ・コンサルティング', 'コンサルティング', '新卒コンサルタント', 'screening', 3, 0, 'WEBテスト受検済み。6/11（木）17:00「業界・企業分析セミナー」参加招待あり。独立系コンサル。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  const evId = await getId();
  await client.execute(
    `INSERT INTO Event (id, companyId, title, type, startAt, notes, createdAt)
     VALUES ('${evId}', '${id}', 'リブ・コンサルティング 業界・企業分析セミナー', 'info_session', '2026-06-11T08:00:00.000Z', '満足度98%。17:00-開催。WEBテスト受検者限定招待。', CURRENT_TIMESTAMP)`
  );
  console.log('✅ リブ・コンサルティング追加（screening・6/11セミナー）');
}

// 住商グローバルエレクトロニクス（iroots経由、スカウト期限明日）
const suisho = await client.execute(`SELECT id FROM Company WHERE userId='${USER_ID}' AND name LIKE '%住商%'`);
if (suisho.rows.length === 0) {
  const id = await getId();
  await client.execute(
    `INSERT INTO Company (id, userId, name, industry, position, status, priority, starred, notes, createdAt, updatedAt)
     VALUES ('${id}', '${USER_ID}', '住商グローバルエレクトロニクス', '電子部品/商社', '春インターン（1day）', 'applied', 2, 0, 'iroots経由スカウト。スカウト期限明日（5/17）。住友商事グループの電子部品商社。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  console.log('✅ 住商グローバルエレクトロニクス追加');
}

const total = await client.execute(`SELECT COUNT(*) as c FROM Company WHERE userId='${USER_ID}'`);
console.log(`🎉 総企業: ${total.rows[0].c}社`);
