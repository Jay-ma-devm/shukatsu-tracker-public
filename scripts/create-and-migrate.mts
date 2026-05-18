import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });

const GOOGLE_EMAIL = 'demo@example.com';
const GOOGLE_NAME = 'Demo User';
const LOCAL_USER_ID = 'local-user';

// 新しいユーザーIDを生成
const newId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10)}`;

console.log(`新しいユーザーID: ${newId}`);

// Googleアカウントユーザーを作成
await client.execute(
  `INSERT OR IGNORE INTO User (id, name, email, createdAt, updatedAt)
   VALUES ('${newId}', '${GOOGLE_NAME}', '${GOOGLE_EMAIL}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
);
console.log(`✅ ユーザー作成: ${GOOGLE_EMAIL}`);

// 全テーブルのuserIdをlocal-user→新IDに更新
const tables = ['Company', 'Task', 'Note', 'CaseLog', 'CareerEntry', 'EmailTemplate', 'Meeting'];
for (const table of tables) {
  const r = await client.execute(
    `UPDATE ${table} SET userId='${newId}' WHERE userId='${LOCAL_USER_ID}'`
  );
  console.log(`  ✅ ${table}: ${r.rowsAffected}件移行`);
}

// 確認
const companies = await client.execute(`SELECT COUNT(*) as c FROM Company WHERE userId='${newId}'`);
const tasks = await client.execute(`SELECT COUNT(*) as c FROM Task WHERE userId='${newId}'`);
const notes = await client.execute(`SELECT COUNT(*) as c FROM Note WHERE userId='${newId}'`);
console.log(`\n🎉 移行完了！`);
console.log(`   企業: ${companies.rows[0].c}社`);
console.log(`   タスク: ${tasks.rows[0].c}件`);
console.log(`   ノート: ${notes.rows[0].c}件`);
console.log(`\nこのIDをauth.tsのsignInコールバックで参照するか、`);
console.log(`ブラウザの設定ページでユーザーIDを確認してください: ${newId}`);
