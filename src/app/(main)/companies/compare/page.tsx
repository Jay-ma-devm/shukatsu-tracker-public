import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { ComparePageClient } from "@/components/companies/compare-page"

export const dynamic = "force-dynamic"
export const metadata = { title: "企業比較" }

export default async function CompareRoute() {
  const userId = await getCurrentUserId()

  const companies = await prisma.company.findMany({
    where: { userId, archivedAt: null },
    include: {
      stages: { orderBy: { order: "asc" } },
      _count: { select: { interviewLogs: true, tasks: true, entrySheets: true } },
    },
    orderBy: [{ priority: "desc" }],
  })

  return <ComparePageClient companies={companies} />
}
