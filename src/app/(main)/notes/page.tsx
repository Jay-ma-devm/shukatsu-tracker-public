import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { NotesPageClient } from "@/components/notes/notes-page"

export const dynamic = "force-dynamic"
export const metadata = { title: "ノート" }

export default async function NotesRoute() {
  const userId = await getCurrentUserId()

  const [notes, companies] = await Promise.all([
    prisma.note.findMany({
      where: { userId },
      include: { company: { select: { id: true, name: true } } },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.company.findMany({
      where: { userId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return <NotesPageClient initialNotes={notes} companies={companies} />
}
