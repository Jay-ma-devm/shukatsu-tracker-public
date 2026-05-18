/**
 * 重要ノートを Turso に追加
 */
import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function getId(): Promise<string> {
  await new Promise(r => setTimeout(r, 2));
  return `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10)}`;
}

async function getCompanyId(name: string): Promise<string | null> {
  const r = await client.execute(`SELECT id FROM Company WHERE userId='local-user' AND name='${name.replace(/'/g, "''")}'`);
  return r.rows.length > 0 ? r.rows[0].id as string : null;
}

const notes = [
  {
    companyName: '令和トラベル',
    title: '面接リスケ 謝罪メール草稿（5/14中に送信）',
    category: 'action',
    pinned: true,
    content: `# 令和トラベル 謝罪メール草稿

**⚠️ 今日中（5/14）にrecrut@reiwatravel.co.jpに送信すること！**

---

## メール草稿

**件名：** 先日の面接に関するお詫び【〇〇大学 Demo User】

令和トラベル株式会社
採用ご担当者様

お世話になっております。
〇〇大学〇〇学部2028年3月卒業予定のDemo User（まつばら しゅん）と申します。

5月11日（日）にお時間をいただいておりました面接について、
無断で欠席してしまいましたこと、誠に申し訳ございませんでした。

貴社のお時間とご準備をいただきながら、大変失礼な行動をとってしまい、
深くお詫び申し上げます。

もし改めて面接の機会をいただくことが可能であれば、
5月25日（月）以降の平日（10:00〜17:00）で、
以下の候補日程を複数ご提案させていただきます：

・5月26日（火）10:00〜17:00のいずれか
・5月27日（水）10:00〜17:00のいずれか
・5月28日（木）10:00〜17:00のいずれか
・5月29日（金）10:00〜17:00のいずれか

ご都合の良い日時をご指定いただけますと幸いです。
重ねてお詫びを申し上げますとともに、何卒よろしくお願いいたします。

---
〇〇大学〇〇学部 / 2028年3月卒業予定
Demo User
TEL: 090-XXXX-XXXX
Mail: demo@example.com

---

## チェックリスト
- [ ] メール送信済み（到達確認）
- [ ] 返信確認（通常1〜2営業日以内）
- [ ] 新日程が決まったらカレンダーに追加`,
  },
  {
    companyName: 'BCG',
    title: 'BCG サマーインターン ES 対策メモ（締切6/4）',
    category: 'strategy',
    pinned: true,
    content: `# BCG サマーインターン ES 対策メモ

**締切: 2026年6月4日（木）22:00**
**優先度: 最高 ⭐⭐⭐⭐⭐**

---

## BCGが求める人材像
- **知的好奇心・分析力**: 複雑な問題を構造化して解決できる
- **リーダーシップ**: チームを動かし、変化をもたらす行動力
- **インパクトへの意欲**: 社会・クライアントに大きな貢献をしたい
- **コミュニケーション力**: 相手に合わせた説得力ある伝達

---

## ESの主要質問（予想）

### Q1. 自己PR・ガクチカ
**方針**: 数字でインパクトを示す。ONE株式会社での営業経験が最も強い。

**草稿**:
「私の強みは、データに基づいた高速PDCAです。ONE株式会社での広告営業において、
月間アポ取得目標に対し初月に大幅未達という困難に直面しました。
原因分析の結果、ターゲティングの精度不足と発見。
業界別・企業規模別の成功率をトラッキングし、
高成約率セグメントに集中することで月次KPIを達成できました。
この経験から、感覚に頼らずデータで仮説を検証する習慣が身につきました。」

### Q2. 志望動機
**方針**: BCGの「人類への貢献」というビジョンと自分の価値観の一致を語る。

**草稿**:
「BCGを志望する理由は、『パーパスドリブンな経営変革』を最前線で学べる場所だからです。
ONE株式会社での営業経験で、企業の意思決定の質が事業成果を大きく左右することを実感しました。
コンサルタントとして、より多くの企業の戦略的意思決定に関わることで、
社会全体に影響を与えたいと考えています。
特にBCGの社会インパクト領域（医療・教育・社会保障）への関心が強く、
インターン期間中にその最前線を体験したいと考えています。」

### Q3. ケース問題（想定）
**よく出るテーマ**:
- 市場参入戦略
- 収益改善
- 新規事業立案

**対策**: 毎日1ケース練習（このアプリのケース練習機能を活用！）

---

## 準備スケジュール（残り3週間）

| 期間 | やること |
|------|---------|
| 5/14-5/20 | ガクチカ・志望動機の下書き完成 |
| 5/21-5/28 | ケース練習強化（1日1ケース） |
| 5/29-6/2 | ES全体のブラッシュアップ・OBレビュー依頼 |
| 6/3 | 最終確認・提出 |

---

## 参考：BCG選考フロー（例年）
1. ES提出（6/4〆）
2. オンラインコーディングテスト/ロジカルテスト（1-2週後）
3. ケース面接1回目（30-45分）
4. ケース面接2回目（最終・45-60分）
5. 内定`,
  },
  {
    companyName: 'Pivot Studio',
    title: 'Pivot Studioインターン（5/29-31）準備チェックリスト',
    category: 'preparation',
    pinned: false,
    content: `# Pivot Studio 3daysインターン 準備チェックリスト（5/29-31）

## 事前準備
- [ ] インターン参加承諾の返信（完了済み確認）
- [ ] 開催場所・集合時間の確認
- [ ] 交通手段の確認（前日）
- [ ] 服装の確認（オフィスカジュアル？）

## プロダクト理解
- [ ] Pivot Studioのホームページを隅々まで確認
- [ ] 主要製品の機能・ユースケースを把握
- [ ] 競合他社（IFS・Procore等）との差別化ポイント確認
- [ ] 製造業・建設業のDX動向を調査

## ケース面接対策
- [ ] 製造業向けSaaS市場規模を再確認
- [ ] Pivot Studioのプライシングモデルを理解
- [ ] B2B SaaSのKPI（ARR/NRR/CAC/LTV）を復習

## 面接対策
- [ ] 「なぜPivot Studio？」の回答を30秒で言えるように
- [ ] 「入社後にやりたいこと」を具体的に語れるように
- [ ] 逆質問5つ用意
  1. インターン生に期待することは？
  2. 組織の意思決定スピードは？
  3. 競合との最大の差別化は？
  4. 入社後1年で最も成長できる経験は？
  5. 現在のチームの課題は？

## 持ち物
- [ ] 名刺（あれば）
- [ ] ノート・ペン
- [ ] PC（必要かどうか確認）
- [ ] 交通費領収書用意（精算があれば）

---
**このインターンは最終選考直結。全力で臨むこと！**`,
  },
  {
    companyName: 'Northstar Bank',
    title: 'Northstar Bankインターン（5/23-24）AIストラテジー事前準備',
    category: 'preparation',
    pinned: false,
    content: `# Northstar Bank AIストラテジーインターン 事前準備（5/23-24）

## Northstar Bankについて
- AI×経営戦略のコンサルティングファーム
- 東大系スタートアップ、AIの社会実装が得意
- 主なクライアント：大手製造業・流通・金融

## 事前に理解すべきこと

### AI活用の典型パターン
1. **需要予測**: 在庫・生産計画の最適化
2. **異常検知**: 製造ラインの品質管理
3. **自然言語処理**: 業務文書の自動化
4. **画像認識**: 検品・品質管理自動化
5. **推薦システム**: マーケティング・EC

### AIプロジェクトの成否を分ける要因
1. データの質と量（garbage in, garbage out）
2. 現場との連携（AI倫理・説明可能性）
3. 継続的な改善体制
4. 経営層のコミットメント

## ケース問題の想定
- 「大手小売業者のAI活用戦略を提案せよ」
- 「AIを使って中小製造業の生産効率を30%改善する方法は？」
- 「医療AIの倫理的・法的課題を整理し解決策を提案せよ」

## 持ち物・アクション
- [ ] Northstar Bankのウェブサイト・事例を事前確認
- [ ] AI×経営の最近のニュースを確認（日経・MIT Tech Review等）
- [ ] ノートPC
- [ ] 開催場所・集合時間の確認

---
**選考直結の可能性あり。Northstar Bankへの志望度を高めて臨む！**`,
  },
  {
    companyName: null,
    title: '今週の就活戦略メモ（5/14週）',
    category: 'strategy',
    pinned: true,
    content: `# 今週の就活戦略メモ（2026年5月14日〜5月20日）

## 今週の最重要タスク

### 🔴 今日中（5/14）
1. 令和トラベル 謝罪メール送信（recruit@reiwatravel.co.jp）
2. Verdant Foods 同意書署名（マイページ確認）
3. アビームコンサルティング スカウト返答

### 🟠 明日（5/15）
- ポーラ・オルビスHD 説明会参加 15:00-16:00

### 🔴 今週末（5/17）締切ラッシュ！
- マーサージャパン: グループ選考予約
- PwCコンサルティング BC: ES提出
- 三菱UFJ銀行: インターンオファー返答
- ベネッセホールディングス: 選考予約
- 日本TCS: 早期選考エントリー

### 🟡 来週（5/19-20）
- ソフトバンク: 動画提出 5/19 18:00
- PwCアドバイザリー: ES 5/19〆
- NSSOL: 適性検査 5/19〆
- KPMG: WEBテスト 5/20〆

---

## 就活全体戦略

### 内定状況
- Lumen Robotics: ✅ 内定承諾済み
- Verdant Foods: 🟡 offer（同意書手続き中）

### 最終選考中
- Pivot Studio: 🔥 3daysインターン 5/29-31（事実上の最終）
- Sora Health: 🔥 最終面接（役員）日程調整中

### インターン確定
- Northstar Bank: 5/23-24 AIストラテジー
- Visional: 近日中
- ワンキャリア: 5/21 人事面談
- 丸井グループ: 7/10-11

---

## 優先度マトリクス

**今すぐやる（高インパクト×緊急）:**
- Verdant Foods同意書 / 令和トラベル謝罪メール / 5/17締切ラッシュ

**計画的にやる（高インパクト×非緊急）:**
- BCG ES（6/4締切）/ PwCアドバイザリー ES（5/19）

**できたらやる（低インパクト）:**
- 野村証券・NRI・DBJ の情報収集

---

## 今週の目標
- 緊急タスク全て完了（令和トラベル・Verdant Foods・5/17締切5社）
- PwCBC ESの90%を完成させる
- Northstar Bankインターン事前準備完了
- BCG ESの構成メモ作成開始`,
  },
];

