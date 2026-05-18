import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { CompaniesPage } from "@/components/companies/companies-page"

export const dynamic = "force-dynamic"
export const metadata = { title: "企業管理" }

export default async function CompaniesPageRoute() {
  const userId = await getCurrentUserId()

  const rawCompanies = await prisma.company.findMany({
    where: { userId, archivedAt: null },
    include: {
      stages: { orderBy: { order: "asc" } },
      _count: { select: { events: true, caseLogs: true, interviewLogs: true } },
      events: {
        where: { startAt: { gte: new Date() }, completed: false },
        orderBy: { startAt: "asc" },
        take: 1,
        select: { id: true, title: true, type: true, startAt: true },
      },
    },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
  })

  const companies = rawCompanies.map(({ events, ...rest }) => ({ ...rest, nextEvents: events }))

  return <CompaniesPage initialCompanies={companies} />
}
