import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function CourseList() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      },
    },
  })

  if (enrollments.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h2 className="mt-6 text-xl font-semibold">No courses enrolled</h2>
          <p className="mb-8 mt-2 text-center text-sm font-normal leading-6 text-muted-foreground">
            You haven't enrolled in any courses yet. Browse our catalog to get started.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border rounded-md border">
      {enrollments.map((enrollment) => (
        <div
          key={enrollment.id}
          className="flex items-center justify-between p-4"
        >
          <div className="grid gap-1">
            <h3 className="font-semibold">{enrollment.course.title}</h3>
            <p className="text-sm text-muted-foreground">
              {enrollment.course.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">
                  {enrollment.course.modules.length} modules
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">
                  {enrollment.course.modules.reduce(
                    (acc, module) => acc + module.lessons.length,
                    0
                  )}{" "}
                  lessons
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 