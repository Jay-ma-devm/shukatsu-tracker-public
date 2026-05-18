/**
 * Turso DB に就活全記録を一括投入するスクリプト
 * ローカル SQLite(dev.db) ではなく Turso を直接参照する
 * 実行: npx tsx -r dotenv/config scripts/bulk-import-turso.mts dotenv_config_path=.env.local
 */
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const USER_ID = 'local-user';

// ========== 既存企業のステータス更新 ==========
const statusUpdates: Array<{ name: string; status: string; notes?: string }> = [
  { name: 'Lumen Robotics', status: 'accepted', notes: '内定承諾済み。Lumen Robotics WELLNESS CAMP参加。健康経営・スポーツ×ビジネス。' },
  { name: 'Northstar Bank', status: 'internship', notes: 'AIストラテジーインターン合格。日程5/23-24（2日間）。AI×経営戦略。' },
  { name: 'Pivot Studio', status: 'final', notes: '最終選考中（社員面談4回完了）。3daysインターン5/29-31。' },
  { name: 'Sora Health', status: 'final', notes: '最終選考中（面接4ラウンド完了）。プロダクトマーケティング。' },
  { name: 'Helix Therapeutics', status: 'interview', notes: '二次面接実施済み。ファッションテック BizDev。' },
  { name: 'Pivot Studio', status: 'case', notes: 'ケース面接段階。D2C戦略コンサルインターン。' },
];

