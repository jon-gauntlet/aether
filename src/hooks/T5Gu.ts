import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        enrollments: {
          include: {
            course: true,
          },
        },
      },
    })
    return user
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        image: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      })
      return user
    }),

  getEnrollments: protectedProcedure.query(async ({ ctx }) => {
    const enrollments = await ctx.prisma.enrollment.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        course: true,
      },
    })
    return enrollments
  }),
}) 