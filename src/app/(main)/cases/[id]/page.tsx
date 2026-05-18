import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { CaseDetailPageClient } from "@/components/cases/case-detail-page"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const userId = await getCurrentUserId()
  const caseLog = await prisma.caseLog.findFirst({ where: { id, userId } })
  return { title: caseLog?.title ?? "ケース詳細" }
}

export default async function CaseDetailRoute({ params }: Props) {
  const { id } = await params
  const userId = await getCurrentUserId()

  const [caseLog, companies, allCases] = await Promise.all([
    prisma.caseLog.findFirst({
      where: { id, userId },
      include: { company: true },
    }),
    prisma.company.findMany({
      where: { userId, archivedAt: null },
      select: { id: true, name: true },
    }),
    prisma.caseLog.findMany({
      where: { userId },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  if (!caseLog) notFound()

  const currentIdx = allCases.findIndex((c) => c.id === id)
  const prevCaseId = currentIdx > 0 ? allCases[currentIdx - 1]?.id : null
  const nextCaseId = currentIdx < allCases.length - 1 ? allCases[currentIdx + 1]?.id : null

  return <CaseDetailPageClient caseLog={caseLog} companies={companies} prevCaseId={prevCaseId} nextCaseId={nextCaseId} />
}
