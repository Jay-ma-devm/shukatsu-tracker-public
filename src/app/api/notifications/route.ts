import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    const now = new Date()
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
    const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    const fiveDaysLater = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [overdueTasks, urgentEs, staleInterviews, upcomingEvents, todayPastEvents, pendingMeetings] = await Promise.all([
      prisma.task.count({
        where: { userId, status: { in: ["todo", "doing"] }, dueAt: { lt: todayStart } },
      }),
      prisma.entrySheet.findMany({
        where: {
          company: { userId },
          deadline: { gte: now, lte: fiveDaysLater },
          status: { notIn: ["submitted", "passed", "failed"] },
        },
        select: { deadline: true },
      }),
      prisma.interviewLog.count({
        where: {
          company: { userId },
          conductedAt: { lt: sevenDaysAgo },
          OR: [{ outcome: null }, { outcome: "pending" }],
        },
      }),
      prisma.event.findMany({
        where: {
          startAt: { gte: now, lte: twoDaysLater },
          completed: false,
          OR: [{ company: { userId } }, { companyId: null }],
        },
        select: { type: true, title: true, startAt: true },
        orderBy: { startAt: "asc" },
      }),
      prisma.event.findMany({
        where: {
          startAt: { gte: todayStart, lt: now },
          completed: false,
          type: { in: ["interview", "case_interview"] },
          OR: [{ company: { userId } }, { companyId: null }],
        },
        select: { type: true },
      }),
      prisma.meeting.count({
        where: {
          userId,
          thankYouSent: false,
          conductedAt: { gte: sevenDaysAgo, lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    type Notification = {
      type: string
      message: string
      href: string
      urgent: boolean
    }

    const notifs: Notification[] = []

    if (overdueTasks > 0) {
      notifs.push({ type: "overdue_task", message: `${overdueTasks}件のタスクが期限超過`, href: "/tasks?status=todo", urgent: true })
    }

    const urgentEsCount = urgentEs.filter((e) => {
      const days = (new Date(e.deadline!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      return days <= 3
    }).length
    if (urgentEsCount > 0) {
      notifs.push({ type: "es_deadline", message: `ES締め切りが${urgentEsCount}件迫っています`, href: "/entry-sheets", urgent: true })
    }

    if (staleInterviews > 0) {
      notifs.push({ type: "pending_result", message: `${staleInterviews}件の面接結果が1週間以上待機中`, href: "/interviews", urgent: false })
    }

    if (todayPastEvents.length > 0) {
      notifs.push({ type: "record_interview", message: `今日の面接を記録しましょう`, href: "/interviews?new=1", urgent: false })
    }

    if (pendingMeetings > 0) {
      notifs.push({ type: "ob_followup", message: `${pendingMeetings}件のOB訪問へのお礼メールが未送信`, href: "/meetings", urgent: false })
    }

    const deadlineEvents = upcomingEvents.filter((e) => e.type === "deadline")
    for (const de of deadlineEvents.slice(0, 3)) {
      const daysUntil = Math.ceil((new Date(de.startAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      notifs.push({
        type: "deadline_event",
        message: daysUntil <= 0 ? `🔴 今日が締切: ${de.title}` : daysUntil === 1 ? `🟠 明日が締切: ${de.title}` : `⏰ ${daysUntil}日後が締切: ${de.title}`,
        href: "/today",
        urgent: daysUntil <= 1,
      })
    }

    const nextInterview = upcomingEvents.find((e) => ["interview", "case_interview"].includes(e.type))
    if (nextInterview) {
      const hoursUntil = Math.round((new Date(nextInterview.startAt).getTime() - now.getTime()) / (1000 * 60 * 60))
      notifs.unshift({
        type: "upcoming_interview",
        message: hoursUntil <= 24 ? `面接まで${hoursUntil}時間: ${nextInterview.title}` : `明日の面接: ${nextInterview.title}`,
        href: "/calendar",
        urgent: hoursUntil <= 24,
      })
    }

    return NextResponse.json(notifs, {
      headers: { "Cache-Control": "private, max-age=60" },
    })
  } catch (error) {
    return apiError(error)
  }
}
