import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
const NEW_USER = 'cmp5p8zczkb6bbqjt';
const OLD_USER = 'local-user';

// CaseLog, CareerEntry, EmailTemplate をNEW_USERに移行（まだ移行されていないもの）
const tables = ['CaseLog', 'CareerEntry', 'EmailTemplate'];
for (const t of tables) {
  const r = await client.execute(`UPDATE ${t} SET userId='${NEW_USER}' WHERE userId='${OLD_USER}'`);
  if ((r.rowsAffected ?? 0) > 0) console.log(`  ✅ ${t}: ${r.rowsAffected}件移行`);
}

// Note も確認
const noteR = await client.execute(`UPDATE Note SET userId='${NEW_USER}' WHERE userId='${OLD_USER}'`);
if ((noteR.rowsAffected ?? 0) > 0) console.log(`  ✅ Note: ${noteR.rowsAffected}件移行`);

// Meeting も確認
const meetR = await client.execute(`UPDATE Meeting SET userId='${NEW_USER}' WHERE userId='${OLD_USER}'`);
if ((meetR.rowsAffected ?? 0) > 0) console.log(`  ✅ Meeting: ${meetR.rowsAffected}件移行`);

// 最終確認
const [cases, career, templates, notes] = await Promise.all([
  client.execute(`SELECT COUNT(*) as c FROM CaseLog WHERE userId='${NEW_USER}'`),
  client.execute(`SELECT COUNT(*) as c FROM CareerEntry WHERE userId='${NEW_USER}'`),
  client.execute(`SELECT COUNT(*) as c FROM EmailTemplate WHERE userId='${NEW_USER}'`),
  client.execute(`SELECT COUNT(*) as c FROM Note WHERE userId='${NEW_USER}'`),
]);
console.log(`\n✅ 移行後確認:`);
console.log(`  ケース: ${cases.rows[0].c}件 | キャリア: ${career.rows[0].c}件 | テンプレート: ${templates.rows[0].c}件 | ノート: ${notes.rows[0].c}件`);
