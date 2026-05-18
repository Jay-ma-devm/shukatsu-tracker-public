import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const cols = await client.execute("PRAGMA table_info(EsQuestion)");
console.log('EsQuestion cols:', cols.rows.map(r => r.name).join(', '));
const es = await client.execute("SELECT e.title, e.status, e.deadline, c.name as company FROM EntrySheet e JOIN Company c ON e.companyId=c.id ORDER BY e.deadline");
console.log('\nESes:');
es.rows.forEach(r => console.log(`  [${r.status}] ${r.company}: ${r.title} - 締切:${r.deadline ?? 'なし'}`));
