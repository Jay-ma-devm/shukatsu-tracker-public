import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const company = await client.execute("SELECT id FROM Company WHERE userId='local-user' AND name='Sora Health'");
if (company.rows.length === 0) { console.log('Sora Health not found'); process.exit(1); }
const id = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10)}`;
const content = `# Sora Health 最終面接（役員面接）対策メモ

## 🔥 最終選考中 - 全力で準備！

### Sora Health理解の深化

**ミッション・ビジョン**
- 「労働にまつわる社会課題をテクノロジーで解決する」
- 日本のHRデジタル化を牽引するSaaS企業
- 中小〜中堅企業の人事DXに特化

**プロダクト概要**
- 電子化：雇用契約・年末調整・入退社手続き
- 分析：ピープルアナリティクス・組織サーベイ
- 採用：ATS（応募者追跡システム）連携
- 評価：人事評価・フィードバック管理

**ビジネスモデル**
- SaaS型（月額/年額サブスクリプション）
- 従業員数に応じた従量課金
- ARR成長型：顧客が大きくなるほど収益も拡大

**競合**
- freee HR、マネーフォワードHR、SAP SuccessFactors
- 強み：日本の労働法に特化したコンプライアンス対応、UI/UXの高さ

---

## 最終面接（役員面接）で聞かれること

### 必ず準備する質問

**1. Why Sora Health？（最重要）**
「他のHR SaaSではなく、なぜSora Healthなのか？」

**準備回答**:
Sora Healthが解決しようとしているのは、日本の労働市場の非効率という本質的な課題。
ONE株式会社での広告営業で企業の採用・人事部門と会話する機会があり、
「紙・Excelで管理しているが何とかしたい」という声を多く聞きました。
Sora Healthはその課題に真正面から取り組み、すでに50,000社以上に選ばれている実績がある。
自分のマーケティング経験を活かして、この日本のHR DX革命に参加したいと思っています。

**2. 入社後の具体的な貢献**
「最初の1年間でどんな価値を出しますか？」

**準備回答**:
最初の3ヶ月：プロダクト・市場・顧客を徹底理解。現場同行、CSチームとの連携。
3〜6ヶ月：担当マーケティング施策の仮説立案・実行（SEO or コンテンツor PLG）
6〜12ヶ月：施策のKPI達成・改善サイクルを回す。データで貢献を証明する。

**3. キャリアビジョン**
「5-10年後にどうなっていたいですか？」

**準備回答**:
プロダクトマーケターとして、日本のHR市場で最も影響力のある人物になりたい。
Sora Healthのブランドを通じて、日本の働き方改革を加速させることに貢献したい。
長期的にはPMやプロダクト戦略に関わり、HRテック領域でプロダクトを作る側になりたい。

**4. 自己PR（30秒）**
ONE株式会社での広告営業で培った「データ駆動のKPI管理」と、
ABABAでのSEO施策で身につけた「コンテンツマーケティング」の実践力が私の強みです。
数字で目標を設定し、高速でPDCAを回す姿勢はSora Healthでも活かせると確信しています。

---

## 逆質問（厳選5つ）

1. **役員として、Sora Healthが今後5年間で最も重力をかけるべき領域はどこですか？**
2. **Sora Healthのプロダクトマーケターに最も期待することは何ですか？**
3. **入社後にSora Healthで最もインパクトある仕事ができた社員の共通点は？**
4. **Sora Healthのカルチャーで、一般的なSaaS企業と最も違う点は？**
5. **プロダクトの次の大きなマイルストーンについて教えていただけますか？**

---

## 当日の注意点
- 役員面接：CEOまたはCMO/CPOが面接官の可能性が高い
- 論理的かつ情熱的に語る（「なぜ？」を徹底的に準備）
- 数字を使って具体的に（Lumen Robotics内定の実績、ABABA/ONE の成果数値）
- 最後の印象で決まる ー 熱意と謙虚さのバランスを意識

---

## チェックリスト（面接前日）
- [ ] Sora Healthの最新ニュースを確認
- [ ] プロダクト機能を使ってみる（フリートライアル）
- [ ] 回答を3回声に出して練習
- [ ] 逆質問を5つ用意
- [ ] 当日の接続環境確認（Zoom? 対面?）`;

await client.execute(
  `INSERT INTO Note (id, userId, companyId, title, content, category, pinned, createdAt, updatedAt)
   VALUES ('${id}', 'local-user', '${company.rows[0].id}', 'Sora Health 最終面接（役員面接）対策メモ', '${content.replace(/'/g, "''")}', 'preparation', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
);
console.log('✅ Sora Health最終面接対策ノート追加完了');