// ========== 新規追加企業 ==========
const newCompanies = [
  // === コンサルティング（最重要） ===
  {
    name: 'マーサージャパン',
    industry: 'コンサルティング',
    position: '新卒選考',
    status: 'screening',
    priority: 4,
    starred: false,
    notes: '書類選考合格。グループ選考へ（5/17まで予約必須）。マイページから予約。',
    appliedAt: new Date('2026-05-10'),
  },
  {
    name: 'KPMGコンサルティング',
    industry: 'コンサルティング',
    position: '総合職',
    status: 'screening',
    priority: 4,
    starred: false,
    notes: '書類選考（ES）通過。WEBテスト受検期限5/20(水)23:59。所要約90分、言語・計数・英語・パーソナリティ。Windows推奨（macOS非対応）。',
  },
  {
    name: 'PwCアドバイザリー（M&A・戦略）',
    industry: 'コンサルティング',
    position: 'M&A・戦略コンサルタント',
    status: 'applied',
    priority: 4,
    starred: false,
    notes: 'Summer Internship 第1締切5/19。戦略コンサルタント職（XVS）説明会参加済み。',
  },
  {
    name: 'PwCコンサルティング（BC）',
    industry: 'コンサルティング',
    position: 'ビジネスコンサルタント（BC）',
    status: 'applied',
    priority: 3,
    starred: false,
    notes: 'Summer Internship ES締切5/17。説明会参加済み（5/12, 5/15）。',
  },
  {
    name: 'レイヤーズ・コンサルティング',
    industry: 'コンサルティング',
    position: 'コンサルタント',
    status: 'applied',
    priority: 3,
    starred: false,
    notes: '6/12(金)説明会【A: コンサル業界・企業概要編】。6/9(火)就活対策セミナー（応募〆切5/29 12:00）。',
  },
  {
    name: 'アビームコンサルティング',
    industry: 'コンサルティング',
    position: '総合職',
    status: 'screening',
    priority: 4,
    starred: false,
    notes: 'dodaキャンパス スカウト受け取り済み。有効期限要確認。SAP実装・戦略コンサル。',
  },
  {
    name: 'デロイト トーマツ コンサルティング',
    industry: 'コンサルティング',
    position: 'ビジネスアナリスト',
    status: 'applied',
    priority: 4,
    starred: false,
    notes: '戦略・DX・M&A。Big4コンサル。BCGと並ぶ最難関。',
  },
  {
    name: 'A.T.カーニー',
    industry: 'コンサルティング',
    position: '新卒コンサルタント',
    status: 'applied',
    priority: 4,
    starred: false,
    notes: 'グローバル戦略コンサル。Summer Internship候補。',
  },
  {
    name: 'ベイカレント・コンサルティング',
    industry: 'コンサルティング',
    position: '総合職',
    status: 'applied',
    priority: 3,
    starred: false,
    notes: '独立系総合コンサル。エントリー済み。',
  },
  {
    name: 'Accenture（アクセンチュア）',
    industry: 'ITコンサルティング',
    position: '新卒コンサルタント',
    status: 'applied',
    priority: 3,
    starred: false,
    notes: 'テクノロジーコンサル。マイページ登録済み。',
  },
  // === 日系コンサル・シンクタンク ===
  {
    name: '野村総合研究所（NRI）',
    industry: 'ITコンサルティング',
    position: 'ITソリューション・コンサルティング',
    status: 'applied',
    priority: 3,
    starred: false,
    notes: '夏インターンシップ紹介セミナー予約受付中。実践型インターン4種類のコース。',
  },
  {
    name: 'MSOL（三菱商事テクノス）',
    industry: 'コンサルティング',
    position: '総合職',
    status: 'applied',
    priority: 2,
    starred: false,
    notes: '総合コンサル。エントリー検討中。',
  },
  // === 金融 ===
  {
    name: '日本政策投資銀行（DBJ）',
    industry: '金融',
    position: '1DAY SUMMER WORKSHOP',
    status: 'applied',
    priority: 3,
    starred: false,
    notes: '1次エントリー〆切5/26(火)正午。金融知識+グループワーク形式。',
  },
  {
    name: '野村証券',
    industry: '金融',
    position: '総合職（ビジネスコース）',
    status: 'applied',
    priority: 3,
    starred: false,
    notes: '夏季ワークショップコース合同説明会開催決定。コンテンツ・カンパニー（リサーチ）コース。',
  },
  {
    name: '三菱UFJ銀行',
    industry: '金融',
    position: 'システムデジタルコース',
    status: 'applied',
    priority: 3,
    starred: false,
    notes: 'dodaキャンパス経由でインターンオファー。返答期限5/17。「次世代金融インフラを創るMUFGシステム部門Program」。',
  },
  // === 広告・マーケ ===
  {
    name: 'Hakuhodo DY ONE',
    industry: '広告/マーケティング',
    position: 'インターンシップ',
    status: 'screening',
    priority: 3,
    starred: false,
    notes: '5/13(水)インターンシップ説明会参加済み。夏季インターンシップ（早期選考直結）エントリー済み。',
    appliedAt: new Date('2026-05-13'),
  },
  // === HR-tech / インターネット ===
  {
    name: 'ワンキャリア',
    industry: 'HR-tech',
    position: 'ビジネス職',
    status: 'internship',
    priority: 3,
    starred: false,
    notes: '2daysインターン参加済み。5/21(木)12:00 人事面談（インターン事後面談）。',
  },
  {
    name: 'U-NEXT HOLDINGS',
    industry: 'エンタメ/メディア',
    position: '総合職',
    status: 'interview',
    priority: 2,
    starred: false,
    notes: '書類通過。面接予定。VOD・エンタメ領域。',
  },
  {
    name: 'ソフトバンク',
    industry: 'IT/通信',
    position: 'JOB-MATCHインターン',
    status: 'applied',
    priority: 3,
    starred: false,
    notes: 'JOB-MATCHインターン エントリー動画+コースアンケート締切5/19 18:00。マイページで希望コースアンケート回答＋動画提出。',
  },
  // === UX・デザイン ===
  {
    name: 'グッドパッチ',
    industry: 'UXデザイン',
    position: 'サマーインターン（事業創造×UXデザイン）',
    status: 'screening',
    priority: 3,
    starred: false,
    notes: '一次面接（グループ面接・オンラインGoogle Meet・60分）の予約締切5/22。マイページから予約すること。',
  },
  // === 旅行・観光 ===
  {
    name: '令和トラベル',
    industry: '旅行/観光',
    position: 'ビジネス職',
    status: 'interview',
    priority: 2,
    starred: false,
    notes: '5/11の面接を無断欠席してしまった。採用担当から再調整連絡あり。5/25(月)以降の平日10:00-17:00で都合のつく日程を複数連絡すること。recruit@reiwatravel.co.jp',
  },
  // === 小売 ===
  {
    name: '丸井グループ',
    industry: '小売/流通',
    position: '総合職',
    status: 'internship',
    priority: 3,
    starred: false,
    notes: '春インターンシップ確定。7/10-7/11（2日間）。交通費一律2,000円。個人ID: M28000395。',
  },
  // === 化粧品・FMCG ===
  {
    name: 'ポーラ・オルビスHD',
    industry: '化粧品/FMCG',
    position: '総合職',
    status: 'applied',
    priority: 3,
    starred: false,
    notes: '5/15(金)15:00-16:00 オンライン会社説明会予約済み。',
    appliedAt: new Date('2026-05-08'),
  },
  // === エンタメ・施設 ===
  {
    name: 'USJ（ユー・エス・ジェイ）',
    industry: 'エンタメ/レジャー',
    position: 'Marketing Challenge 2026',
    status: 'applied',
    priority: 3,
    starred: false,
    notes: 'WEB適性検査・ES提出期限7/2(日)23:59。Marketing Challenge 2026。',
  },
  // === 教育 ===
  {
    name: 'ベネッセホールディングス',
    industry: '教育/EdTech',
    position: 'ビジネス職',
    status: 'screening',
    priority: 3,
    starred: false,
    notes: '書類選考通過。5/17まで予約。EdTech×教育産業。',
  },
  // === IT・インフラ ===
  {
    name: 'NSSOL（日鉄ソリューションズ）',
    industry: 'IT/SIer',
    position: 'システムエンジニア・ビジネス',
    status: 'screening',
    priority: 3,
    starred: false,
    notes: '書類選考通過。5/19(月)WEB適性検査受検〆切（23:59）。',
  },
  {
    name: '日本TCS',
    industry: 'IT/コンサルティング',
    position: '早期選考',
    status: 'applied',
    priority: 2,
    starred: false,
    notes: '早期選考応募受付延長。5/17締切。タタグループ系ITコンサル。',
  },
  // === 監査・PwC系 ===
  {
    name: 'PwC Japan有限責任監査法人',
    industry: '監査/コンサルティング',
    position: 'デジタルリスクコンサルタント（RA）',
    status: 'screening',
    priority: 3,
    starred: false,
    notes: '1Day Job選考 Wave2振替。WEB適性検査+動画テスト 締切7/5(日)23:59。',
  },
  // === Visional ===
  {
    name: 'Visional（ビジョナル）',
    industry: 'HR-tech',
    position: 'AIプロダクト職',
    status: 'internship',
    priority: 4,
    starred: false,
    notes: 'インターン合格。選考直結型インターン。BizReach・HRmosなど展開。',
  },
  // === 不動産 ===
  {
    name: 'ザイマックス',
    industry: '不動産/FM',
    position: '総合職',
    status: 'applied',
    priority: 2,
    starred: false,
    notes: '不動産ファシリティマネジメント。法政メールで連絡あり。',
  },
  // === rejected ===
  {
    name: 'GMOインターネットグループ',
    industry: 'IT/インターネット',
    position: 'ビジネス職',
    status: 'rejected',
    priority: 2,
    starred: false,
    notes: '5/8 選考結果：不採用通知受信。10月以降再応募可能。',
  },
  {
    name: 'ラクスル',
    industry: 'IT/印刷DX',
    position: 'ビジネス職',
    status: 'rejected',
    priority: 2,
    starred: false,
    notes: '書類選考で不採用。印刷・物流DX企業。',
  },
];

