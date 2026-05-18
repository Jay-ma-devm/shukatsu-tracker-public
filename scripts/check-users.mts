import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
const users = await client.execute("SELECT id, name, email, createdAt FROM User ORDER BY createdAt DESC");
console.log('全ユーザー:', JSON.stringify(users.rows, null, 2));
// Userテーブルのスキーマ確認
const cols = await client.execute("PRAGMA table_info(User)");
console.log('User cols:', cols.rows.map(r => r.name).join(', '));
