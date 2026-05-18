import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
// 旧シードのPivot Studioケース面接イベント（重複）を整理
await client.execute("UPDATE Event SET completed=1 WHERE title='Pivot Studio 3daysインターン' AND type='case_interview'");
console.log('✅ 旧Pivot Studio 3daysインターン（case_interview）をcompleted=1に修正');
// 確認
const plex = await client.execute("SELECT id FROM Company WHERE userId='local-user' AND name='Pivot Studio'");
const events = await client.execute(`SELECT title, type, startAt, completed FROM Event WHERE companyId='${plex.rows[0].id}' ORDER BY startAt`);
console.log('Pivot Studio events:');
events.rows.forEach(r => console.log(`  [${r.completed ? '✅' : '📅'}] [${r.type}] ${r.title}`));
