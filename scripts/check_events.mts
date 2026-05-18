import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const events = await client.execute(
  `SELECT e.title, e.type, e.startAt, c.name as company 
   FROM Event e LEFT JOIN Company c ON e.companyId=c.id
   ORDER BY e.startAt ASC LIMIT 30`
);
console.log('Events:');
events.rows.forEach(r => console.log(`  [${r.type}] ${r.company ?? ''}: ${r.title} - ${r.startAt}`));
console.log(`\nTotal: ${events.rows.length}件`);
