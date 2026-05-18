import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
const USER_ID = 'cmp5p8zczkb6bbqjt';

async function getId() {
  await new Promise(r => setTimeout(r, 2));
  return `c${Date.now().toString(36)}${Math.random().toString(36).substring(2,10)}`;
}

// P&G Japan を追加（選考中）
const pgExists = await client.execute(`SELECT id FROM Company WHERE userId='${USER_ID}' AND name LIKE '%P&G%'`);
if (pgExists.rows.length === 0) {
  const id = await getId();
  await client.execute(
    `INSERT INTO Company (id, userId, name, industry, position, status, priority, starred, notes, createdAt, updatedAt)
     VALUES ('${id}', '${USER_ID}', 'P&G Japan', 'FMCG/グローバル', '総合職（Marketing/Sales/Finance等）', 'screening', 4, 0, 'オンラインテスト合格！Function Collaboration Session（5/20, 5/27, 6/10等）参加→本選考。P&Gはグローバル最大手FMCG企業。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  
  // イベント: 5/20 Function Collaboration Session（STEM Career）
  const ev1 = await getId();
  await client.execute(
    `INSERT INTO Event (id, companyId, title, type, startAt, endAt, notes, createdAt)
     VALUES ('${ev1}', '${id}', 'P&G Function Collaboration Session（STEM Career）', 'info_session', '2026-05-20T09:00:00.000Z', '2026-05-20T10:00:00.000Z', '18:00-19:00。PS, IT, R&D部門が登壇。カメラオフ・ミュート参加可。', CURRENT_TIMESTAMP)`
  );
  
  // 5/27
  const ev2 = await getId();
  await client.execute(
    `INSERT INTO Event (id, companyId, title, type, startAt, endAt, notes, createdAt)
     VALUES ('${ev2}', '${id}', 'P&G Function Collaboration Session（Corporate Functions Leadership）', 'info_session', '2026-05-27T03:00:00.000Z', '2026-05-27T04:00:00.000Z', '12:00-13:00。HR, F&A部門が登壇。', CURRENT_TIMESTAMP)`
  );

  // 6/10
  const ev3 = await getId();
  await client.execute(
    `INSERT INTO Event (id, companyId, title, type, startAt, endAt, notes, createdAt)
     VALUES ('${ev3}', '${id}', 'P&G Function Collaboration Session（第4回）', 'info_session', '2026-06-10T09:00:00.000Z', '2026-06-10T10:00:00.000Z', '18:00-19:00。URL後日連絡予定。', CURRENT_TIMESTAMP)`
  );

  console.log('✅ P&G Japan追加（screening・イベント3件）');
}

// 大和総研を追加（書類選考結果未確認）
const daiwaExists = await client.execute(`SELECT id FROM Company WHERE userId='${USER_ID}' AND name LIKE '%大和総研%'`);
if (daiwaExists.rows.length === 0) {
  const id = await getId();
  await client.execute(
    `INSERT INTO Company (id, userId, name, industry, position, status, priority, starred, notes, createdAt, updatedAt)
     VALUES ('${id}', '${USER_ID}', '大和総研', '金融/ITコンサルティング', 'ITソリューション業務体験(5Days)', 'applied', 2, 0, '書類選考結果メール着信（5/15）。マイページで結果確認が必要。大和証券グループ系シンクタンク。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  
  const taskId = await getId();
  await client.execute(
    `INSERT INTO Task (id, userId, companyId, title, description, status, priority, dueAt, createdAt, updatedAt)
     VALUES ('${taskId}', '${USER_ID}', '${id}', '大和総研 書類選考結果をマイページで確認', 'axol.jp/zw/s/dirg_28/mypage/login にログインして結果確認。ITソリューション業務体験(5Days)の結果。', 'todo', 3, '2026-05-17T14:59:00.000Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  
  console.log('✅ 大和総研追加（書類選考結果確認タスク付き）');
}

const total = await client.execute(`SELECT COUNT(*) as c FROM Company WHERE userId='${USER_ID}'`);
const events = await client.execute(`SELECT COUNT(*) as c FROM Event WHERE completed=0 AND startAt > CURRENT_TIMESTAMP`);
console.log(`\n🎉 完了！総企業: ${total.rows[0].c}社 / アクティブイベント: ${events.rows[0].c}件`);
