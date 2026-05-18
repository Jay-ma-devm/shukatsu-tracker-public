import { createClient } from '@libsql/client';
const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
async function getId(): Promise<string> {
  await new Promise(r => setTimeout(r, 2));
  return `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10)}`;
}
const id = await getId();
const content = `# コンサル就活マスタープラン 2026

## 現状サマリー（2026-05-14）

### 確定ポジション
- ✅ **Lumen Robotics 内定承諾**（ウェルネス×マーケ）
- 🔔 **Verdant Foods 内々定**（同意書署名必要）

### 最終選考
- 🔥 **Pivot Studio 3daysインターン**（5/29-31）→ 内定直結
- 🔥 **Sora Health 役員面接**（日程調整中）

### インターン確定
- 🎯 Northstar Bank（5/23-24 AIストラテジー）
- 🎯 Visional
- 🎯 ワンキャリア（5/21 人事面談）
- 🎯 丸井グループ（7/10-11）

---

## フェーズ別戦略

### Phase 1: 今週の集中（5/14-5/21）
**最重要アクション:**
1. 令和トラベル謝罪メール（今日中）
2. Verdant Foods同意書署名（今日中）
3. アビームスカウト返答（今日中）
4. 5/17 5社同時締切を全て完了
5. PwCBC ES提出（5/17）
6. ソフトバンク/PwCアドvisory ES（5/19）
7. KPMG WEBテスト（5/20）

**戦略:**
- 今週は量より質。5/17の5社を確実に完了させる
- PwCBC ESは下書き4/4完成済み → ブラッシュアップして提出

### Phase 2: インターン期（5/23-6/4）
**最重要アクション:**
1. Northstar Bankインターン（5/23-24）全力参加
2. Pivot Studioインターン（5/29-31）内定獲得を狙う
3. BCG ES提出（6/4）← 最難関

**戦略:**
- Pivot Studioインターンはまさに最終選考。印象を最大化する
- BCG ESは5/28までに完成させ、29日から見直し

### Phase 3: 最終決戦（6月〜）
**目標企業:**
1. BCG（ES→ケース面接→内定）
2. デロイト（ES→面接）
3. A.T.カーニー（ES→面接）
4. PwCアドバイザリー（インターン）

**戦略:**
- コンサル6社(BCG/デロイト/ATK/PwCアドvisory/マーサー/オリバーワイマン)の並行選考
- ケース面接の週次練習は欠かさない

---

## コンサル選考の核心力

### フェルミ推定
- 毎週2問練習（このアプリのケース練習ページを活用）
- 数字の感覚（市場規模・単価・人口）を体得

### ケース面接
- MECE思考・利益ツリー・3C/4P
- 結論ファースト・構造化・具体例

### 英語
- BCG/ATカーニーの英語設問対策
- 英語面接の可能性（BCG・オリバー・ワイマン）

---

## 内定候補ランキング（現状予測）

| 企業 | 確率 | 時期 |
|------|------|------|
| Lumen Robotics | 100%（確定） | - |
| Verdant Foods | 95%（内々定） | 今すぐ |
| Pivot Studio | 80% | 5/31後 |
| Sora Health | 70% | 6月 |
| BCG | 30% | 7-8月 |
| デロイト | 50% | 7月 |

---

## 28卒 就活の方針
- **第一志望群**: BCG, デロイト, AT.カーニー（MBBレベル）
- **第二志望群**: PwC系, アビーム, ベイカレント
- **チェックポイント**: Pivot Studioインターン結果次第でpivotも検討
- **内定保有**: Lumen Robotics（承諾済）・Verdant Foods（内々定）があるので強気に選考できる`;

await client.execute(
  `INSERT INTO Note (id, userId, companyId, title, content, category, pinned, createdAt, updatedAt)
   VALUES ('${id}', 'local-user', NULL, 'コンサル就活マスタープラン2026', '${content.replace(/'/g, "''")}', 'strategy', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
);
console.log('✅ コンサル就活マスタープランノート追加');
