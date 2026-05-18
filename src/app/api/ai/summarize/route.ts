import { NextResponse } from "next/server"
import { apiError } from "@/lib/api-error"
import { getCurrentUserId } from "@/lib/get-user"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    // プラン制限チェック（localモードはスキップ）
    if (process.env.NEXT_PUBLIC_AUTH_MODE !== "local") {
      try {
        const userId = await getCurrentUserId()
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { stripePriceId: true },
        }).catch(() => null)

        const isPro = !!dbUser?.stripePriceId
        if (!isPro) {
          return NextResponse.json(
            { error: "AI機能はProプランのみ利用可能です", code: "PLAN_LIMIT" },
            { status: 403 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: "認証が必要です" },
          { status: 401 }
        )
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY が設定されていません" },
        { status: 503 }
      )
    }

    const { text, type } = await request.json()
    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 })
    }

    const prompts: Record<string, string> = {
      company_notes: `以下の就活メモを整理して、重要なポイントを箇条書きで3〜5点にまとめてください:\n\n${text}`,
      case_feedback: `以下のケース面接の振り返りを分析してください。以下の3点を簡潔にまとめてください:\n1. 良かった点（1〜2点）\n2. 改善すべき点（2〜3点）\n3. 次回に向けた具体的な練習方法（1〜2点）\n\n${text}`,
      case_next_practice: `以下のケース面接の振り返りをもとに、弱点を克服するための具体的な練習問題を2〜3問生成してください。難易度は同程度で、異なる切り口の問題を提案してください:\n\n${text}`,
      interview_prep: `以下の企業情報に基づいて、面接で聞くべき質問を3〜5つ提案してください:\n\n${text}`,
      es_improve: `以下の就活エントリーシートの設問と回答を読んで、回答をより魅力的にするための具体的な改善点を3点提案してください。回答の良い点も1点挙げてください:\n\n${text}`,
      es_draft: `以下のES設問に対して、就活生向けの回答の雛形（200-400字程度）を作成してください。具体例のプレースホルダーを【】で示してください:\n\n${text}`,
      selection_analysis: `以下の就活選考状況を分析して、現在の状況評価と次に取るべきアクションを箇条書きで提案してください:\n\n${text}`,
      interview_next_step: `以下の面接記録を読んで、結果に応じた次のステップを3つ提案してください。通過の場合は次の選考対策、不通過の場合は改善点と次の会社での対策、結果待ちの場合はフォローアップ方法を提案してください:\n\n${text}`,
      thank_you_email: `以下のOB訪問・面談情報をもとに、就活生向けのお礼メールの本文を作成してください。丁寧で誠実なトーンで、具体的な話の内容に触れつつ、200〜300字程度にまとめてください:\n\n${text}`,
      self_pr: `以下の経験・スキル情報をもとに、就活の自己PRを作成してください。具体的なエピソードのプレースホルダーを【】で示しつつ、強みと成長を400字程度でアピールしてください:\n\n${text}`,
      interview_full_prep: `以下の企業情報と過去の面接データをもとに、総合的な面接準備ガイドを作成してください。以下の4点を各3〜5項目でまとめてください:\n1. 企業への志望動機のポイント\n2. 想定される面接質問と回答のポイント\n3. アピールすべき経験・スキル\n4. 面接官への質問リスト\n\n${text}`,
      email_template: `以下の種別・用途のメールテンプレートの本文を作成してください。プレースホルダーは{{変数名}}の形式で示し、就活生らしい丁寧な文体で作成してください:\n\n${text}`,
      interview_answer_feedback: `あなたは就活の面接コーチです。以下の面接の質問と回答を評価してください。\n評価は以下の形式でお願いします:\n1. 総合評価（5点満点で）\n2. 良かった点（2〜3点）\n3. 改善できる点（2〜3点）\n4. より良い回答の例（100〜150字で）\n\n${text}`,
      daily_briefing: `あなたは就活コーチです。以下の就活状況データをもとに、今日の就活モーニングブリーフィングを作成してください。\n以下を含めて200字以内で簡潔にまとめてください:\n1. 今日の優先タスク（最大3つ）\n2. 注意が必要な事項\n3. 励ましのメッセージ\n\n${text}`,
      weekly_summary: `あなたは就活コーチです。以下の今週の就活活動データをもとに、週次サマリーを作成してください。\n以下の形式で300字以内でまとめてください:\n・今週の成果と振り返り\n・改善すべき点\n・来週の目標提案\n\n${text}`,
      motivation_statement: `あなたは就活コンサルタントです。以下の企業情報と学生のバックグラウンドをもとに、説得力のある志望動機の文章を作成してください。\n以下の要素を必ず含めてください:\n1. なぜこの業界・職種なのか（外部動機）\n2. なぜこの企業なのか（企業固有の理由）\n3. 入社後に実現したいこと（内部動機・将来像）\n300〜400字程度で、自然な日本語で作成してください:\n\n${text}`,
      strengths_analysis: `あなたは就活コーチです。以下のキャリア経験・スキル情報をもとに、就活における強みと弱みを分析してください。\n以下の形式で回答してください:\n\n【強み】（3〜4点）\n・（具体的なエピソードを交えた強み）\n\n【弱み・改善点】（2〜3点）\n・（弱みとその克服方法）\n\n【アピール戦略】\n・（面接でどうアピールすべきか）\n\n${text}`,
      withdrawal_email: `あなたは就活コンサルタントです。以下の企業情報をもとに、丁寧で誠実な選考辞退メールの件名と本文を作成してください。\n感謝の気持ちを伝えつつ、簡潔で失礼のない文体で作成してください（150〜200字程度）。\n件名と本文を分けて出力してください:\n\n${text}`,
      reverse_questions: `あなたは就活コーチです。以下の企業情報をもとに、面接で面接官に聞くべき「逆質問リスト」を作成してください。\n以下の3カテゴリで各2〜3問、合計6〜8問を提案してください:\n\n【仕事内容・チームについて】\n（入社後の具体的な業務や配属先に関する質問）\n\n【成長・キャリアについて】\n（入社後の成長機会やキャリアパスに関する質問）\n\n【企業文化・雰囲気について】\n（職場環境や働き方に関する質問）\n\n質問は具体的で、「はい/いいえ」で答えられないオープンな形式にしてください:\n\n${text}`,
      es_comprehensive: `あなたは就活のESコーチです。以下の就活生の情報と企業・設問情報をもとに、このES設問への回答を400字程度で作成してください。\n以下の構造を意識してください:\n1. 結論（最初に主張を明確に）\n2. 具体的なエピソード（数字や成果を含む）\n3. そこから得た学び\n4. 入社後への活かし方\n\nプレースホルダーは【具体的な数字や事実】のように示してください:\n\n${text}`,
      final_interview_prep: `あなたは就活の最終面接コーチです。以下の企業情報と選考経緯をもとに、最終面接に向けた戦略と準備ポイントをまとめてください。\n以下の形式で出力してください:\n\n【最終面接の意図・見られるポイント】\n\n【必ず準備すべき回答（3つ）】\n1. なぜこの会社なのか（他社との差別化）\n2. 入社後どう貢献するか（具体的なビジョン）\n3. 将来のキャリアプラン（5年後）\n\n【逆質問の推薦（3つ）】\n\n【注意点・弱点の補強】\n\n${text}`,
      internship_strategy: `あなたは就活コーチです。以下のインターンシップ情報をもとに、インターンで高評価を得るための戦略と行動指針を作成してください。\n以下の形式で出力してください:\n\n【このインターンで見られていること】\n\n【高評価を得るための行動指針（5つ）】\n\n【準備すべきフレームワーク・知識】\n\n【インターン中の注意点】\n\n【インターン後のフォロー方法】\n\n${text}`,
    }

    const prompt = prompts[type] ?? `以下のテキストを300字以内で要約してください:\n\n${text}`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: "AI API エラー" }, { status: 500 })
    }

    const data = await response.json()
    const summary = data.content[0]?.text ?? ""

    return NextResponse.json({ summary })
  } catch (error) {
    return apiError(error)
  }
}
