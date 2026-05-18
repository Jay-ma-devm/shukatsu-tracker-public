import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

// 面接準備テンプレート
const INTERVIEW_PREP_TASKS = (companyName: string, interviewDate: Date) => {
  const dayBefore = new Date(interviewDate)
  dayBefore.setDate(dayBefore.getDate() - 1)
  const twoDaysBefore = new Date(interviewDate)
  twoDaysBefore.setDate(twoDaysBefore.getDate() - 2)
  const threeDaysBefore = new Date(interviewDate)
  threeDaysBefore.setDate(threeDaysBefore.getDate() - 3)

  return [
    { title: `${companyName} 志望動機を再確認・整理`, priority: 5, dueAt: threeDaysBefore, tags: "面接準備" },
    { title: `${companyName} 企業研究・競合分析`, priority: 4, dueAt: threeDaysBefore, tags: "面接準備,企業研究" },
    { title: `${companyName} 自己PRの練習（1分バージョン）`, priority: 5, dueAt: twoDaysBefore, tags: "面接準備" },
    { title: `${companyName} 逆質問リストを作成`, priority: 4, dueAt: twoDaysBefore, tags: "面接準備" },
    { title: `${companyName} 面接場所・交通手段の確認`, priority: 5, dueAt: dayBefore, tags: "面接準備" },
    { title: `${companyName} 服装・持ち物チェック`, priority: 4, dueAt: dayBefore, tags: "面接準備" },
    { title: `${companyName} 面接後のお礼メール準備`, priority: 3, dueAt: interviewDate, tags: "面接準備,お礼" },
  ]
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const body = await request.json()
    const { template, companyId, interviewDate } = body as {
      template: "interview_prep"
      companyId: string
      interviewDate: string
    }

    if (template !== "interview_prep" || !companyId || !interviewDate) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    const company = await prisma.company.findFirst({ where: { id: companyId, userId } })
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })

    const date = new Date(interviewDate)
    const taskTemplates = INTERVIEW_PREP_TASKS(company.name, date)

    const created = await Promise.all(
      taskTemplates.map((t) =>
        prisma.task.create({
          data: { ...t, userId, companyId, status: "todo" },
        })
      )
    )

    return NextResponse.json({ count: created.length, tasks: created }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
