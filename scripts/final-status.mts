import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
const [companies, tasks, events, interviews, cases, notes, es] = await Promise.all([
  client.execute("SELECT COUNT(*) as c FROM Company WHERE userId='local-user'"),
  client.execute("SELECT COUNT(*) as c FROM Task WHERE userId='local-user' AND status='todo'"),
  client.execute("SELECT COUNT(*) as c FROM Event WHERE completed=0 AND startAt > CURRENT_TIMESTAMP"),
  client.execute("SELECT COUNT(*) as c FROM InterviewLog"),
  client.execute("SELECT COUNT(*) as c FROM CaseLog WHERE userId='local-user'"),
  client.execute("SELECT COUNT(*) as c FROM Note WHERE userId='local-user'"),
  client.execute("SELECT COUNT(*) as c FROM EntrySheet"),
]);
console.log(`企業: ${companies.rows[0].c}社 | タスク: ${tasks.rows[0].c}件 | イベント: ${events.rows[0].c}件`);
console.log(`面接ログ: ${interviews.rows[0].c}件 | ケース: ${cases.rows[0].c}件 | ノート: ${notes.rows[0].c}件 | ES: ${es.rows[0].c}件`);
