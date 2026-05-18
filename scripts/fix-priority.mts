import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
// priority文字列を数値に修正
await client.execute("UPDATE Task SET priority=5 WHERE priority='urgent'");
await client.execute("UPDATE Task SET priority=4 WHERE priority='high'");
await client.execute("UPDATE Task SET priority=3 WHERE priority='medium'");
await client.execute("UPDATE Task SET priority=2 WHERE priority='low'");
const tasks = await client.execute("SELECT title, priority FROM Task WHERE userId='local-user' ORDER BY priority DESC");
console.log('Fixed priorities:');
tasks.rows.forEach(r => console.log(`  p${r.priority} ${r.title}`));
