import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const esCols = await client.execute("PRAGMA table_info(EntrySheet)");
console.log('EntrySheet columns:', esCols.rows.map(r => `${r.name}`).join(', '));
const es = await client.execute("SELECT title, status, deadline FROM EntrySheet LIMIT 10");
console.log('ESes:', JSON.stringify(es.rows, null, 2));
const noteCols = await client.execute("PRAGMA table_info(Note)");
console.log('Note columns:', noteCols.rows.map(r => `${r.name}`).join(', '));
const notes = await client.execute("SELECT title, category FROM Note WHERE userId='local-user' LIMIT 10");
console.log('Notes:', JSON.stringify(notes.rows, null, 2));