async function main() {
  console.log('🚀 ノート追加開始...\n');
  let added = 0;

  const existingNotes = await client.execute("SELECT title FROM Note WHERE userId='local-user'");
  const existingTitles = new Set(existingNotes.rows.map(r => r.title as string));

  for (const note of notes) {
    if (existingTitles.has(note.title)) {
      console.log(`  ⏭️  スキップ: ${note.title}`);
      continue;
    }

    const id = await getId();
    const companyId = note.companyName ? await getCompanyId(note.companyName) : null;
    const companyIdVal = companyId ? `'${companyId}'` : 'NULL';
    const content = note.content.replace(/'/g, "''");
    const title = note.title.replace(/'/g, "''");

    await client.execute(
      `INSERT INTO Note (id, userId, companyId, title, content, category, pinned, createdAt, updatedAt)
       VALUES ('${id}', 'local-user', ${companyIdVal}, '${title}', '${content}', '${note.category}', ${note.pinned ? 1 : 0}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    );
    added++;
    console.log(`  ✅ ${note.companyName ?? '汎用'}: ${note.title}`);
  }

  const total = await client.execute("SELECT COUNT(*) as count FROM Note WHERE userId='local-user'");
  console.log(`\n🎉 ノート追加完了: ${added}件（合計${total.rows[0].count}件）`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
