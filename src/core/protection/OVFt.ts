import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const notificationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await ctx.prisma.notification.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: 'desc' },
    })
    return notifications
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        content: z.string(),
        type: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin or instructor
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })
      if (user?.role !== 'ADMIN' && user?.role !== 'INSTRUCTOR') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins and instructors can create notifications',
        })
      }

      const notification = await ctx.prisma.notification.create({
        data: input,
      })
      return notification
    }),

  markAsRead: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.prisma.notification.update({
        where: {
          id: input,
          userId: ctx.session.user.id,
        },
        data: { read: true },
      })
      return notification
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.notification.updateMany({
      where: { userId: ctx.session.user.id },
      data: { read: true },
    })
    return { success: true }
  }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.notification.delete({
        where: {
          id: input,
          userId: ctx.session.user.id,
        },
      })
      return { success: true }
    }),
}) 