import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const tasks = await client.execute("SELECT title, status, priority, dueAt FROM Task WHERE userId='local-user' ORDER BY dueAt ASC");
console.log('Tasks:');
tasks.rows.forEach(r => console.log(`  [${r.status}] p${r.priority} ${r.title} - ${r.dueAt}`));
console.log(`\nTotal: ${tasks.rows.length}件`);
