import { z } from "zod"
import { router, protectedProcedure } from "../trpc"

export const enrollmentRouter = router({
  enroll: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: courseId }) => {
      const enrollment = await ctx.prisma.enrollment.create({
        data: {
          userId: ctx.session.user.id,
          courseId,
        },
        include: {
          course: true,
        },
      })
      return enrollment
    }),

  unenroll: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: courseId }) => {
      await ctx.prisma.enrollment.delete({
        where: {
          userId_courseId: {
            userId: ctx.session.user.id,
            courseId,
          },
        },
      })
      return true
    }),

  byCourse: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: courseId }) => {
      const enrollments = await ctx.prisma.enrollment.findMany({
        where: { courseId },
        include: {
          user: true,
        },
      })
      return enrollments
    }),

  byUser: protectedProcedure.query(async ({ ctx }) => {
    const enrollments = await ctx.prisma.enrollment.findMany({
      where: { userId: ctx.session.user.id },
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
    return enrollments
  }),

  checkEnrollment: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: courseId }) => {
      const enrollment = await ctx.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: ctx.session.user.id,
            courseId,
          },
        },
      })
      return !!enrollment
    }),

  updateProgress: protectedProcedure
    .input(
      z.object({
        lessonId: z.string(),
        completed: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const progress = await ctx.prisma.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId: ctx.session.user.id,
            lessonId: input.lessonId,
          },
        },
        create: {
          userId: ctx.session.user.id,
          lessonId: input.lessonId,
          completed: input.completed,
        },
        update: {
          completed: input.completed,
        },
      })
      return progress
    }),

  getProgress: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: courseId }) => {
      const progress = await ctx.prisma.lessonProgress.findMany({
        where: {
          userId: ctx.session.user.id,
          lesson: {
            module: {
              courseId,
            },
          },
        },
      })
      return progress
    }),
}) 