import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
async function getId(): Promise<string> {
  await new Promise(r => setTimeout(r, 2));
  return `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10)}`;
}
const co = await client.execute("SELECT id FROM Company WHERE userId='local-user' AND name='Verdant Foods'");
if (co.rows.length === 0) { process.exit(1); }
const coId = co.rows[0].id as string;
const id = await getId();
const content = `# Verdant Foods 内々定 同意書署名（5/14中に完了）

## ⚠️ 今日中（5/14）に署名が必要！

### 手順
1. Verdant Foodsマイページにログイン
2. 「内々定承諾・同意書」のセクションを確認
3. 同意書の内容を確認し、電子署名を行う
4. 署名完了のメールを確認

### 重要事項
- **締切**: 2026年5月14日（今日中）
- 署名しない場合、内々定が取り消される可能性あり
- 同意書は「承諾」ではなく「個人情報利用同意」の場合がある（内定確定まで他社選考継続可能）

### Verdant Foodsについて
- ゲーム・エンタメ・ヘルスケア事業
- 内々定通知受領済み
- ビジネス職

### 署名完了後のアクション
- [ ] 署名完了を確認
- [ ] メール受信を確認
- [ ] 他社選考への影響がないか確認（Pivot Studio/Sora Healthは継続）`;
await client.execute(
  `INSERT INTO Note (id, userId, companyId, title, content, category, pinned, createdAt, updatedAt)
   VALUES ('${id}', 'local-user', '${coId}', 'Verdant Foods 内々定同意書署名（5/14中に必須）', '${content.replace(/'/g, "''")}', 'action', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
);
console.log('✅ Verdant Foods同意書リマインダーノート追加');
