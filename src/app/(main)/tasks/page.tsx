import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { TasksPageClient } from "@/components/tasks/tasks-page"

export const dynamic = "force-dynamic"
export const metadata = { title: "タスク" }

export default async function TasksRoute() {
  const userId = await getCurrentUserId()

  const [tasks, companies] = await Promise.all([
    prisma.task.findMany({
      where: { userId },
      include: { company: { select: { id: true, name: true } } },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { dueAt: "asc" }],
    }),
    prisma.company.findMany({
      where: { userId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return <TasksPageClient initialTasks={tasks} companies={companies} />
}
