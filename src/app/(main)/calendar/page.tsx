import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { CalendarPageClient } from "@/components/calendar/calendar-page"
import { startOfMonth, endOfMonth, addDays } from "@/lib/utils/date"

export const dynamic = "force-dynamic"
export const metadata = { title: "カレンダー" }

export default async function CalendarRoute() {
  const userId = await getCurrentUserId()
  const now = new Date()
  const from = addDays(startOfMonth(now), -7)
  const to = addDays(endOfMonth(now), 14)

  const [events, companies, dueTasks, dueMeetings] = await Promise.all([
    prisma.event.findMany({
      where: {
        startAt: { gte: from, lte: to },
        OR: [{ company: { userId } }, { companyId: null }],
      },
      include: { company: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.company.findMany({
      where: { userId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: { in: ["todo", "doing"] },
        dueAt: { gte: from, lte: to },
      },
      select: { id: true, title: true, dueAt: true, status: true, priority: true },
      orderBy: { dueAt: "asc" },
    }),
    prisma.meeting.findMany({
      where: {
        userId,
        conductedAt: { gte: from, lte: to },
      },
      select: {
        id: true, title: true, conductedAt: true, type: true,
        company: { select: { id: true, name: true } },
      },
      orderBy: { conductedAt: "asc" },
    }),
  ])

  return <CalendarPageClient initialEvents={events} companies={companies} dueTasks={dueTasks} dueMeetings={dueMeetings} />
}
