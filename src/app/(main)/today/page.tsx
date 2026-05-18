export const dynamic = "force-dynamic"

import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { TodayPageClient } from "@/components/today/today-page"
import { startOfDay, endOfDay } from "@/lib/utils/date"

export const metadata = { title: "今日やること" }

export default async function TodayRoute() {
  const userId = await getCurrentUserId()
  const todayStart = startOfDay(new Date())
  const todayEnd = endOfDay(new Date())
  const threeDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const [todayTasks, overdueTasks, upcomingTasks, todayEvents, upcomingEvents, urgentCompanies] = await Promise.all([
    // 今日期限タスク
    prisma.task.findMany({
      where: { userId, status: { in: ["todo", "doing"] }, dueAt: { gte: todayStart, lte: todayEnd } },
      include: { company: { select: { id: true, name: true } } },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
    }),
    // 期限超過タスク
    prisma.task.findMany({
      where: { userId, status: { in: ["todo", "doing"] }, dueAt: { lt: todayStart } },
      include: { company: { select: { id: true, name: true } } },
      orderBy: [{ dueAt: "asc" }],
    }),
    // 3日以内タスク（今日除く）
    prisma.task.findMany({
      where: { userId, status: { in: ["todo", "doing"] }, dueAt: { gt: todayEnd, lte: threeDaysLater } },
      include: { company: { select: { id: true, name: true } } },
      orderBy: [{ dueAt: "asc" }, { priority: "desc" }],
    }),
    // 今日のイベント
    prisma.event.findMany({
      where: {
        startAt: { gte: todayStart, lte: todayEnd },
        completed: false,
        OR: [{ company: { userId } }, { companyId: null }],
      },
      include: { company: { select: { id: true, name: true } } },
      orderBy: { startAt: "asc" },
    }),
    // 3日以内のイベント（今日除く）
    prisma.event.findMany({
      where: {
        startAt: { gt: todayEnd, lte: threeDaysLater },
        completed: false,
        OR: [{ company: { userId } }, { companyId: null }],
      },
      include: { company: { select: { id: true, name: true } } },
      orderBy: { startAt: "asc" },
      take: 10,
    }),
    // 面接中・screening 企業（要アクション）
    prisma.company.findMany({
      where: { userId, archivedAt: null, status: { in: ["interview", "internship", "case", "final", "screening"] } },
      select: { id: true, name: true, status: true, priority: true, notes: true },
      orderBy: [{ priority: "desc" }, { updatedAt: "asc" }],
      take: 10,
    }),
  ])

  return (
    <TodayPageClient
      todayTasks={todayTasks}
      overdueTasks={overdueTasks}
      upcomingTasks={upcomingTasks}
      todayEvents={todayEvents}
      upcomingEvents={upcomingEvents}
      urgentCompanies={urgentCompanies}
    />
  )
}
