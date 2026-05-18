import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { contactId } = await params
    const contact = await prisma.contact.findUnique({ where: { id: contactId } })
    if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 })
    await prisma.contact.delete({ where: { id: contactId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { contactId } = await params
    const body = await request.json()
    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: body,
    })
    return NextResponse.json(contact)
  } catch (error) {
    return apiError(error)
  }
}
