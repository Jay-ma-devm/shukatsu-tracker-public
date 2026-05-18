import { auth, getAuthMode } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Next.js 16 の Proxy（middleware に相当）
 * NEXT_PUBLIC_AUTH_MODE=auth のとき未認証ユーザーを /signin にリダイレクト
 */
export default async function proxy(request: NextRequest) {
  // localモードでは常にスルー
  if (getAuthMode() === "local") return NextResponse.next()

  const { pathname } = request.nextUrl

  // 認証不要のパス
  const publicPaths = ["/signin", "/api/auth", "/api/health", "/_next", "/favicon"]
  if (publicPaths.some(p => pathname.startsWith(p))) return NextResponse.next()

  const session = await auth()
  if (!session?.user) {
    const url = new URL("/signin", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
