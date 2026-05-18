import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { MeetingsPageClient } from "@/components/meetings/meetings-page"

export const dynamic = "force-dynamic"
export const metadata = { title: "OB訪問・カジュアル面談" }

export default async function MeetingsRoute() {
  const userId = await getCurrentUserId()

  const [meetings, companies, activeCompanies] = await Promise.all([
    prisma.meeting.findMany({
      where: { userId },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true, role: true } },
      },
      orderBy: { conductedAt: "desc" },
    }),
    prisma.company.findMany({
      where: { userId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({
      where: { userId, archivedAt: null, status: { in: ["interview", "internship", "case", "final", "screening"] } },
      select: { id: true, name: true, status: true },
    }),
  ])

  return <MeetingsPageClient initialMeetings={meetings} companies={companies} activeCompanies={activeCompanies} />
}
