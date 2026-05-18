import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const logs = await client.execute("SELECT title, category FROM CaseLog WHERE userId='local-user' ORDER BY createdAt");
logs.rows.forEach(r => console.log(`  ${r.category}: ${r.title}`));