// ========== 緊急タスク ==========
// priority: 5=最高, 4=高, 3=中, 2=低, 1=最低
const urgentTasks = [
  {
    title: '令和トラベル 面接リスケ連絡（今日中）',
    description: '5/11の面接を無断欠席。recruit@reiwatravel.co.jpへ5/25以降の平日10-17時の候補日程を複数送る',
    status: 'todo',
    priority: 5,
    dueAt: new Date('2026-05-14T23:59:00+09:00'),
    companyName: '令和トラベル',
  },
  {
    title: 'Verdant Foods 同意書署名（今日中）',
    description: 'Verdant Foodsから内々定通知・同意書署名が必要。マイページで確認・署名する',
    status: 'todo',
    priority: 5,
    dueAt: new Date('2026-05-14T23:59:00+09:00'),
    companyName: 'Verdant Foods',
  },
  {
    title: 'アビームコンサルティング スカウト回答（今日中）',
    description: 'dodaキャンパスのスカウトに有効期限あり。今日中に確認・回答',
    status: 'todo',
    priority: 5,
    dueAt: new Date('2026-05-14T23:59:00+09:00'),
    companyName: 'アビームコンサルティング',
  },
  {
    title: 'ポーラ・オルビスHD 説明会参加（5/15 15:00）',
    description: 'オンライン会社説明会 15:00-16:00。URLを事前確認しておく',
    status: 'todo',
    priority: 4,
    dueAt: new Date('2026-05-15T15:00:00+09:00'),
    companyName: 'ポーラ・オルビスHD',
  },
  {
    title: 'マーサージャパン グループ選考予約（〜5/17）',
    description: 'マイページからグループ選考の日程を予約する。5/17まで',
    status: 'todo',
    priority: 5,
    dueAt: new Date('2026-05-17T23:59:00+09:00'),
    companyName: 'マーサージャパン',
  },
  {
    title: 'PwCコンサルティング（BC）ES提出（〜5/17）',
    description: 'Summer Internship ESの締切5/17。内容：志望動機・ガクチカ・強みを書く',
    status: 'todo',
    priority: 5,
    dueAt: new Date('2026-05-17T23:59:00+09:00'),
    companyName: 'PwCコンサルティング（BC）',
  },
  {
    title: '三菱UFJ銀行 インターンオファー回答（〜5/17）',
    description: 'dodaキャンパスで確認・回答。「次世代金融インフラを創るMUFGシステム部門Program」',
    status: 'todo',
    priority: 5,
    dueAt: new Date('2026-05-17T23:59:00+09:00'),
    companyName: '三菱UFJ銀行',
  },
  {
    title: 'ベネッセホールディングス 選考予約（〜5/17）',
    description: '書類選考通過。5/17までに次の選考ステップを予約する',
    status: 'todo',
    priority: 5,
    dueAt: new Date('2026-05-17T23:59:00+09:00'),
    companyName: 'ベネッセホールディングス',
  },
  {
    title: '日本TCS 早期選考エントリー（〜5/17）',
    description: '早期選考応募受付延長期限5/17。エントリーフォームを記入・送信する',
    status: 'todo',
    priority: 5,
    dueAt: new Date('2026-05-17T23:59:00+09:00'),
    companyName: '日本TCS',
  },
  {
    title: 'ソフトバンク JOB-MATCH 動画+アンケート（〜5/19 18:00）',
    description: 'マイページで希望コースアンケートに回答＋エントリー動画を提出。締切18:00厳守',
    status: 'todo',
    priority: 4,
    dueAt: new Date('2026-05-19T18:00:00+09:00'),
    companyName: 'ソフトバンク',
  },
  {
    title: 'PwCアドバイザリー ES第1締切（〜5/19）',
    description: 'Summer Internship M&A・戦略コンサルタント職（XVS）の第1締切。ES記入・提出',
    status: 'todo',
    priority: 4,
    dueAt: new Date('2026-05-19T23:59:00+09:00'),
    companyName: 'PwCアドバイザリー（M&A・戦略）',
  },
  {
    title: 'NSSOL 適性検査受検（〜5/19）',
    description: 'WEB適性検査受検〆切5/19(月)23:59。マイページからアクセス',
    status: 'todo',
    priority: 4,
    dueAt: new Date('2026-05-19T23:59:00+09:00'),
    companyName: 'NSSOL（日鉄ソリューションズ）',
  },
  {
    title: 'KPMGコンサルティング WEBテスト受検（〜5/20）',
    description: '言語・計数・英語・パーソナリティ 約90分。Windows推奨（macOS非対応）。受検期限5/20(水)23:59',
    status: 'todo',
    priority: 4,
    dueAt: new Date('2026-05-20T23:59:00+09:00'),
    companyName: 'KPMGコンサルティング',
  },
  {
    title: 'ワンキャリア 人事面談（5/21 12:00）',
    description: 'インターン事後面談。次のステップについて確認する',
    status: 'todo',
    priority: 4,
    dueAt: new Date('2026-05-21T12:00:00+09:00'),
    companyName: 'ワンキャリア',
  },
  {
    title: 'グッドパッチ 一次面接予約（〜5/22）',
    description: 'グループ面接（Google Meet・60分）をマイページから予約。締切5/22',
    status: 'todo',
    priority: 4,
    dueAt: new Date('2026-05-22T23:59:00+09:00'),
    companyName: 'グッドパッチ',
  },
  {
    title: 'BCG サマーインターン ES（〜6/4）',
    description: '最難関コンサル。ESとカバーレター。戦略的思考力・論理性・リーダーシップを示す',
    status: 'todo',
    priority: 4,
    dueAt: new Date('2026-06-04T22:00:00+09:00'),
    companyName: 'BCG',
  },
];

