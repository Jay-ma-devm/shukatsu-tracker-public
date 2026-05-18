import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { EntrySheetDetailClient } from "@/components/entry-sheets/entry-sheet-detail"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const sheet = await prisma.entrySheet.findUnique({
    where: { id },
    include: { company: { select: { name: true } } },
  })
  return { title: sheet ? `${sheet.company.name} ES` : "ES詳細" }
}

export default async function EntrySheetDetailRoute({ params }: Props) {
  const { id } = await params
  const userId = (await import("@/lib/get-user").then((m) => m.getCurrentUserId()))
  const [sheet, allSheets] = await Promise.all([
    prisma.entrySheet.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        questions: { orderBy: { order: "asc" } },
      },
    }),
    prisma.entrySheet.findMany({
      where: { company: { userId } },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    }),
  ])
  if (!sheet) notFound()
  const currentIdx = allSheets.findIndex((s) => s.id === id)
  const prevId = currentIdx > 0 ? allSheets[currentIdx - 1]?.id : null
  const nextId = currentIdx < allSheets.length - 1 ? allSheets[currentIdx + 1]?.id : null
  return <EntrySheetDetailClient sheet={sheet} prevId={prevId} nextId={nextId} />
}
