import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const courseRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const courses = await ctx.prisma.course.findMany({
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    })
    return courses
  }),

  byId: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const course = await ctx.prisma.course.findUnique({
        where: { id: input },
        include: {
          modules: {
            include: {
              lessons: true,
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
      return course
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        modules: z.array(
          z.object({
            title: z.string(),
            description: z.string(),
            order: z.number(),
            lessons: z.array(
              z.object({
                title: z.string(),
                content: z.string(),
                order: z.number(),
              })
            ),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is instructor or admin
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })
      if (user?.role !== 'INSTRUCTOR' && user?.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only instructors can create courses',
        })
      }

      const course = await ctx.prisma.course.create({
        data: {
          title: input.title,
          description: input.description,
          modules: {
            create: input.modules.map((module) => ({
              title: module.title,
              description: module.description,
              order: module.order,
              lessons: {
                create: module.lessons.map((lesson) => ({
                  title: lesson.title,
                  content: lesson.content,
                  order: lesson.order,
                })),
              },
            })),
          },
        },
        include: {
          modules: {
            include: {
              lessons: true,
            },
          },
        },
      })
      return course
    }),

  enroll: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const enrollment = await ctx.prisma.enrollment.create({
        data: {
          userId: ctx.session.user.id,
          courseId: input,
          status: 'ACTIVE',
        },
        include: {
          course: true,
        },
      })
      return enrollment
    }),

  updateProgress: protectedProcedure
    .input(
      z.object({
        lessonId: z.string(),
        completed: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const progress = await ctx.prisma.progress.upsert({
        where: {
          userId_lessonId: {
            userId: ctx.session.user.id,
            lessonId: input.lessonId,
          },
        },
        update: {
          completed: input.completed,
        },
        create: {
          userId: ctx.session.user.id,
          lessonId: input.lessonId,
          completed: input.completed,
        },
      })
      return progress
    }),
}) 