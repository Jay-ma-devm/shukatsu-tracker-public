import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
});

const companyCols = await client.execute("PRAGMA table_info(Company)");
console.log('Company columns:', companyCols.rows.map(r => r.name).join(', '));

const taskCols = await client.execute("PRAGMA table_info(Task)");
console.log('Task columns:', taskCols.rows.map(r => r.name).join(', '));

const result = await client.execute("SELECT name, status FROM Company WHERE userId='local-user' ORDER BY status");
console.log('\n=== Companies ===');
result.rows.forEach(r => console.log(`  [${r.status}] ${r.name}`));

const userResult = await client.execute("SELECT id, email FROM User");
console.log('\n=== Users ===');
userResult.rows.forEach(r => console.log(`  ${r.id} ${r.email}`));
