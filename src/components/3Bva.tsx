import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      enrollments: {
        include: {
          course: {
            include: {
              modules: {
                include: {
                  lessons: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome, {user?.name}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {user?.enrollments.map((enrollment) => (
          <div
            key={enrollment.id}
            className="bg-card text-card-foreground rounded-lg shadow-lg p-6"
          >
            <h2 className="text-2xl font-semibold mb-4">
              {enrollment.course.title}
            </h2>
            <p className="text-muted-foreground mb-4">
              {enrollment.course.description}
            </p>
            <div className="space-y-4">
              {enrollment.course.modules.map((module) => (
                <div key={module.id} className="border-l-2 border-primary pl-4">
                  <h3 className="font-medium mb-2">{module.title}</h3>
                  <ul className="space-y-2">
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id} className="text-sm">
                        {lesson.title}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
} 