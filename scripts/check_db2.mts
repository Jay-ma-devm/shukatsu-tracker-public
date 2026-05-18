import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
});

const tasks = await client.execute("SELECT title, status, dueAt FROM Task WHERE userId='local-user' ORDER BY dueAt ASC LIMIT 20");
console.log('=== Tasks ===');
tasks.rows.forEach(r => console.log(`  [${r.status}] ${r.title} - due: ${r.dueAt}`));

const events = await client.execute("SELECT title, type, startAt FROM Event ORDER BY startAt ASC LIMIT 20");
console.log('\n=== Events ===');
events.rows.forEach(r => console.log(`  [${r.type}] ${r.title} - ${r.startAt}`));
