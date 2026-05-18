import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
// 古いシードのPivot Studioステージを削除（書類選考・インターン）
await client.execute("DELETE FROM Stage WHERE id='cmp3e1d2p0008ric9l8iel56v'"); // 書類選考
await client.execute("DELETE FROM Stage WHERE id='cmp3e1d480009ric9jpsux2u9'"); // インターン
console.log('✅ 古いPivot Studioステージを削除');
// 確認
const plexId = await client.execute("SELECT id FROM Company WHERE userId='local-user' AND name='Pivot Studio'");
const stages = await client.execute(`SELECT "order", name, status, scheduledAt FROM Stage WHERE companyId='${plexId.rows[0].id}' ORDER BY "order"`);
console.log('Pivot Studio stages（整理後）:');
stages.rows.forEach(r => console.log(`  ${r.order}: [${r.status}] ${r.name}`));