// ========== イベント ==========
const events: Array<{
  companyName: string;
  title: string;
  type: string;
  startAt: Date;
  endAt?: Date;
  notes?: string;
}> = [
  { companyName: 'マーサージャパン', title: 'グループ選考 予約締切', type: 'deadline', startAt: new Date('2026-05-17T23:59:00+09:00'), notes: 'マイページから予約' },
  { companyName: 'KPMGコンサルティング', title: 'WEBテスト 受検締切', type: 'deadline', startAt: new Date('2026-05-20T23:59:00+09:00'), notes: '約90分。Windows推奨。' },
  { companyName: 'PwCアドバイザリー（M&A・戦略）', title: 'Summer Internship ES第1締切', type: 'deadline', startAt: new Date('2026-05-19T23:59:00+09:00') },
  { companyName: 'PwCコンサルティング（BC）', title: 'Summer Internship ES締切', type: 'deadline', startAt: new Date('2026-05-17T23:59:00+09:00') },
  { companyName: 'ソフトバンク', title: 'JOB-MATCH 動画+アンケート締切', type: 'deadline', startAt: new Date('2026-05-19T18:00:00+09:00'), notes: 'マイページで希望コースアンケート回答＋動画提出' },
  { companyName: 'ポーラ・オルビスHD', title: 'オンライン会社説明会', type: 'info_session', startAt: new Date('2026-05-15T15:00:00+09:00'), endAt: new Date('2026-05-15T16:00:00+09:00') },
  { companyName: '日本政策投資銀行（DBJ）', title: '1DAY SUMMER WORKSHOP 1次エントリー締切', type: 'deadline', startAt: new Date('2026-05-26T12:00:00+09:00') },
  { companyName: 'ワンキャリア', title: '人事面談（インターン事後面談）', type: 'meeting', startAt: new Date('2026-05-21T12:00:00+09:00') },
  { companyName: 'グッドパッチ', title: '一次面接（グループ面接）予約締切', type: 'deadline', startAt: new Date('2026-05-22T23:59:00+09:00'), notes: 'Google Meetオンライン・60分。マイページから予約！' },
  { companyName: '令和トラベル', title: '面接日程リスケ連絡締切（今日）', type: 'deadline', startAt: new Date('2026-05-14T23:59:00+09:00'), notes: 'recruit@reiwatravel.co.jpへ複数日程を連絡' },
  { companyName: '三菱UFJ銀行', title: 'インターンオファー返答期限', type: 'deadline', startAt: new Date('2026-05-17T23:59:00+09:00'), notes: 'dodaキャンパスで確認・回答' },
  { companyName: 'レイヤーズ・コンサルティング', title: '就活対策セミナー応募締切', type: 'deadline', startAt: new Date('2026-05-29T12:00:00+09:00') },
  { companyName: 'レイヤーズ・コンサルティング', title: '就活対策セミナー', type: 'meeting', startAt: new Date('2026-06-09T18:00:00+09:00') },
  { companyName: 'レイヤーズ・コンサルティング', title: 'オンライン会社説明会【コンサル業界・企業概要編】', type: 'info_session', startAt: new Date('2026-06-12T18:00:00+09:00') },
  { companyName: '丸井グループ', title: '春インターンシップ Day1', type: 'interview', startAt: new Date('2026-07-10T09:00:00+09:00'), notes: '確定。2日間インターン。交通費一律2,000円。' },
  { companyName: '丸井グループ', title: '春インターンシップ Day2', type: 'interview', startAt: new Date('2026-07-11T09:00:00+09:00') },
  { companyName: 'PwC Japan有限責任監査法人', title: 'デジタルリスクコンサルタント WEBテスト締切', type: 'deadline', startAt: new Date('2026-07-05T23:59:00+09:00'), notes: 'Wave2振替。WEB適性検査+動画テスト' },
  { companyName: '日本TCS', title: '早期選考エントリー締切', type: 'deadline', startAt: new Date('2026-05-17T23:59:00+09:00') },
  { companyName: 'NSSOL（日鉄ソリューションズ）', title: 'WEB適性検査受検締切', type: 'deadline', startAt: new Date('2026-05-19T23:59:00+09:00') },
  { companyName: 'ベネッセホールディングス', title: '選考予約期限', type: 'deadline', startAt: new Date('2026-05-17T23:59:00+09:00') },
  { companyName: 'Northstar Bank', title: 'AIストラテジーインターン Day1', type: 'info_session', startAt: new Date('2026-05-23T09:00:00+09:00') },
  { companyName: 'Northstar Bank', title: 'AIストラテジーインターン Day2', type: 'info_session', startAt: new Date('2026-05-24T09:00:00+09:00') },
  { companyName: 'Pivot Studio', title: '3daysインターン Day1', type: 'interview', startAt: new Date('2026-05-29T09:00:00+09:00') },
  { companyName: 'Pivot Studio', title: '3daysインターン Day2', type: 'interview', startAt: new Date('2026-05-30T09:00:00+09:00') },
  { companyName: 'Pivot Studio', title: '3daysインターン Day3（最終）', type: 'interview', startAt: new Date('2026-05-31T09:00:00+09:00') },
  { companyName: 'BCG', title: 'サマーインターン エントリー締切', type: 'deadline', startAt: new Date('2026-06-04T22:00:00+09:00') },
  { companyName: 'USJ（ユー・エス・ジェイ）', title: 'WEB適性検査・ES提出期限', type: 'deadline', startAt: new Date('2026-07-02T23:59:00+09:00') },
];

