import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
const result = await client.execute(
  `SELECT industry, COUNT(*) as count FROM Company WHERE userId='local-user' AND archivedAt IS NULL GROUP BY industry ORDER BY count DESC`
);
console.log('業界別企業数:');
result.rows.forEach(r => console.log(`  ${r.industry || 'その他'}: ${r.count}社`));
