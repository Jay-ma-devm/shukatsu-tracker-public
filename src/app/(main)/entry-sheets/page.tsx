import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { EntrySheetListClient } from "@/components/entry-sheets/entry-sheet-list"

export const dynamic = "force-dynamic"
export const metadata = { title: "エントリーシート" }

export default async function EntrySheetListRoute() {
  const userId = await getCurrentUserId()

  const [sheets, companies] = await Promise.all([
    prisma.entrySheet.findMany({
      where: { company: { userId } },
      include: {
        company: { select: { id: true, name: true } },
        questions: { orderBy: { order: "asc" } },
      },
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
    }),
    prisma.company.findMany({
      where: { userId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return <EntrySheetListClient initialSheets={sheets} companies={companies} />
}
