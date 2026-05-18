import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const cols = await client.execute("PRAGMA table_info(InterviewLog)");
console.log('InterviewLog columns:', cols.rows.map(r => `${r.name}(${r.type})`).join(', '));
const logs = await client.execute("SELECT COUNT(*) as count FROM InterviewLog");
console.log('InterviewLog count:', logs.rows[0].count);
