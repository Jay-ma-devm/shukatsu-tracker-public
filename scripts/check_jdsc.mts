import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
const events = await client.execute(
  `SELECT e.title, e.type, e.startAt, e.completed FROM Event e 
   JOIN Company c ON e.companyId=c.id WHERE c.name='Northstar Bank' ORDER BY e.startAt`
);
console.log('Northstar Bank events:');
events.rows.forEach(r => console.log(`  [${r.completed ? '✅' : '📅'}] ${r.title} - ${r.startAt}`));

// 旧シードの誤ったNorthstar Bankイベントをcompletedにマーク
await client.execute("UPDATE Event SET completed=1 WHERE title='Northstar Bank インターン初日'");
console.log('✅ 旧Northstar Bank インターン初日（5/16）をcompleted=1に更新（5/23-24が正しい日程）');
