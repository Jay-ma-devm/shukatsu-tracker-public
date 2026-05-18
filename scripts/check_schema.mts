import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const eventCols = await client.execute("PRAGMA table_info(Event)");
console.log('Event columns:', eventCols.rows.map(r => `${r.name}(${r.type})`).join(', '));
const taskCols = await client.execute("PRAGMA table_info(Task)");
console.log('Task columns:', taskCols.rows.map(r => `${r.name}(${r.type})`).join(', '));
