import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const notificationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await ctx.prisma.notification.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return notifications
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        message: z.string(),
        type: z.enum(['info', 'success', 'warning', 'error']),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only admins and instructors can create notifications
      if (!['ADMIN', 'INSTRUCTOR'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins and instructors can create notifications',
        })
      }

      const notification = await ctx.prisma.notification.create({
        data: {
          title: input.title,
          message: input.message,
          type: input.type,
          userId: input.userId,
          createdById: ctx.session.user.id,
        },
      })
      return notification
    }),

  markAsRead: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const notification = await ctx.prisma.notification.update({
        where: {
          id_userId: {
            id,
            userId: ctx.session.user.id,
          },
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      })
      return notification
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.notification.updateMany({
      where: {
        userId: ctx.session.user.id,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })
    return true
  }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      await ctx.prisma.notification.delete({
        where: {
          id_userId: {
            id,
            userId: ctx.session.user.id,
          },
        },
      })
      return true
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.notification.count({
      where: {
        userId: ctx.session.user.id,
        read: false,
      },
    })
    return count
  }),
}) 