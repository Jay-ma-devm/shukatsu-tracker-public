import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { CasesPageClient } from "@/components/cases/cases-page"

export const dynamic = "force-dynamic"
export const metadata = { title: "ケース練習" }

export default async function CasesRoute() {
  const userId = await getCurrentUserId()

  const [cases, companies, caseCompanies] = await Promise.all([
    prisma.caseLog.findMany({
      where: { userId },
      include: { company: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.company.findMany({
      where: { userId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({
      where: { userId, archivedAt: null, status: { in: ["interview", "internship", "case", "final"] } },
      select: { id: true, name: true, status: true },
      orderBy: { priority: "desc" },
      take: 5,
    }),
  ])

  return <CasesPageClient initialCases={cases} companies={companies} interviewCompanies={caseCompanies} />
}
