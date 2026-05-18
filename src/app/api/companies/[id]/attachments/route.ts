import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params
    const userId = await getCurrentUserId()

    const company = await prisma.company.findFirst({ where: { id: companyId, userId } })
    if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { name, url, kind } = await request.json()
    if (!name || !url) return NextResponse.json({ error: "name and url required" }, { status: 400 })

    const attachment = await prisma.attachment.create({
      data: { companyId, name, url, kind: kind || "link" },
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params
    const userId = await getCurrentUserId()
    const { searchParams } = new URL(request.url)
    const attId = searchParams.get("attId")
    if (!attId) return NextResponse.json({ error: "attId required" }, { status: 400 })

    const company = await prisma.company.findFirst({ where: { id: companyId, userId } })
    if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.attachment.delete({ where: { id: attId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error)
  }
}
