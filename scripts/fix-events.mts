import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
// Sora Health ES締切イベントに企業IDを設定
const smartHR = await client.execute("SELECT id FROM Company WHERE userId='local-user' AND name='Sora Health'");
if (smartHR.rows.length > 0) {
  const smartHRId = smartHR.rows[0].id;
  await client.execute(`UPDATE Event SET companyId='${smartHRId}', completed=1 WHERE title='Sora Health ES締切'`);
  console.log('✅ Sora Health ES締切イベント → completed, companyId設定');
}
// Lumen Robotics最終面接は完了済みにマーク
const tential = await client.execute("SELECT id FROM Company WHERE userId='local-user' AND name='Lumen Robotics'");
if (tential.rows.length > 0) {
  await client.execute(`UPDATE Event SET completed=1 WHERE companyId='${tential.rows[0].id}' AND title='Lumen Robotics 最終面接'`);
  console.log('✅ Lumen Robotics最終面接 → completed');
}
// Pivot Studio 3daysインターン（古いcase_interviewイベント）も完了にマーク
const plex = await client.execute("SELECT id FROM Company WHERE userId='local-user' AND name='Pivot Studio'");
if (plex.rows.length > 0) {
  await client.execute(`UPDATE Event SET completed=0 WHERE companyId='${plex.rows[0].id}' AND type='interview'`);
  console.log('✅ Pivot Studio インターン Day1-3 → active');
}
const count = await client.execute("SELECT COUNT(*) as count FROM Event WHERE completed=0");
console.log(`\nActive events: ${count.rows[0].count}件`);
