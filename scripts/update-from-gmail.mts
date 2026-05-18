import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
const USER_ID = 'cmp5p8zczkb6bbqjt'; // 舜さんの実際のユーザーID

async function getId() {
  await new Promise(r => setTimeout(r, 2));
  return `c${Date.now().toString(36)}${Math.random().toString(36).substring(2,10)}`;
}
async function getCompanyId(name: string) {
  const r = await client.execute(`SELECT id FROM Company WHERE userId='${USER_ID}' AND name LIKE '%${name.replace(/'/g,"''")}%'`);
  return r.rows.length > 0 ? r.rows[0].id as string : null;
}

console.log('Gmail/Calendar情報からDBを更新...\n');

// 1. PwCコンサルティング（ITSC）を新企業として追加
const itscExists = await client.execute(`SELECT id FROM Company WHERE userId='${USER_ID}' AND name LIKE '%ITSC%'`);
if (itscExists.rows.length === 0) {
  const id = await getId();
  await client.execute(
    `INSERT INTO Company (id, userId, name, industry, position, status, priority, starred, notes, createdAt, updatedAt)
     VALUES ('${id}', '${USER_ID}', 'PwCコンサルティング（ITSC）', 'コンサルティング', 'ITソリューションコンサルタント（ITSC）', 'applied', 3, 0, 'Summer Internship エントリー締切5/17 23:59。PwCのIT特化コース。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  // イベント追加
  const evId = await getId();
  await client.execute(
    `INSERT INTO Event (id, companyId, title, type, startAt, createdAt)
     VALUES ('${evId}', '${id}', 'Summer Internship エントリー締切', 'deadline', '2026-05-17T14:59:00.000Z', CURRENT_TIMESTAMP)`
  );
  // タスク追加
  const taskId = await getId();
  await client.execute(
    `INSERT INTO Task (id, userId, companyId, title, description, status, priority, dueAt, createdAt, updatedAt)
     VALUES ('${taskId}', '${USER_ID}', '${id}', 'PwCコンサルティング（ITSC）ES提出（5/17締切）', 'ITソリューションコンサルタント職のSummer InternshipES。締切5/17 23:59。PwCBC ESとは別。', 'todo', 5, '2026-05-17T14:59:00.000Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  console.log('✅ PwCコンサルティング（ITSC）追加');
}

// 2. カオナビを追加
const kaonabi = await client.execute(`SELECT id FROM Company WHERE userId='${USER_ID}' AND name LIKE '%カオナビ%'`);
if (kaonabi.rows.length === 0) {
  const id = await getId();
  await client.execute(
    `INSERT INTO Company (id, userId, name, industry, position, status, priority, starred, notes, createdAt, updatedAt)
     VALUES ('${id}', '${USER_ID}', 'カオナビ', 'HR-tech/SaaS', '内定直結選抜型1dayインターン', 'applied', 3, 0, 'iroots経由スカウト。内定直結選抜型1dayインターン。タレントマネジメントSaaSシェアNo.1。期限明日（5/17）。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  const taskId = await getId();
  await client.execute(
    `INSERT INTO Task (id, userId, companyId, title, status, priority, dueAt, createdAt, updatedAt)
     VALUES ('${taskId}', '${USER_ID}', '${id}', 'カオナビ スカウト回答（iroots・明日期限）', 'todo', 4, '2026-05-17T14:59:00.000Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  console.log('✅ カオナビ追加');
}

// 3. Philip Morris Japan を追加
const pmj = await client.execute(`SELECT id FROM Company WHERE userId='${USER_ID}' AND name LIKE '%Philip%'`);
if (pmj.rows.length === 0) {
  const id = await getId();
  await client.execute(
    `INSERT INTO Company (id, userId, name, industry, position, status, priority, starred, notes, createdAt, updatedAt)
     VALUES ('${id}', '${USER_ID}', 'Philip Morris Japan', 'FMCG/グローバル', '本選考直結サマーインターン', 'applied', 3, 0, 'キャリタスダイレクト経由スカウト。本選考直結サマーインターン。グローバル・インターナショナルな環境。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  console.log('✅ Philip Morris Japan追加');
}

// 4. 日本TCS Talk Liveイベント追加
const tcsId = await getCompanyId('日本TCS');
if (tcsId) {
  const existEv = await client.execute(`SELECT id FROM Event WHERE companyId='${tcsId}' AND title LIKE '%Talk Live%'`);
  if (existEv.rows.length === 0) {
    const evId = await getId();
    await client.execute(
      `INSERT INTO Event (id, companyId, title, type, startAt, notes, createdAt)
       VALUES ('${evId}', '${tcsId}', 'TCS Talk Live（現場社員トークイベント）', 'info_session', '2026-05-25T09:00:00.000Z', '現場社員との座談会。参加して社風を確認する。', CURRENT_TIMESTAMP)`
    );
    console.log('✅ 日本TCS Talk Liveイベント追加');
  }
}

// 5. ワンキャリア面談のMeet URLをイベントのnotesに更新
const wcId = await getCompanyId('ワンキャリア');
if (wcId) {
  await client.execute(
    `UPDATE Event SET notes='Google Meet: https://meet.google.com/ped-bhmd-nzf（12:00-12:30）宿題：4Pで就活軸を言語化' WHERE companyId='${wcId}' AND title LIKE '%人事面談%'`
  );
  console.log('✅ ワンキャリア面談のMeet URL更新');
}

// 6. ネットプロテクションズを追加
const npc = await client.execute(`SELECT id FROM Company WHERE userId='${USER_ID}' AND name LIKE '%ネットプロテクション%'`);
if (npc.rows.length === 0) {
  const id = await getId();
  await client.execute(
    `INSERT INTO Company (id, userId, name, industry, position, status, priority, starred, notes, createdAt, updatedAt)
     VALUES ('${id}', '${USER_ID}', 'ネットプロテクションズ', '金融/FinTech', '事業企画インターン（1day）', 'applied', 2, 0, 'iroots経由スカウト。金融×ベンチャー。BNPL（後払い）サービス。スカウト期限明日（5/17）。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  console.log('✅ ネットプロテクションズ追加');
}

// 最終確認
const total = await client.execute(`SELECT COUNT(*) as c FROM Company WHERE userId='${USER_ID}'`);
const tasks = await client.execute(`SELECT COUNT(*) as c FROM Task WHERE userId='${USER_ID}' AND status='todo'`);
console.log(`\n🎉 DB更新完了！企業${total.rows[0].c}社 / タスク${tasks.rows[0].c}件`);
