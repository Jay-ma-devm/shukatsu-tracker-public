/**
 * キャリアエントリー・ES・メールテンプレート・ステージを Turso に追加
 * 実行: npx tsx -r dotenv/config scripts/add-career-data.mts dotenv_config_path=.env.local
 */
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const USER_ID = 'local-user';

async function generateId(): Promise<string> {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `c${timestamp}${random}`;
}

async function getCompanyId(name: string): Promise<string | null> {
  const result = await client.execute(
    `SELECT id FROM Company WHERE userId='${USER_ID}' AND name='${name.replace(/'/g, "''")}'`
  );
  return result.rows.length > 0 ? (result.rows[0].id as string) : null;
}

async function main() {
  console.log('🚀 キャリアデータ追加開始...\n');

  // ========== キャリアエントリー ==========
  console.log('📚 キャリアエントリー追加...');
  const existingCareers = await client.execute(`SELECT title FROM CareerEntry WHERE userId='${USER_ID}'`);
  const existingCareerTitles = new Set(existingCareers.rows.map(r => r.title as string));

  const careerEntries = [
    {
      type: 'part_time',
      title: 'ONE株式会社 メディア事業部 広告営業',
      organization: 'ONE株式会社',
      role: '広告営業・メディア戦略アシスタント',
      startAt: '2025-09-01',
      endAt: null,
      description: '日本最大級の医療・健康メディアの広告営業。クライアントへの提案資料作成、アポ取り、営業同行。月間アポ取得件数20件超。広告代理店・製薬・保険業界向けに媒体価値訴求。',
      takeaways: 'B2B営業の基礎（課題設定・提案・クロージング）を実践で習得。KPI管理・PDCA運用を身につけた。数字で語る習慣が身についた。',
      skills: '広告営業,B2B提案,メディアプランニング,KPI管理,Excel/PowerPoint',
    },
    {
      type: 'internship',
      title: 'ABABA株式会社 SEOコンテンツ戦略',
      organization: 'ABABA株式会社',
      role: 'SEOコンテンツインターン',
      startAt: '2025-10-01',
      endAt: null,
      description: '就活サービス「ABABA」のSEOコンテンツ戦略立案・記事作成。キーワード選定からライティング・内部リンク設計まで担当。月間3-5本の記事を執筆し、SEO流入増加に貢献。',
      takeaways: 'SEOの基礎（E-E-A-T・コアウェブバイタル・キーワード戦略）を実戦習得。コンテンツマーケティングの全プロセスを把握。データに基づく仮説・検証のサイクルを習慣化できた。',
      skills: 'SEO戦略,コンテンツマーケティング,ライティング,Googleアナリティクス,サーチコンソール',
    },
    {
      type: 'part_time',
      title: 'SNS運用管理（複数アカウント・フリーランス）',
      organization: '複数クライアント（フリーランス）',
      role: 'SNSアカウントマネージャー',
      startAt: '2025-04-01',
      endAt: null,
      description: 'Instagram・TikTok・Twitter等のSNSアカウント管理。投稿スケジュール管理、コンテンツ企画、エンゲージメント分析。複数クライアントを掛け持ちで管理。フォロワー増加・エンゲージメント率改善に貢献。',
      takeaways: 'SNSアルゴリズムへの深い理解とグロースハック手法を習得。クライアントコミュニケーション・プロジェクト管理スキルを向上。数値目標に向けたPDCAの高速実行が得意になった。',
      skills: 'SNS運用,コンテンツ企画,データ分析,クライアントマネジメント,グロースハック',
    },
    {
      type: 'internship',
      title: 'M&Aアドバイザリーファーム（短期インターン）',
      organization: '某M&Aアドバイザリーファーム',
      role: 'ビジネスアナリスト（インターン）',
      startAt: '2025-12-01',
      endAt: '2025-12-05',
      description: '中小企業M&A・PMI案件のデューデリジェンス補助。企業概要書（IM）の調査・整理。財務モデルの基礎理解とデータ収集を担当。',
      takeaways: 'M&Aプロセス（バリュエーション・DD・クロージング）の全体像を把握。財務3表の読み方と事業価値評価の基礎を学んだ。高度な論理思考と資料作成能力の重要性を実感。',
      skills: 'M&A概論,デューデリジェンス,財務分析,Excel,資料作成',
    },
    {
      type: 'internship',
      title: 'AdForge（デジタル広告運用インターン）',
      organization: 'AdForge',
      role: 'デジタル広告運用アシスタント',
      startAt: '2026-01-01',
      endAt: '2026-03-31',
      description: 'Google広告・Meta広告の運用補助。入稿・設定・レポート作成・改善提案を担当。月次レポートを作成し、CPA/ROAS改善施策を立案。',
      takeaways: '運用型広告の仕組み（オークション・ターゲティング・入稿ルール）を実践習得。広告効果測定とABテストの思考法が身についた。KPIへの意識が高まった。',
      skills: 'Google広告,Meta広告,運用型広告,レポーティング,AB テスト',
    },
  ];

  let addedCareers = 0;
  for (const entry of careerEntries) {
    if (existingCareerTitles.has(entry.title)) {
      console.log(`  ⏭️  スキップ: ${entry.title}`);
      continue;
    }
    const id = await generateId();
    const desc = entry.description.replace(/'/g, "''");
    const takeaways = entry.takeaways.replace(/'/g, "''");
    const startAt = `'${entry.startAt}T00:00:00.000Z'`;
    const endAt = entry.endAt ? `'${entry.endAt}T00:00:00.000Z'` : 'NULL';
    await client.execute(
      `INSERT INTO CareerEntry (id, userId, type, title, organization, role, startAt, endAt, description, takeaways, skills, createdAt, updatedAt)
       VALUES ('${id}', '${USER_ID}', '${entry.type}', '${entry.title.replace(/'/g, "''")}', '${entry.organization.replace(/'/g, "''")}', '${entry.role.replace(/'/g, "''")}', ${startAt}, ${endAt}, '${desc}', '${takeaways}', '${entry.skills}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    );
    addedCareers++;
    console.log(`  ✅ キャリア: ${entry.title}`);
  }
  console.log(`\nキャリアエントリー: ${addedCareers}件追加\n`);

  // ========== ES（エントリーシート）==========
  console.log('📝 ES追加...');
  const existingESes = await client.execute(`SELECT title FROM EntrySheet`);
  const existingESTitles = new Set(existingESes.rows.map(r => r.title as string));

  const esEntries = [
    {
      companyName: 'BCG（ボストン・コンサルティング・グループ）',
      title: 'BCG サマーインターン エントリーシート',
      status: 'draft',
      deadline: '2026-06-04T22:00:00.000Z',
    },
    {
      companyName: 'PwCコンサルティング（BC）',
      title: 'PwCコンサルティング BC サマーインターン ES',
      status: 'draft',
      deadline: '2026-05-17T23:59:00.000Z',
    },
    {
      companyName: 'PwCアドバイザリー（M&A・戦略）',
      title: 'PwCアドバイザリー Summer Internship ES（第1締切）',
      status: 'draft',
      deadline: '2026-05-19T23:59:00.000Z',
    },
    {
      companyName: 'マーサージャパン',
      title: 'マーサージャパン グループ選考 エントリー',
      status: 'submitted',
      submittedAt: '2026-05-10T09:00:00.000Z',
      deadline: '2026-05-17T23:59:00.000Z',
    },
    {
      companyName: 'KPMGコンサルティング',
      title: 'KPMGコンサルティング WEBテスト受検',
      status: 'in_progress',
      deadline: '2026-05-20T23:59:00.000Z',
    },
    {
      companyName: 'アビームコンサルティング',
      title: 'アビームコンサルティング エントリー',
      status: 'submitted',
      submittedAt: '2026-05-12T10:00:00.000Z',
    },
    {
      companyName: 'デロイト トーマツ コンサルティング',
      title: 'デロイト トーマツ コンサルティング サマーインターン ES',
      status: 'draft',
    },
    {
      companyName: 'A.T.カーニー',
      title: 'A.T.カーニー サマーインターン エントリーシート',
      status: 'draft',
    },
  ];

  let addedES = 0;
  for (const es of esEntries) {
    if (existingESTitles.has(es.title)) {
      console.log(`  ⏭️  スキップ: ${es.title}`);
      continue;
    }
    const companyId = await getCompanyId(es.companyName);
    if (!companyId) {
      console.log(`  ⚠️  企業未登録でスキップ: ${es.companyName}`);
      continue;
    }
    const id = await generateId();
    const deadline = 'deadline' in es && es.deadline ? `'${es.deadline}'` : 'NULL';
    const submittedAt = 'submittedAt' in es && es.submittedAt ? `'${es.submittedAt}'` : 'NULL';
    await client.execute(
      `INSERT INTO EntrySheet (id, companyId, title, status, submittedAt, deadline, createdAt, updatedAt)
       VALUES ('${id}', '${companyId}', '${es.title.replace(/'/g, "''")}', '${es.status}', ${submittedAt}, ${deadline}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    );
    addedES++;
    console.log(`  ✅ ES: ${es.title} [${es.status}]`);
  }
  console.log(`\nES: ${addedES}件追加\n`);

  // ========== メールテンプレート ==========
  console.log('✉️  メールテンプレート追加...');
  const existingTemplates = await client.execute(`SELECT name FROM EmailTemplate WHERE userId='${USER_ID}'`);
  const existingTemplateNames = new Set(existingTemplates.rows.map(r => r.name as string));

  const templates = [
    {
      name: '面接無断欠席 謝罪メール',
      category: 'apology',
      subject: '面接日程についてのお詫び【〇〇大学 Demo User】',
      body: `【宛先企業名】 採用ご担当者様

お世話になっております。
〇〇大学〇〇学部2028年3月卒業予定のDemo User（まつばら しゅん）と申します。

先日は【面接日時】の面接の際、無断で欠席してしまい、誠に申し訳ございませんでした。
貴社のお時間をいただきながら、大変失礼な行動をとってしまいましたことを、深くお詫び申し上げます。

【欠席した理由・事情を簡潔に記載】

改めて選考の機会を頂戴できますでしょうか。
ご都合のよいお日にちをご指定いただければ、いつでもお伺いいたします。

お手数をおかけしますが、何卒よろしくお願いいたします。

---
〇〇大学〇〇学部 / 2028年3月卒業予定
Demo User
TEL: 090-XXXX-XXXX
Mail: demo@example.com`,
      tags: '謝罪,欠席,面接',
    },
    {
      name: '面接後 お礼メール',
      category: 'thank_you',
      subject: '本日の面接のお礼【〇〇大学 Demo User】',
      body: `【宛先企業名】 採用ご担当者様
（【面接官のお名前】様）

お世話になっております。
本日【時間帯】に面接のお時間をいただきました、〇〇大学〇〇学部のDemo User（まつばら しゅん）でございます。

お忙しいところ、貴重なお時間をいただきまして、誠にありがとうございました。

【面接での学び・感想を1-2文で具体的に】

本日のお話を伺い、ますます【企業名】への志望度が高まりました。
ぜひ、貴社でご一緒できる機会をいただけますよう、引き続きよろしくお願いいたします。

---
〇〇大学〇〇学部 / 2028年3月卒業予定
Demo User
TEL: 090-XXXX-XXXX
Mail: demo@example.com`,
      tags: 'お礼,面接後',
    },
    {
      name: 'WEBテスト通知 確認メール',
      category: 'notification',
      subject: 'WEB適性検査の受検期限について確認',
      body: `【宛先企業名】 採用ご担当者様

お世話になっております。
〇〇大学〇〇学部2028年3月卒業予定のDemo User（まつばら しゅん）と申します。

先日はWEB適性検査のご案内をいただき、ありがとうございました。
受検期限について確認させていただきたく、ご連絡いたしました。

案内メールによりますと、受検期限は【期限日時】とのことでしたが、
正しい受検URLおよびID・パスワードのご確認をお願いできますでしょうか。

お手数をおかけしますが、何卒よろしくお願いいたします。

---
〇〇大学〇〇学部 / 2028年3月卒業予定
Demo User
TEL: 090-XXXX-XXXX
Mail: demo@example.com`,
      tags: 'WEBテスト,確認',
    },
    {
      name: 'インターン日程変更依頼メール',
      category: 'schedule',
      subject: 'インターンシップ日程についてのご相談【〇〇大学 Demo User】',
      body: `【宛先企業名】 採用ご担当者様

お世話になっております。
〇〇大学〇〇学部2028年3月卒業予定のDemo User（まつばら しゅん）と申します。

【インターン名】への参加について、誠にありがとうございます。
大変恐れ入りますが、予定していた【当初日程】について、【理由】のため参加が困難な状況となってしまいました。

もし可能でございましたら、【希望する代替日程1】または【希望する代替日程2】での参加変更をご検討いただけますでしょうか。

ご迷惑をおかけし、誠に申し訳ございません。
何卒よろしくお願いいたします。

---
〇〇大学〇〇学部 / 2028年3月卒業予定
Demo User
TEL: 090-XXXX-XXXX
Mail: demo@example.com`,
      tags: 'スケジュール変更,インターン',
    },
    {
      name: 'OB訪問 依頼メール',
      category: 'ob_visit',
      subject: 'OB訪問のお願い【〇〇大学 Demo User】',
      body: `【宛先氏名】様

突然のご連絡、失礼いたします。
〇〇大学〇〇学部2年のDemo User（まつばら しゅん）と申します。

Linkd（またはマッチャー/OBトーク）にてプロフィールを拝見し、ご連絡させていただきました。
【企業名】の【部門・業務内容】についてお伺いしたいことがあり、OB訪問をお願いできますでしょうか。

私は現在、2028年卒として就職活動中で、特に【関心分野・業界】に強い関心を持っております。
【具体的に聞きたいこと1-2点】などについて、ぜひお話を伺えればと思っております。

30分-1時間程度、オンライン・対面どちらでも構いません。
もしよろしければ、ご都合のよいお日にちをご教授いただけますと幸いです。

お手数をおかけしますが、何卒よろしくお願いいたします。

---
〇〇大学〇〇学部2年 / 2028年3月卒業予定
Demo User
TEL: 090-XXXX-XXXX
Mail: demo@example.com`,
      tags: 'OB訪問,依頼',
    },
  ];

  let addedTemplates = 0;
  for (const tmpl of templates) {
    if (existingTemplateNames.has(tmpl.name)) {
      console.log(`  ⏭️  スキップ: ${tmpl.name}`);
      continue;
    }
    const id = await generateId();
    const body = tmpl.body.replace(/'/g, "''");
    await client.execute(
      `INSERT INTO EmailTemplate (id, userId, name, category, subject, body, tags, usageCount, createdAt, updatedAt)
       VALUES ('${id}', '${USER_ID}', '${tmpl.name.replace(/'/g, "''")}', '${tmpl.category}', '${tmpl.subject.replace(/'/g, "''")}', '${body}', '${tmpl.tags}', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    );
    addedTemplates++;
    console.log(`  ✅ テンプレート: ${tmpl.name}`);
  }
  console.log(`\nメールテンプレート: ${addedTemplates}件追加\n`);

  // ========== 選考ステージ ==========
  console.log('🎯 選考ステージ追加...');
  const existingStages = await client.execute(`SELECT companyId, name FROM Stage`);
  const stageKey = (cId: string, name: string) => `${cId}:${name}`;
  const existingStageKeys = new Set(existingStages.rows.map(r => stageKey(r.companyId as string, r.name as string)));

  const stageData = [
    // Lumen Robotics（内定済み）
    {
      companyName: 'Lumen Robotics',
      stages: [
        { name: 'ES提出', order: 1, status: 'passed', result: '通過', scheduledAt: '2025-11-01' },
        { name: '一次面接', order: 2, status: 'passed', result: '通過', scheduledAt: '2025-11-15', feedback: 'マーケ経験を積極的にアピール。健康経営への共感を伝えた。' },
        { name: '二次面接', order: 3, status: 'passed', result: '通過', scheduledAt: '2025-12-01' },
        { name: '最終面接（役員面接）', order: 4, status: 'passed', result: '内定', scheduledAt: '2025-12-20', feedback: '内定承諾済み' },
      ]
    },
    // Pivot Studio（最終選考）
    {
      companyName: 'Pivot Studio',
      stages: [
        { name: 'エントリー', order: 1, status: 'passed', result: '通過', scheduledAt: '2026-04-01' },
        { name: '一次面接', order: 2, status: 'passed', result: '通過', scheduledAt: '2026-04-15', feedback: 'インターン選考直結。3daysプログラム。' },
        { name: '二次面接', order: 3, status: 'passed', result: '通過', scheduledAt: '2026-04-30' },
        { name: '三次面接（社員面談）', order: 4, status: 'passed', result: '通過', scheduledAt: '2026-05-07', feedback: '社員との相性確認。現場の雰囲気を深く理解。' },
        { name: '最終面接', order: 5, status: 'scheduled', scheduledAt: '2026-05-29', feedback: '3daysインターン期間中に実施予定' },
      ]
    },
    // Sora Health（最終選考）
    {
      companyName: 'Sora Health',
      stages: [
        { name: 'ES提出', order: 1, status: 'passed', result: '通過', scheduledAt: '2026-03-01' },
        { name: '一次面接', order: 2, status: 'passed', result: '通過', scheduledAt: '2026-03-15' },
        { name: '二次面接', order: 3, status: 'passed', result: '通過', scheduledAt: '2026-04-01', feedback: 'プロダクトマーケへの理解度を確認された' },
        { name: '三次面接（マネージャー）', order: 4, status: 'passed', result: '通過', scheduledAt: '2026-04-20' },
        { name: '最終面接（役員）', order: 5, status: 'scheduled', scheduledAt: '2026-05-20' },
      ]
    },
    // Northstar Bank（インターン）
    {
      companyName: 'Northstar Bank',
      stages: [
        { name: 'エントリー', order: 1, status: 'passed', result: '通過', scheduledAt: '2026-04-15' },
        { name: 'WEBテスト', order: 2, status: 'passed', result: '通過', scheduledAt: '2026-04-25' },
        { name: '書類選考', order: 3, status: 'passed', result: '通過', scheduledAt: '2026-05-01' },
        { name: 'インターン参加', order: 4, status: 'passed', result: '参加確定', scheduledAt: '2026-05-23', feedback: 'AI×経営戦略コース。5/23-24の2日間。' },
      ]
    },
    // Visional（インターン）
    {
      companyName: 'Visional（ビジョナル）',
      stages: [
        { name: 'エントリー', order: 1, status: 'passed', result: '通過', scheduledAt: '2026-04-01' },
        { name: '書類選考', order: 2, status: 'passed', result: '通過', scheduledAt: '2026-04-10' },
        { name: 'インターン合格', order: 3, status: 'passed', result: '参加確定', scheduledAt: '2026-05-01', feedback: '選考直結型インターン。BizReach・HRmos。' },
      ]
    },
    // Verdant Foods（offer）
    {
      companyName: 'Verdant Foods',
      stages: [
        { name: 'ES提出', order: 1, status: 'passed', result: '通過', scheduledAt: '2026-03-15' },
        { name: '一次面接', order: 2, status: 'passed', result: '通過', scheduledAt: '2026-04-10' },
        { name: '二次面接', order: 3, status: 'passed', result: '通過', scheduledAt: '2026-05-01', feedback: '5/9面接実施済み' },
        { name: '内定通知・同意書確認', order: 4, status: 'passed', result: '内定', scheduledAt: '2026-05-14', feedback: '同意書署名が5/14中に必要' },
      ]
    },
    // Helix Therapeutics（interview）
    {
      companyName: 'Helix Therapeutics',
      stages: [
        { name: 'エントリー', order: 1, status: 'passed', result: '通過', scheduledAt: '2026-04-01' },
        { name: '一次面接', order: 2, status: 'passed', result: '通過', scheduledAt: '2026-04-20' },
        { name: '二次面接', order: 3, status: 'scheduled', scheduledAt: '2026-05-20', feedback: '二次面接実施済み。結果待ち。' },
      ]
    },
  ];

  let addedStages = 0;
  for (const company of stageData) {
    const companyId = await getCompanyId(company.companyName);
    if (!companyId) {
      console.log(`  ⚠️  企業未登録: ${company.companyName}`);
      continue;
    }
    for (const stage of company.stages) {
      if (existingStageKeys.has(stageKey(companyId, stage.name))) {
        continue;
      }
      const id = await generateId();
      const feedback = stage.feedback ? `'${stage.feedback.replace(/'/g, "''")}'` : 'NULL';
      const result = 'result' in stage && stage.result ? `'${stage.result}'` : 'NULL';
      const scheduledAt = stage.scheduledAt ? `'${stage.scheduledAt}T00:00:00.000Z'` : 'NULL';
      await client.execute(
        `INSERT INTO Stage (id, companyId, name, "order", status, scheduledAt, result, feedback, createdAt, updatedAt)
         VALUES ('${id}', '${companyId}', '${stage.name.replace(/'/g, "''")}', ${stage.order}, '${stage.status}', ${scheduledAt}, ${result}, ${feedback}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      );
      addedStages++;
    }
    console.log(`  ✅ ${company.companyName}: ${company.stages.length}ステージ`);
  }
  console.log(`\n選考ステージ: ${addedStages}件追加\n`);

  // ===== 最終確認 =====
  const careerCount = await client.execute(`SELECT COUNT(*) as count FROM CareerEntry WHERE userId='${USER_ID}'`);
  const esCount = await client.execute(`SELECT COUNT(*) as count FROM EntrySheet`);
  const templateCount = await client.execute(`SELECT COUNT(*) as count FROM EmailTemplate WHERE userId='${USER_ID}'`);
  const stageCount = await client.execute(`SELECT COUNT(*) as count FROM Stage`);

  console.log('🎉 完了！最終状態:');
  console.log(`  キャリアエントリー: ${careerCount.rows[0].count}件`);
  console.log(`  ES: ${esCount.rows[0].count}件`);
  console.log(`  メールテンプレート: ${templateCount.rows[0].count}件`);
  console.log(`  選考ステージ: ${stageCount.rows[0].count}件`);
}

main().catch(e => {
  console.error('❌ エラー:', e);
  process.exit(1);
});
