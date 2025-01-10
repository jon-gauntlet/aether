import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { CourseList } from "@/components/dashboard/course-list"

export const metadata = {
  title: "Dashboard",
  description: "Manage your courses and learning progress.",
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Welcome back! Here's an overview of your learning journey."
      />
      <div className="grid gap-10">
        <CourseList />
      </div>
    </DashboardShell>
  )
} 