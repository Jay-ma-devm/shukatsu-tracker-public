import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const plexId = await client.execute("SELECT id FROM Company WHERE userId='local-user' AND name='Pivot Studio'");
if (plexId.rows.length === 0) { console.log('Pivot Studio not found'); process.exit(1); }

const id = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10)}`;
const content = `# Pivot Studio 3daysインターン 最終選考対策（5/29-31）

## ⭐ このインターンは最終選考直結

### Pivot Studioについて深く理解する

**ビジネスモデル**
- 製造業・建設業向け SaaS（Industry Tech）
- クラウドERPプラットフォームを提供
- 主なターゲット：中堅〜大手製造業（従業員500人〜）
- ARR（年間経常収益）成長型のSaaS
- グローバル展開（日本・アジアパシフィック）

**競合との差別化**
- 国内：OBIC、SCSK、SAP Japan
- 強み：製造業特化の深いドメイン知識 + 使いやすいUI + 中規模向け価格帯

**Pivot Studioが解決する課題**
1. 製造ラインの可視化・リアルタイム管理
2. 品質管理・検品プロセスの自動化
3. サプライチェーン最適化
4. コスト削減（在庫・廃棄ロス）

---

## インターンで評価されるポイント

### ビジネス視点
- 顧客課題を正確に理解し、解決策を提案できるか
- 数字で語れるか（ROI、コスト削減率、効率改善率）
- 競合比較ができるか

### コミュニケーション
- チームメンバーと協力できるか
- アイデアを明確に説明できるか
- フィードバックを素直に受け取れるか

### 主体性
- 積極的に発言・提案しているか
- 自分から仕事を作り出せるか

---

## 想定されるグループワーク・課題

### 1. 製造業DX戦略の提案
「ある中堅自動車部品メーカーがPivot Studioを導入すべき理由と、期待される効果を提案せよ」

**準備回答**:
- 現状課題：在庫管理のExcel依存、生産ラインの可視化不足、品質データの分散
- 提案：Pivot Studio導入でリアルタイム生産ダッシュボード + 品質トレーサビリティ + 自動発注システム
- 期待効果：廃棄ロス30%減、生産効率20%向上、品質不良コスト50%減
- 投資回収期間：導入コスト2000万円 / 年間効果1200万円 = 約2年で回収

### 2. 新規顧客獲得戦略
「Pivot Studioが日本市場でシェアを3倍にするための戦略を提案せよ」

**準備回答**:
- ターゲット：従業員500-5000人の中堅製造業（日本に約1万社）
- 差別化：SAP/Oracle比で30-50%低コスト + 導入期間半減
- 戦略：(1)業界イベント（製造業DX展）でのリード獲得 (2)中小企業庁のDX補助金活用訴求 (3)業界特化のカスタマーサクセス体制
- KPI：Year1: 50社獲得、ARR +5億円

---

## 逆質問（5つ用意）
1. インターン期間中に評価される行動・姿勢を具体的に教えてください
2. Pivot Studioが今後5年間で最も注力する製品機能/市場はどこですか？
3. 入社後1年間で最も成長できる経験は何ですか？
4. 現在の組織の課題と、それを克服するために必要な人材像は？
5. 御社のAI活用戦略について教えてください（製品への組み込みや業務効率化）

---

## 当日の行動指針
- 積極的に発言（沈黙は評価ゼロ）
- 失敗を恐れずアイデアを出す
- チームメンバーの意見を引き出す質問をする
- 数字でインパクトを示す
- 最終日に「一緒に働きたい」と思わせる印象を残す

---

## 5/28（前日）にやること
- [ ] Pivot Studioのウェブサイト・プレスリリースを再確認
- [ ] 製造業DXの最新トレンド確認（日経・IT media）
- [ ] 逆質問の最終確認
- [ ] 会場（開催場所）・服装確認
- [ ] 早めに就寝（7時間以上）`;

await client.execute(
  `INSERT INTO Note (id, userId, companyId, title, content, category, pinned, createdAt, updatedAt)
   VALUES ('${id}', 'local-user', '${plexId.rows[0].id}', 'Pivot Studio 3daysインターン 最終選考対策メモ（5/29-31）', '${content.replace(/'/g, "''")}', 'preparation', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
);

console.log('✅ Pivot Studio最終選考対策ノート追加完了');
