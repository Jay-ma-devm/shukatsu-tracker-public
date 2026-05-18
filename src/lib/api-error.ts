import { NextResponse } from "next/server"
import { ZodError } from "zod"

export function apiError(error: unknown, defaultMsg = "サーバーエラーが発生しました"): NextResponse {
  console.error("[API Error]", error)

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "入力値が正しくありません", details: error.flatten() },
      { status: 400 }
    )
  }

  if (error instanceof Error) {
    const msg = error.message
    if (msg.includes("Record to update not found") || msg.includes("not found")) {
      return NextResponse.json({ error: "データが見つかりません" }, { status: 404 })
    }
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "すでに存在するデータです" }, { status: 409 })
    }
    return NextResponse.json({ error: defaultMsg }, { status: 500 })
  }

  return NextResponse.json({ error: defaultMsg }, { status: 500 })
}
