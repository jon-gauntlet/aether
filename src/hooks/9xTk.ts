import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const analyticsRouter = router({
  getCourseAnalytics: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const analytics = await ctx.prisma.courseAnalytics.findUnique({
        where: { courseId: input },
        include: {
          course: true,
        },
      })
      return analytics
    }),

  updateCourseAnalytics: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        totalEnrollments: z.number().optional(),
        activeStudents: z.number().optional(),
        completionRate: z.number().optional(),
        averageRating: z.number().optional(),
        totalFeedback: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { courseId, ...data } = input

      const analytics = await ctx.prisma.courseAnalytics.upsert({
        where: { courseId },
        update: data,
        create: {
          courseId,
          ...data,
        },
      })
      return analytics
    }),

  getOverallAnalytics: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is admin
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
    })
    if (user?.role !== 'ADMIN') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can view overall analytics',
      })
    }

    const analytics = await ctx.prisma.$transaction([
      // Total users by role
      ctx.prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      // Total courses
      ctx.prisma.course.count(),
      // Total active enrollments
      ctx.prisma.enrollment.count({
        where: { status: 'ACTIVE' },
      }),
      // Average completion rate
      ctx.prisma.courseAnalytics.aggregate({
        _avg: {
          completionRate: true,
        },
      }),
    ])

    return {
      usersByRole: analytics[0],
      totalCourses: analytics[1],
      activeEnrollments: analytics[2],
      averageCompletionRate: analytics[3]._avg.completionRate,
    }
  }),

  getInstructorAnalytics: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is instructor
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
    })
    if (user?.role !== 'INSTRUCTOR') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only instructors can view their analytics',
      })
    }

    const courses = await ctx.prisma.course.findMany({
      where: {
        modules: {
          some: {
            lessons: {
              some: {
                assignments: {
                  some: {
                    submissions: {
                      some: {
                        feedback: {
                          some: {
                            userId: ctx.session.user.id,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      include: {
        analytics: true,
        enrollments: true,
        modules: {
          include: {
            lessons: {
              include: {
                assignments: {
                  include: {
                    submissions: {
                      include: {
                        feedback: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    return {
      totalCourses: courses.length,
      totalStudents: new Set(courses.flatMap(c => c.enrollments.map(e => e.userId))).size,
      totalFeedback: courses.reduce((acc, course) => 
        acc + course.modules.reduce((macc, module) => 
          macc + module.lessons.reduce((lacc, lesson) => 
            lacc + lesson.assignments.reduce((aacc, assignment) => 
              aacc + assignment.submissions.reduce((sacc, submission) => 
                sacc + submission.feedback.length, 0), 0), 0), 0), 0),
      averageCompletionRate: courses.reduce((acc, course) => 
        acc + (course.analytics?.completionRate || 0), 0) / courses.length,
    }
  }),
}) 