import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { InterviewsPageClient } from "@/components/interviews/interviews-page"

export const dynamic = "force-dynamic"
export const metadata = { title: "面接ログ" }

export default async function InterviewsRoute() {
  const userId = await getCurrentUserId()

  const [logs, companies] = await Promise.all([
    prisma.interviewLog.findMany({
      where: { company: { userId } },
      include: {
        company: { select: { id: true, name: true, status: true } },
        stage: { select: { id: true, name: true } },
      },
      orderBy: { conductedAt: "desc" },
    }),
    prisma.company.findMany({
      where: { userId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return <InterviewsPageClient initialLogs={logs} companies={companies} />
}
