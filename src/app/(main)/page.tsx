export const dynamic = "force-dynamic"

import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/get-user"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { OnboardingGate } from "@/components/onboarding/onboarding-gate"
import { startOfDay, endOfDay } from "@/lib/utils/date"

export const metadata = { title: "ダッシュボード" }

export default async function Home() {
  const user = await getCurrentUser()
  const userId = user.id
  const todayStart = startOfDay(new Date())
  const todayEnd = endOfDay(new Date())
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const [companies, upcomingEvents, recentCases, todayTasks, pendingTasks, weeklyActivity, esProgress] = await Promise.all([
    prisma.company.findMany({
      where: { userId, archivedAt: null },
      include: {
        stages: true,
        _count: { select: { events: true } },
        events: {
          where: { startAt: { gte: new Date() }, completed: false },
          orderBy: { startAt: "asc" },
          take: 1,
          select: { id: true, title: true, type: true, startAt: true },
        },
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    }).then((rows) => rows.map(({ events, ...rest }) => ({ ...rest, nextEvents: events }))),

    prisma.event.findMany({
      where: {
        startAt: { gte: new Date() },
        completed: false,
        OR: [{ company: { userId } }, { companyId: null }],
      },
      include: { company: true },
      orderBy: { startAt: "asc" },
      take: 7,
    }),

    prisma.caseLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),

    prisma.task.findMany({
      where: { userId, status: { in: ["todo", "doing"] }, dueAt: { gte: todayStart, lte: todayEnd } },
      include: { company: { select: { id: true, name: true } } },
      orderBy: { priority: "desc" },
    }),

    prisma.task.findMany({
      where: { userId, status: { in: ["todo", "doing"] }, dueAt: { lt: todayStart } },
      include: { company: { select: { id: true, name: true } } },
      orderBy: { dueAt: "asc" },
      take: 5,
    }),

    // 今週の活動統計（6クエリ → $transaction で1回）
    prisma.$transaction([
      prisma.company.count({ where: { userId, archivedAt: null, updatedAt: { gte: sevenDaysAgo } } }),
      prisma.task.count({ where: { userId, status: "done", updatedAt: { gte: sevenDaysAgo } } }),
      prisma.interviewLog.count({ where: { company: { userId }, conductedAt: { gte: sevenDaysAgo } } }),
      prisma.caseLog.count({ where: { userId, createdAt: { gte: sevenDaysAgo } } }),
      prisma.caseLog.count({ where: { userId, createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
      prisma.task.count({ where: { userId, status: "done", updatedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
      prisma.interviewLog.count({ where: { company: { userId }, conductedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    ]).then(([companiesUpdated, tasksCompleted, interviews, cases, casesLastWeek, tasksLastWeek, interviewsLastWeek]) => ({
      companiesUpdated, tasksCompleted, interviews, cases, casesLastWeek, tasksLastWeek, interviewsLastWeek,
    })).catch(() => ({ companiesUpdated: 0, tasksCompleted: 0, interviews: 0, cases: 0, casesLastWeek: 0, tasksLastWeek: 0, interviewsLastWeek: 0 })),

    prisma.entrySheet.findMany({
      where: { company: { userId }, status: { notIn: ["passed", "failed"] } },
      include: { questions: { select: { id: true, answer: true } }, company: { select: { id: true, name: true } } },
      orderBy: { deadline: "asc" },
      take: 8,
    }).then((sheets) => sheets.map((s) => ({
      id: s.id,
      title: s.title,
      companyName: s.company?.name ?? "",
      companyId: s.company?.id ?? "",
      answered: s.questions.filter((q) => q.answer && q.answer.length > 0).length,
      total: s.questions.length,
      deadline: s.deadline ? s.deadline.toISOString() : null,
      status: s.status,
    }))).catch(() => [] as { id: string; title: string; companyName: string; companyId: string; answered: number; total: number; deadline: string | null; status: string }[]),
  ])

  return (
    <OnboardingGate companyCount={companies.length}>
      <DashboardPage
        companies={companies}
        upcomingEvents={upcomingEvents}
        recentCases={recentCases}
        todayTasks={todayTasks}
        pendingTasks={pendingTasks}
        esProgress={esProgress}
        weeklyActivity={weeklyActivity}
        userName={user.name ?? null}
      />
    </OnboardingGate>
  )
}
