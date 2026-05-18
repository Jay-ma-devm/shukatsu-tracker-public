import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const tables = ['User', 'Account', 'Session', 'VerificationToken'];
for (const t of tables) {
  const r = await client.execute(`PRAGMA table_info(${t})`);
  console.log(`${t}: ${r.rows.length > 0 ? '✅ exists' : '❌ MISSING'}`);
}
