import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
// final/offer/acceptedの企業を確認
const finals = await client.execute(
  `SELECT name, status, priority, notes FROM Company WHERE userId='local-user' AND status IN ('final', 'offer', 'accepted') ORDER BY status, priority DESC`
);
console.log('最終段階企業:');
finals.rows.forEach(r => console.log(`  [${r.status}] p${r.priority} ${r.name}: ${(r.notes as string)?.substring(0, 80)}`));

// Pivot Studioのステージ確認
const plexStages = await client.execute(
  `SELECT s.name, s.status, s.scheduledAt FROM Stage s JOIN Company c ON s.companyId=c.id WHERE c.name='Pivot Studio' ORDER BY s."order"`
);
console.log('\nPlex 選考ステージ:');
plexStages.rows.forEach(r => console.log(`  [${r.status}] ${r.name} - ${r.scheduledAt}`));
