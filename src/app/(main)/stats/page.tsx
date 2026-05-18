import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { StatsPageClient } from "@/components/stats/stats-page"

export const dynamic = "force-dynamic"
export const metadata = { title: "就活統計" }

export default async function StatsRoute() {
  const userId = await getCurrentUserId()

  const [companies, tasks, interviews, cases, meetings, esStats, careerStats] = await Promise.all([
    prisma.company.findMany({
      where: { userId },
      select: { status: true, industry: true, priority: true, appliedAt: true, archivedAt: true },
    }),
    prisma.task.findMany({
      where: { userId },
      select: { status: true, priority: true, dueAt: true, createdAt: true },
    }),
    prisma.interviewLog.findMany({
      where: { company: { userId } },
      select: { type: true, outcome: true, rating: true, conductedAt: true, duration: true },
    }),
    prisma.caseLog.findMany({
      where: { userId },
      select: { category: true, rating: true, difficulty: true, duration: true, createdAt: true },
    }),
    prisma.meeting.findMany({
      where: { userId },
      select: { type: true, thankYouSent: true, conductedAt: true, duration: true },
    }),
    prisma.entrySheet.findMany({
      where: { company: { userId } },
      include: { questions: { select: { answer: true } } },
    }),
    prisma.careerEntry.groupBy({
      by: ["type"],
      where: { userId },
      _count: { id: true },
    }).catch(() => [] as { type: string; _count: { id: number } }[]),
  ])

  const esStatsData = {
    totalSheets: esStats.length,
    totalQuestions: esStats.reduce((s, e) => s + e.questions.length, 0),
    answeredQuestions: esStats.reduce((s, e) => s + e.questions.filter((q) => q.answer && q.answer.length > 0).length, 0),
  }

  // 活動カレンダーデータ (90日間)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const activityMap = new Map<string, number>()

  const addActivity = (date: Date | null | undefined) => {
    if (!date) return
    const key = new Date(date).toISOString().split("T")[0]
    activityMap.set(key, (activityMap.get(key) ?? 0) + 1)
  }

  tasks.filter((t) => t.status === "done" && t.dueAt && t.dueAt >= ninetyDaysAgo).forEach((t) => addActivity(t.dueAt))
  interviews.filter((i) => new Date(i.conductedAt) >= ninetyDaysAgo).forEach((i) => addActivity(new Date(i.conductedAt)))
  cases.filter((c) => new Date(c.createdAt) >= ninetyDaysAgo).forEach((c) => addActivity(new Date(c.createdAt)))
  meetings.filter((m) => new Date(m.conductedAt) >= ninetyDaysAgo).forEach((m) => addActivity(new Date(m.conductedAt)))

  const activityData = Array.from({ length: 90 }, (_, i) => {
    const d = new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000)
    const key = d.toISOString().split("T")[0]
    return { date: key, count: activityMap.get(key) ?? 0 }
  })

  return (
    <StatsPageClient
      companies={companies}
      tasks={tasks}
      interviews={interviews}
      cases={cases}
      meetings={meetings}
      esStats={esStatsData}
      activityData={activityData}
      careerStats={careerStats.map((g) => ({ type: g.type, count: g._count.id }))}
    />
  )
}
