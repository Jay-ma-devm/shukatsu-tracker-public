import { auth, LOCAL_DEMO_USER, getAuthMode } from "@/lib/auth"
import type { LocalUser } from "@/types"

type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export async function getCurrentUser(): Promise<SessionUser | LocalUser> {
  if (getAuthMode() === "local") {
    return LOCAL_DEMO_USER
  }
  const session = await auth()
  if (!session?.user) {
    return LOCAL_DEMO_USER
  }
  return session.user
}

export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser()
  return user.id
}
