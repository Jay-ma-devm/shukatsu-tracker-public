import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const bcg = await client.execute("SELECT id FROM Company WHERE userId='local-user' AND name='BCG'");
console.log('BCG:', bcg.rows);
if (bcg.rows.length > 0) {
  const id = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2,10)}`;
  await client.execute(
    `INSERT INTO EntrySheet (id, companyId, title, status, deadline, createdAt, updatedAt)
     VALUES ('${id}', '${bcg.rows[0].id}', 'BCG サマーインターン エントリーシート', 'draft', '2026-06-04T22:00:00.000Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  console.log('✅ BCG ES追加');
}
const stageCheck = await client.execute("SELECT COUNT(*) as count FROM Stage");
console.log('Stage count:', stageCheck.rows[0].count);
