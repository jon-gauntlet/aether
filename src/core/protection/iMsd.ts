import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const analyticsRouter = router({
  getCourseAnalytics: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: courseId }) => {
      const course = await ctx.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          enrollments: {
            include: {
              user: true,
            },
          },
          modules: {
            include: {
              lessons: {
                include: {
                  progress: true,
                },
              },
            },
          },
        },
      })

      if (!course) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Course not found',
        })
      }

      const totalEnrollments = course.enrollments.length
      const activeStudents = course.enrollments.filter(
        (e) => e.user.role === 'STUDENT'
      ).length

      const totalLessons = course.modules.reduce(
        (acc, module) => acc + module.lessons.length,
        0
      )

      const completedLessons = course.modules.reduce((acc, module) => {
        return (
          acc +
          module.lessons.reduce(
            (lessonAcc, lesson) =>
              lessonAcc +
              lesson.progress.filter((p) => p.completed).length,
            0
          )
        )
      }, 0)

      const completionRate =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0

      return {
        totalEnrollments,
        activeStudents,
        totalLessons,
        completedLessons,
        completionRate,
      }
    }),

  updateCourseAnalytics: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        totalEnrollments: z.number(),
        activeStudents: z.number(),
        completionRate: z.number(),
        averageRating: z.number().optional(),
        totalFeedback: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only admins and instructors can update analytics
      if (!['ADMIN', 'INSTRUCTOR'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins and instructors can update analytics',
        })
      }

      const analytics = await ctx.prisma.courseAnalytics.upsert({
        where: { courseId: input.courseId },
        create: input,
        update: input,
      })
      return analytics
    }),

  getOverallAnalytics: protectedProcedure.query(async ({ ctx }) => {
    // Only admins can view overall analytics
    if (ctx.session.user.role !== 'ADMIN') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can view overall analytics',
      })
    }

    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalLessons,
      completedLessons,
    ] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.course.count(),
      ctx.prisma.enrollment.count(),
      ctx.prisma.lesson.count(),
      ctx.prisma.lessonProgress.count({
        where: { completed: true },
      }),
    ])

    const usersByRole = await ctx.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    })

    const averageCompletionRate =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0

    return {
      totalUsers,
      usersByRole: usersByRole.reduce(
        (acc, { role, _count }) => ({ ...acc, [role]: _count }),
        {}
      ),
      totalCourses,
      totalEnrollments,
      averageCompletionRate,
    }
  }),

  getInstructorAnalytics: protectedProcedure.query(async ({ ctx }) => {
    // Only instructors can view their analytics
    if (ctx.session.user.role !== 'INSTRUCTOR') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only instructors can view their analytics',
      })
    }

    const courses = await ctx.prisma.course.findMany({
      where: {
        instructorId: ctx.session.user.id,
      },
      include: {
        enrollments: true,
        modules: {
          include: {
            lessons: {
              include: {
                progress: true,
              },
            },
          },
        },
      },
    })

    const totalCourses = courses.length
    const totalStudents = new Set(
      courses.flatMap((c) => c.enrollments.map((e) => e.userId))
    ).size

    const totalLessons = courses.reduce(
      (acc, course) =>
        acc +
        course.modules.reduce(
          (moduleAcc, module) => moduleAcc + module.lessons.length,
          0
        ),
      0
    )

    const completedLessons = courses.reduce(
      (acc, course) =>
        acc +
        course.modules.reduce(
          (moduleAcc, module) =>
            moduleAcc +
            module.lessons.reduce(
              (lessonAcc, lesson) =>
                lessonAcc +
                lesson.progress.filter((p) => p.completed).length,
              0
            ),
          0
        ),
      0
    )

    const averageCompletionRate =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0

    return {
      totalCourses,
      totalStudents,
      totalLessons,
      completedLessons,
      averageCompletionRate,
    }
  }),
}) 