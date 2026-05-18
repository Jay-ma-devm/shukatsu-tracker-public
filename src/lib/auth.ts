import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { prisma } from "@/lib/db"
import type { LocalUser } from "@/types"

export const LOCAL_DEMO_USER: LocalUser = {
  id: "local-user",
  name: "Demo User",
  email: "demo@example.com",
  image: null,
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      // Google ログイン時にユーザーをDBにupsert（失敗してもサインインは許可）
      try {
        await prisma.user.upsert({
          where: { email: user.email },
          update: { name: user.name ?? undefined, image: user.image ?? undefined },
          create: {
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
          },
        })
      } catch (e) {
        console.error("[Auth] user upsert error:", e)
        // upsertが失敗してもサインインはブロックしない
      }
      return true
    },
    async jwt({ token }) {
      // emailからDBのuser.idを取得してtokenに保存
      if (token.email && !token.userId) {
        try {
          const u = await prisma.user.findUnique({
            where: { email: token.email },
            select: { id: true },
          })
          if (u) token.userId = u.id
        } catch {}
      }
      return token
    },
    session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string
      return session
    },
  },
})

export function getAuthMode(): "local" | "auth" {
  return process.env.NEXT_PUBLIC_AUTH_MODE === "auth" ? "auth" : "local"
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}
