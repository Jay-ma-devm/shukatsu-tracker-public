import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { ArchivedCompaniesClient } from "@/components/companies/archived-companies"

export const dynamic = "force-dynamic"
export const metadata = { title: "アーカイブ済み企業" }

export default async function ArchivedCompaniesRoute() {
  const userId = await getCurrentUserId()

  const companies = await prisma.company.findMany({
    where: { userId, archivedAt: { not: null } },
    include: { _count: { select: { stages: true, events: true } } },
    orderBy: { archivedAt: "desc" },
  })

  return <ArchivedCompaniesClient companies={companies} />
}
