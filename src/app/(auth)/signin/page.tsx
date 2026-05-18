import { redirect } from "next/navigation"
import { auth, getAuthMode } from "@/lib/auth"
import { SignInPageClient } from "@/components/auth/signin-page"

export const metadata = { title: "サインイン" }

export default async function SignInPage() {
  if (getAuthMode() === "local") {
    redirect("/")
  }

  const session = await auth()
  if (session?.user) {
    redirect("/")
  }

  return <SignInPageClient />
}
