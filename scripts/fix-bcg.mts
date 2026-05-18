import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
// BCGはサマーインターンESの締切6/4なので、まだapplied段階
// offerになっているのは誤り
const r = await client.execute("SELECT id, name, status FROM Company WHERE userId='local-user' AND name='BCG'");
console.log('BCG current:', r.rows[0]);
// BCGをappliedに戻す
await client.execute("UPDATE Company SET status='applied', notes='サマーインターン（東京オフィス）エントリー締切6/4。最難関MBBコンサル。BCGが第一志望。ES準備中。' WHERE userId='local-user' AND name='BCG'");
console.log('✅ BCG → applied に更新');

// Verdant Foods確認
const dena = await client.execute("SELECT name, status FROM Company WHERE userId='local-user' AND name='Verdant Foods'");
console.log('Verdant Foods:', dena.rows[0]);
