/**
 * ESに設問を追加して進捗トラッキングを有効化する
 */
import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function getId(): Promise<string> {
  await new Promise(r => setTimeout(r, 1));
  return `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10)}`;
}

async function getEsId(companyName: string): Promise<string | null> {
  const r = await client.execute(
    `SELECT e.id FROM EntrySheet e JOIN Company c ON e.companyId=c.id WHERE c.name='${companyName.replace(/'/g, "''")}' LIMIT 1`
  );
  return r.rows.length > 0 ? r.rows[0].id as string : null;
}

interface EsQuestion {
  question: string;
  charLimit?: number;
  answer?: string;
}

const esQuestions: Record<string, EsQuestion[]> = {
  'PwCコンサルティング（BC）': [
    {
      question: 'あなたがこれまでの人生で最も困難だった経験を教えてください。また、その経験からどのような教訓を得ましたか？（400字以内）',
      charLimit: 400,
      answer: 'ONE株式会社での広告営業の初月に、目標比30%の達成率という壁に直面しました。原因分析の結果、ターゲティングの精度不足と発見。業界別・規模別の成約率データを収集し、高成約率セグメントへ集中することで翌月目標を達成。「感覚ではなくデータで仮説を検証する」ことの重要性を実感した経験です。（140字）'
    },
    {
      question: 'PwCコンサルティングのBC職を志望した理由を教えてください。（400字以内）',
      charLimit: 400,
      answer: ''
    },
    {
      question: 'あなたの強みを教えてください。それをコンサルの仕事でどのように活かしますか？（300字以内）',
      charLimit: 300,
      answer: ''
    },
    {
      question: '学生時代に力を入れたこと（ガクチカ）を教えてください。（400字以内）',
      charLimit: 400,
      answer: ''
    },
  ],
  'PwCアドバイザリー（M&A・戦略）': [
    {
      question: '志望動機を教えてください。M&Aや戦略コンサルに興味を持った背景も含めて。（500字以内）',
      charLimit: 500,
      answer: ''
    },
    {
      question: 'これまでに取り組んだプロジェクトや業務経験の中で最も誇りに思う実績を教えてください。（400字以内）',
      charLimit: 400,
      answer: ''
    },
    {
      question: '5年後のキャリアビジョンを教えてください。（300字以内）',
      charLimit: 300,
      answer: ''
    },
  ],
  'BCG': [
    {
      question: 'Why BCG? （英語または日本語、400字以内）',
      charLimit: 400,
      answer: ''
    },
    {
      question: 'あなたのリーダーシップ経験について教えてください。（500字以内）',
      charLimit: 500,
      answer: ''
    },
    {
      question: 'ガクチカ（学生時代に力を入れたこと）（400字以内）',
      charLimit: 400,
      answer: ''
    },
    {
      question: '社会に対してどのようなインパクトを与えたいですか？（300字以内）',
      charLimit: 300,
      answer: ''
    },
  ],
  'デロイト トーマツ コンサルティング': [
    {
      question: '志望動機を教えてください。（400字以内）',
      charLimit: 400,
      answer: ''
    },
    {
      question: 'あなたが解決したい社会課題は何ですか？（300字以内）',
      charLimit: 300,
      answer: ''
    },
    {
      question: 'あなたの強みと弱みを教えてください。（300字以内）',
      charLimit: 300,
      answer: ''
    },
  ],
  'A.T.カーニー': [
    {
      question: 'Why strategy consulting? Why A.T.Kearney? （日英不問、400字）',
      charLimit: 400,
      answer: ''
    },
    {
      question: 'あなたのアカデミックまたは職業上の最大の成果を教えてください。（400字）',
      charLimit: 400,
      answer: ''
    },
  ],
};

async function main() {
  console.log('🚀 ES設問追加開始...\n');
  let addedQuestions = 0;

  for (const [companyName, questions] of Object.entries(esQuestions)) {
    const esId = await getEsId(companyName);
    if (!esId) {
      console.log(`  ⚠️  ES未登録: ${companyName}`);
      continue;
    }

    const existingQ = await client.execute(`SELECT COUNT(*) as count FROM EsQuestion WHERE entrySheetId='${esId}'`);
    if (Number(existingQ.rows[0].count) > 0) {
      console.log(`  ⏭️  スキップ（設問あり）: ${companyName}`);
      continue;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const id = await getId();
      const questionText = q.question.replace(/'/g, "''");
      const answerText = (q.answer ?? '').replace(/'/g, "''");
      const charLimit = q.charLimit ?? 400;

      await client.execute(
        `INSERT INTO EsQuestion (id, entrySheetId, "order", question, answer, charLimit, charCount, createdAt, updatedAt)
         VALUES ('${id}', '${esId}', ${i + 1}, '${questionText}', '${answerText}', ${charLimit}, ${answerText.length}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      );
      addedQuestions++;
    }
    console.log(`  ✅ ${companyName}: ${questions.length}設問追加`);
  }

  const total = await client.execute("SELECT COUNT(*) as count FROM EsQuestion");
  console.log(`\n🎉 ES設問追加完了: ${addedQuestions}件（合計${total.rows[0].count}件）`);

  // 進捗確認
  const progress = await client.execute(
    `SELECT c.name, e.title, e.status, e.deadline,
     (SELECT COUNT(*) FROM EsQuestion WHERE entrySheetId=e.id) as total,
     (SELECT COUNT(*) FROM EsQuestion WHERE entrySheetId=e.id AND length(answer)>0) as answered
     FROM EntrySheet e JOIN Company c ON e.companyId=c.id ORDER BY e.deadline`
  );
  console.log('\nES進捗:');
  progress.rows.forEach(r => console.log(`  [${r.status}] ${r.name}: ${r.answered}/${r.total}設問 - 締切:${r.deadline ?? 'なし'}`));
}

main().catch(e => { console.error('❌', e); process.exit(1); });
