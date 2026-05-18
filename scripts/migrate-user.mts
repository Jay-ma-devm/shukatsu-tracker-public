/**
 * local-user のデータを実際のGoogleログインユーザーIDに移行する
 * 実行: npx tsx -r dotenv/config scripts/migrate-user.mts dotenv_config_path=.env.local
 */
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const LOCAL_USER_ID = 'local-user';

async function main() {
  // 全ユーザーを確認
  const users = await client.execute("SELECT id, name, email FROM User ORDER BY createdAt DESC");
  console.log('=== 登録済みユーザー ===');
  users.rows.forEach((r, i) => console.log(`  [${i}] id=${r.id} | ${r.name} | ${r.email}`));

  // local-user 以外のユーザーを探す
  const realUsers = users.rows.filter(r => r.id !== LOCAL_USER_ID);
  if (realUsers.length === 0) {
    console.log('\n⚠️  Googleログインしたユーザーがまだいません。先にサインインしてください。');
    return;
  }

  const newUser = realUsers[0]; // 最新のGoogleログインユーザー
  const NEW_USER_ID = newUser.id as string;
  console.log(`\n✅ 移行先ユーザー: ${newUser.name} (${newUser.email})`);
  console.log(`   ID: ${NEW_USER_ID}`);

  // 現在のlocal-userデータ量を確認
  const counts = await Promise.all([
    client.execute(`SELECT COUNT(*) as c FROM Company WHERE userId='${LOCAL_USER_ID}'`),
    client.execute(`SELECT COUNT(*) as c FROM Task WHERE userId='${LOCAL_USER_ID}'`),
    client.execute(`SELECT COUNT(*) as c FROM Note WHERE userId='${LOCAL_USER_ID}'`),
    client.execute(`SELECT COUNT(*) as c FROM CaseLog WHERE userId='${LOCAL_USER_ID}'`),
    client.execute(`SELECT COUNT(*) as c FROM CareerEntry WHERE userId='${LOCAL_USER_ID}'`),
    client.execute(`SELECT COUNT(*) as c FROM EmailTemplate WHERE userId='${LOCAL_USER_ID}'`),
    client.execute(`SELECT COUNT(*) as c FROM Meeting WHERE userId='${LOCAL_USER_ID}'`),
  ]);
  const [companies, tasks, notes, cases, career, templates, meetings] = counts.map(r => r.rows[0].c);
  console.log(`\n移行するデータ: 企業${companies}社 / タスク${tasks}件 / ノート${notes}件 / ケース${cases}件 / キャリア${career}件 / テンプレ${templates}件 / OB訪問${meetings}件`);

  console.log('\n🔄 移行開始...');

  // userId を持つテーブルを全て更新
  const tables = ['Company', 'Task', 'Note', 'CaseLog', 'CareerEntry', 'EmailTemplate', 'Meeting', 'InterviewLog'];
  // InterviewLogはcompany経由なので別途

  for (const table of ['Company', 'Task', 'Note', 'CaseLog', 'CareerEntry', 'EmailTemplate', 'Meeting']) {
    const result = await client.execute(
      `UPDATE ${table} SET userId='${NEW_USER_ID}' WHERE userId='${LOCAL_USER_ID}'`
    );
    console.log(`  ✅ ${table}: ${result.rowsAffected}件更新`);
  }

  // local-user ユーザーレコード自体を削除（新しいUserが既に作成済みなので）
  // ただし、local-userは仮ユーザーなのでUserテーブルにレコードがない場合もある
  const localUserExists = await client.execute(`SELECT id FROM User WHERE id='${LOCAL_USER_ID}'`);
  if (localUserExists.rows.length > 0) {
    await client.execute(`DELETE FROM User WHERE id='${LOCAL_USER_ID}'`);
    console.log('  ✅ local-userレコードを削除');
  }

  // 最終確認
  const finalCompanies = await client.execute(`SELECT COUNT(*) as c FROM Company WHERE userId='${NEW_USER_ID}'`);
  console.log(`\n🎉 移行完了！`);
  console.log(`   ${newUser.name} のダッシュボードに企業${finalCompanies.rows[0].c}社が表示されます`);
}

main().catch(e => { console.error('❌ エラー:', e); process.exit(1); });
