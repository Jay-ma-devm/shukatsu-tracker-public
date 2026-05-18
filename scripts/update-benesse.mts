import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
const USER_ID = 'cmp5p8zczkb6bbqjt';

async function getId() {
  await new Promise(r => setTimeout(r, 2));
  return `c${Date.now().toString(36)}${Math.random().toString(36).substring(2,10)}`;
}

// ベネッセのステータスを interview に更新
const benesse = await client.execute(`SELECT id FROM Company WHERE userId='${USER_ID}' AND name LIKE '%ベネッセ%'`);
if (benesse.rows.length > 0) {
  const id = benesse.rows[0].id as string;
  await client.execute(
    `UPDATE Company SET status='interview', notes='「End-user・企画メソッド」選考通過。6/14（日）開催のワークショップへ参加招待。EdTech×教育産業。', updatedAt=CURRENT_TIMESTAMP WHERE id='${id}'`
  );
  
  // 6/14のイベントを追加
  const evId = await getId();
  await client.execute(
    `INSERT INTO Event (id, companyId, title, type, startAt, notes, createdAt)
     VALUES ('${evId}', '${id}', 'ベネッセ End-user・企画メソッド（選考）', 'case_interview', '2026-06-14T00:00:00.000Z', '5月・6月開催分で選考通過。グループワーク形式の選考。', CURRENT_TIMESTAMP)`
  );

  // タスク追加
  const taskId = await getId();
  await client.execute(
    `INSERT INTO Task (id, userId, companyId, title, description, status, priority, dueAt, createdAt, updatedAt)
     VALUES ('${taskId}', '${USER_ID}', '${id}', 'ベネッセ End-user・企画メソッド 参加確定（6/14）', '選考通過。メールの重要なご連絡事項を確認して必要な対応をする。', 'todo', 4, '2026-06-14T00:00:00.000Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  
  console.log('✅ ベネッセ: screening → interview + 6/14イベント追加');
}

// 令和トラベルの状況確認（謝罪メールを送ったか？）
const reiwa = await client.execute(`SELECT id, status, notes FROM Company WHERE userId='${USER_ID}' AND name='令和トラベル'`);
if (reiwa.rows.length > 0) {
  console.log(`令和トラベル現状: [${reiwa.rows[0].status}] ${(reiwa.rows[0].notes as string)?.substring(0,80)}`);
}

const total = await client.execute(`SELECT COUNT(*) as c FROM Company WHERE userId='${USER_ID}' AND status='interview'`);
console.log(`\n🎉 完了！面接中: ${total.rows[0].c}社`);
