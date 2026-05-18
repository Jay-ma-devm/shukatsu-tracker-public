import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { KanbanPage } from "@/components/companies/kanban-page"

export const dynamic = "force-dynamic"
export const metadata = { title: "カンバン" }

export default async function KanbanRoute() {
  const userId = await getCurrentUserId()

  const rawCompanies = await prisma.company.findMany({
    where: { userId, archivedAt: null },
    include: {
      stages: { orderBy: { order: "asc" } },
      events: {
        where: { startAt: { gte: new Date() }, completed: false },
        orderBy: { startAt: "asc" },
        take: 1,
        select: { id: true, title: true, type: true, startAt: true },
      },
    },
    orderBy: [{ priority: "desc" }],
  })

  const companies = rawCompanies.map(({ events, ...rest }) => ({ ...rest, nextEvents: events }))

  return <KanbanPage initialCompanies={companies} />
}