async function generateCuid(): Promise<string> {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `c${timestamp}${random}`;
}

async function main() {
  console.log('🚀 Turso DB 一括インポート開始...\n');

  // 既存企業一覧を取得
  const existingResult = await client.execute(
    `SELECT id, name, status FROM Company WHERE userId='local-user'`
  );
  const existingMap = new Map<string, string>(); // name -> id
  existingResult.rows.forEach(r => {
    existingMap.set(r.name as string, r.id as string);
  });
  console.log(`📋 既存企業: ${existingMap.size}社`);
  existingResult.rows.forEach(r => console.log(`  [${r.status}] ${r.name}`));

  // ===== ステータス更新 =====
  console.log('\n📝 ステータス更新...');
  for (const update of statusUpdates) {
    const existingId = existingMap.get(update.name);
    if (!existingId) {
      console.log(`  ⚠️  見つからない: ${update.name}`);
      continue;
    }
    const notesClause = update.notes ? `, notes='${update.notes.replace(/'/g, "''")}'` : '';
    await client.execute(
      `UPDATE Company SET status='${update.status}'${notesClause}, updatedAt=CURRENT_TIMESTAMP WHERE id='${existingId}'`
    );
    console.log(`  ✅ ${update.name}: → ${update.status}`);
  }

  // ===== 新規企業追加 =====
  console.log('\n🏢 新規企業追加...');
  let addedCompanies = 0;

  for (const company of newCompanies) {
    if (existingMap.has(company.name)) {
      console.log(`  ⏭️  スキップ（既存）: ${company.name}`);
      continue;
    }
    const id = await generateCuid();
    const notes = (company.notes ?? '').replace(/'/g, "''");
    const appliedAt = company.appliedAt ? `'${company.appliedAt.toISOString()}'` : 'NULL';
    await client.execute(
      `INSERT INTO Company (id, userId, name, industry, position, status, priority, starred, notes, appliedAt, createdAt, updatedAt)
       VALUES ('${id}', '${USER_ID}', '${company.name.replace(/'/g, "''")}', '${company.industry}', '${company.position}', '${company.status}', ${company.priority}, ${company.starred ? 1 : 0}, '${notes}', ${appliedAt}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    );
    existingMap.set(company.name, id);
    addedCompanies++;
    console.log(`  ✅ 追加: [${company.status}] ${company.name}`);
  }
  console.log(`\n📊 企業追加完了: ${addedCompanies}社`);

  // ===== タスク追加 =====
  console.log('\n📋 タスク追加...');
  const existingTasks = await client.execute(
    `SELECT title FROM Task WHERE userId='local-user'`
  );
  const existingTaskTitles = new Set(existingTasks.rows.map(r => r.title as string));

  let addedTasks = 0;
  for (const task of urgentTasks) {
    if (existingTaskTitles.has(task.title)) {
      console.log(`  ⏭️  スキップ（既存）: ${task.title}`);
      continue;
    }
    const companyId = existingMap.get(task.companyName);
    if (!companyId) {
      console.log(`  ⚠️  企業未登録でスキップ: ${task.companyName}`);
      continue;
    }
    const id = await generateCuid();
    const desc = task.description.replace(/'/g, "''");
    const dueAt = `'${task.dueAt.toISOString()}'`;
    const companyIdClause = companyId ? `'${companyId}'` : 'NULL';
    await client.execute(
      `INSERT INTO Task (id, userId, companyId, title, description, status, priority, dueAt, createdAt, updatedAt)
       VALUES ('${id}', '${USER_ID}', ${companyIdClause}, '${task.title.replace(/'/g, "''")}', '${desc}', '${task.status}', '${task.priority}', ${dueAt}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    );
    addedTasks++;
    console.log(`  ✅ タスク: ${task.title}`);
  }
  console.log(`\n📋 タスク追加完了: ${addedTasks}件`);

  // ===== イベント追加 =====
  console.log('\n📅 イベント追加...');
  const existingEvents = await client.execute(`SELECT title FROM Event`);
  const existingEventTitles = new Set(existingEvents.rows.map(r => r.title as string));

  let addedEvents = 0;
  for (const event of events) {
    if (existingEventTitles.has(event.title)) {
      console.log(`  ⏭️  スキップ（既存）: ${event.title}`);
      continue;
    }
    const companyId = existingMap.get(event.companyName);
    if (!companyId) {
      console.log(`  ⚠️  企業未登録でスキップ: ${event.companyName}`);
      continue;
    }
    const id = await generateCuid();
    const notes = event.notes ? `'${event.notes.replace(/'/g, "''")}'` : 'NULL';
    const endAt = event.endAt ? `'${event.endAt.toISOString()}'` : 'NULL';
    await client.execute(
      `INSERT INTO Event (id, companyId, title, type, startAt, endAt, notes, createdAt)
       VALUES ('${id}', '${companyId}', '${event.title.replace(/'/g, "''")}', '${event.type}', '${event.startAt.toISOString()}', ${endAt}, ${notes}, CURRENT_TIMESTAMP)`
    );
    addedEvents++;
    console.log(`  📅 イベント: [${event.companyName}] ${event.title}`);
  }
  console.log(`\n📅 イベント追加完了: ${addedEvents}件`);

  // ===== 最終確認 =====
  const finalCount = await client.execute(
    `SELECT status, COUNT(*) as count FROM Company WHERE userId='local-user' GROUP BY status ORDER BY count DESC`
  );
  console.log('\n🎉 インポート完了！最終状態:');
  let total = 0;
  finalCount.rows.forEach(r => {
    console.log(`  ${r.status}: ${r.count}社`);
    total += Number(r.count);
  });
  console.log(`  合計: ${total}社`);
}

main().catch(e => {
  console.error('❌ エラー:', e);
  process.exit(1);
});
