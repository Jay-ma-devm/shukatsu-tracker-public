import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const tables = ['EntrySheet', 'CareerEntry', 'EmailTemplate', 'CaseLog', 'Stage', 'Meeting'];
for (const t of tables) {
  const cols = await client.execute(`PRAGMA table_info(${t})`);
  console.log(`${t}: ${cols.rows.map(r => r.name).join(', ')}`);
}
