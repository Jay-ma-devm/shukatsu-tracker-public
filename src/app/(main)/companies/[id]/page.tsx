import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { CompanyDetailPage } from "@/components/companies/company-detail-page"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const userId = await getCurrentUserId()
  const company = await prisma.company.findFirst({ where: { id, userId } })
  return { title: company?.name ?? "企業詳細" }
}

export default async function CompanyDetailRoute({ params }: Props) {
  const { id } = await params
  const userId = await getCurrentUserId()

  const [company, allCompanies] = await Promise.all([
    prisma.company.findFirst({
      where: { id, userId },
      include: {
        stages: { orderBy: { order: "asc" } },
        events: { orderBy: { startAt: "asc" } },
        caseLogs: { orderBy: { createdAt: "desc" } },
        contacts: { include: { _count: { select: { meetings: true } } }, orderBy: { createdAt: "asc" } },
        attachments: { orderBy: { createdAt: "desc" } },
        tasks: { orderBy: [{ status: "asc" }, { priority: "desc" }] },
        entrySheets: {
          include: { questions: { orderBy: { order: "asc" } } },
          orderBy: { createdAt: "desc" },
        },
        interviewLogs: { include: { stage: { select: { id: true, name: true } } }, orderBy: { conductedAt: "desc" } },
        companyNotes: { orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }] },
      },
    }),
    prisma.company.findMany({
      where: { userId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!company) notFound()

  return <CompanyDetailPage company={company} allCompanies={allCompanies} />
}
